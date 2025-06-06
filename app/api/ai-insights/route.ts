import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || "" });

interface AIInsight {
  type:
    | "prediction"
    | "risk"
    | "anomaly"
    | "maintenance"
    | "action"
    | "positive"
    | "warning";
  category:
    | "maintenance"
    | "failure_risk"
    | "anomaly"
    | "downtime"
    | "recommendation"
    | "performance";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low" | "info";
  confidence: number;
  timeline?: string;
  affected_items?: string[];
  cost_impact?: "high" | "medium" | "low";
  action_required?: boolean;
}

interface Item {
  id: number;
  name: string;
  type: string;
  status: string;
  location: string;
  created_at: string;
  last_maintenance?: string;
  user_id: string;
}

interface Issue {
  id: number;
  item_id: number;
  description: string;
  status: string;
  reported_at: string;
  is_critical: boolean;
  urgency: string;
  issue_type: string | null;
  items?: {
    user_id: string;
    name: string;
    type: string;
    location: string;
    status: string;
    created_at: string;
    last_maintenance?: string;
  };
}

interface RepeatOffender {
  item: Item | undefined;
  issueCount: number;
  issues: Issue[];
  lastIssue: string;
}

interface ProcessedItem {
  id: number;
  name: string;
  type: string;
  status: string;
  location: string;
  age: number;
  lastMaintenance?: string;
  issueCount: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();

    // Fetch comprehensive data for AI analysis
    const { data: itemsData } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id);

    const { data: issuesData } = await supabase
      .from("issues")
      .select(
        `
        *,
        items!inner(user_id, name, type, location, status, created_at, last_maintenance)
      `
      )
      .eq("items.user_id", user.id)
      .order("reported_at", { ascending: false });

    // Fallback to rule-based insights if Gemini is not available
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({
        insights: generateRuleBasedInsights(itemsData || [], issuesData || []),
        source: "rule-based",
      });
    }

    // Prepare data summary for AI analysi

    const dataForAI = prepareDataForAI(itemsData || [], issuesData || []);

    try {
      // Generate AI insights using Gemini
      const aiInsights = await generateGeminiInsights(dataForAI);

      // Combine AI insights with rule-based insights for comprehensive analysis
      const ruleBasedInsights = generateRuleBasedInsights(
        itemsData || [],
        issuesData || []
      );
      const combinedInsights = [...aiInsights, ...ruleBasedInsights];

      // Remove duplicates and prioritize insights
      const uniqueInsights = prioritizeInsights(combinedInsights);

      return NextResponse.json({
        insights: uniqueInsights.slice(0, 8), // Limit to top 8 insights
        source: "ai-enhanced",
      });
    } catch (aiError) {
      console.warn(
        "Gemini AI error, falling back to rule-based insights:",
        aiError
      );
      return NextResponse.json({
        insights: generateRuleBasedInsights(itemsData || [], issuesData || []),
        source: "rule-based-fallback",
      });
    }
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

function prepareDataForAI(items: Item[], issues: Issue[]) {
  // Calculate key metrics
  const totalItems = items.length;
  const activeItems = items.filter((item) => item.status === "active").length;
  const maintenanceNeeded = items.filter(
    (item) => item.status === "maintenance_needed"
  ).length;
  const totalIssues = issues.length;
  const criticalIssues = issues.filter((issue) => issue.is_critical).length;

  // Analyze issue patterns by item
  const itemIssueMap = new Map<number, Issue[]>();
  issues.forEach((issue) => {
    const itemId = issue.item_id;
    if (!itemIssueMap.has(itemId)) {
      itemIssueMap.set(itemId, []);
    }
    itemIssueMap.get(itemId)!.push(issue);
  });

  // Find repeat offenders (items with multiple issues)
  const repeatOffenders: RepeatOffender[] = Array.from(itemIssueMap.entries())
    .filter(([itemId, itemIssues]) => itemIssues.length >= 3)
    .map(([itemId, itemIssues]) => {
      const item = items.find((i) => i.id === itemId);
      return {
        item: item,
        issueCount: itemIssues.length,
        issues: itemIssues,
        lastIssue: itemIssues[0]?.reported_at || "",
      };
    });

  // Analyze issue trends over time
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const recentIssues = issues.filter(
    (issue) => new Date(issue.reported_at) >= last30Days
  );

  // Group issues by type
  const issuesByType: Record<string, number> = {};
  issues.forEach((issue) => {
    const type = issue.issue_type || "general";
    issuesByType[type] = (issuesByType[type] || 0) + 1;
  });

  return {
    summary: {
      totalItems,
      activeItems,
      maintenanceNeeded,
      totalIssues,
      criticalIssues,
      recentIssues: recentIssues.length,
      resolutionRate:
        totalIssues > 0
          ? Math.round(
              ((totalIssues -
                issues.filter((i) => i.status === "open").length) /
                totalIssues) *
                100
            )
          : 0,
    },
    repeatOffenders,
    issuesByType,
    recentTrends: {
      last30DaysIssues: recentIssues.length,
      criticalTrend: recentIssues.filter((i) => i.is_critical).length,
    },
    items: items.map(
      (item): ProcessedItem => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        location: item.location,
        age: item.created_at
          ? Math.floor(
              (Date.now() - new Date(item.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
        lastMaintenance: item.last_maintenance,
        issueCount: itemIssueMap.get(item.id)?.length || 0,
      })
    ),
  };
}

async function generateGeminiInsights(data: any): Promise<AIInsight[]> {
  const prompt = `
As an AI maintenance expert, analyze the following equipment data and provide predictive maintenance insights.

Data Summary:
- Total Items: ${data.summary.totalItems}
- Active Items: ${data.summary.activeItems}
- Items Needing Maintenance: ${data.summary.maintenanceNeeded}
- Total Issues: ${data.summary.totalIssues}
- Critical Issues: ${data.summary.criticalIssues}
- Recent Issues (30 days): ${data.summary.recentIssues}
- Resolution Rate: ${data.summary.resolutionRate}%

Repeat Offenders (items with 3+ issues):
${data.repeatOffenders
  .map(
    (ro: RepeatOffender) =>
      `- ${ro.item?.name || "Item #" + ro.item?.id} (${ro.item?.type}): ${
        ro.issueCount
      } issues, Location: ${ro.item?.location}`
  )
  .join("\n")}

Issue Types Distribution:
${Object.entries(data.issuesByType)
  .map(([type, count]) => `- ${type}: ${count} issues`)
  .join("\n")}

Items by Age and Issues:
${data.items
  .slice(0, 10)
  .map(
    (item: ProcessedItem) =>
      `- ${item.name} (${item.type}): Age ${item.age} days, Status: ${item.status}, Issues: ${item.issueCount}`
  )
  .join("\n")}

Based on this data, provide 5-6 specific insights in this exact JSON format:
[
  {
    "type": "prediction|risk|anomaly|maintenance|action",
    "category": "maintenance|failure_risk|anomaly|downtime|recommendation",
    "title": "Brief insight title",
    "description": "Detailed insight with specific data",
    "priority": "critical|high|medium|low",
    "confidence": 85,
    "timeline": "within X days/weeks",
    "affected_items": ["item names if specific"],
    "cost_impact": "high|medium|low",
    "action_required": true|false
  }
]

Focus on:
1. Predicted Maintenance Needs (items likely to need maintenance soon)
2. Failure Risk Forecasts (items with high failure probability)
3. Anomaly Detection (unusual patterns in the data)
4. Expected Downtime predictions
5. AI-Recommended Actions (prioritized maintenance tasks)

Make predictions specific with timeframes and confidence levels. Reference actual item names and data points from the analysis.
`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash-001",
    contents: prompt,
  });

  try {
    // Extract JSON from the response
    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return insights.map((insight: any) => ({
        ...insight,
        confidence: insight.confidence || 75,
      }));
    }
  } catch (parseError) {
    console.warn("Failed to parse Gemini response as JSON:", parseError);
  }

  return [];
}

function generateRuleBasedInsights(
  items: Item[],
  issues: Issue[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Calculate basic metrics
  const totalItems = items.length;
  const activeItems = items.filter((item) => item.status === "active").length;
  const maintenanceNeeded = items.filter(
    (item) => item.status === "maintenance_needed"
  ).length;
  const totalIssues = issues.length;
  const criticalIssues = issues.filter((issue) => issue.is_critical).length;

  // Analyze repeat offenders
  const itemIssueMap = new Map<number, Issue[]>();
  issues.forEach((issue) => {
    const itemId = issue.item_id;
    if (!itemIssueMap.has(itemId)) {
      itemIssueMap.set(itemId, []);
    }
    itemIssueMap.get(itemId)!.push(issue);
  });

  const repeatOffenders = Array.from(itemIssueMap.entries())
    .filter(([itemId, itemIssues]) => itemIssues.length >= 3)
    .map(([itemId, itemIssues]) => {
      const item = items.find((i) => i.id === itemId);
      return { item, issueCount: itemIssues.length };
    });

  // Predicted Maintenance Needs
  if (repeatOffenders.length > 0) {
    const topOffender = repeatOffenders[0];
    insights.push({
      type: "prediction",
      category: "maintenance",
      title: "Predicted Maintenance Need",
      description: `${
        topOffender.item?.name || "Item #" + topOffender.item?.id
      } has ${
        topOffender.issueCount
      } reported issues and is likely to require maintenance within 7-10 days.`,
      priority: "high",
      confidence: 82,
      timeline: "7-10 days",
      affected_items: [
        topOffender.item?.name || "Item #" + topOffender.item?.id,
      ],
      cost_impact: "medium",
      action_required: true,
    });
  }

  // Failure Risk Forecast
  const highRiskItems = items.filter((item) => {
    const itemIssues = itemIssueMap.get(item.id) || [];
    const age = item.created_at
      ? Math.floor(
          (Date.now() - new Date(item.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
    return itemIssues.length >= 2 && age > 180; // Items with 2+ issues and older than 6 months
  });

  if (highRiskItems.length > 0) {
    insights.push({
      type: "risk",
      category: "failure_risk",
      title: "Failure Risk Forecast",
      description: `${highRiskItems.length} items show high failure probability within 30 days based on issue frequency and age patterns.`,
      priority: "high",
      confidence: 78,
      timeline: "within 30 days",
      affected_items: highRiskItems.slice(0, 3).map((item) => item.name),
      cost_impact: "high",
      action_required: true,
    });
  }

  // Anomaly Detection
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentIssues = issues.filter(
    (issue) => new Date(issue.reported_at) >= last7Days
  );

  if (recentIssues.length > totalIssues * 0.3) {
    // More than 30% of issues in last 7 days
    insights.push({
      type: "anomaly",
      category: "anomaly",
      title: "Anomaly Detection",
      description: `Unusual spike detected: ${
        recentIssues.length
      } issues reported in the last 7 days (${Math.round(
        (recentIssues.length / totalIssues) * 100
      )}% of total issues).`,
      priority: "medium",
      confidence: 85,
      timeline: "ongoing",
      cost_impact: "medium",
      action_required: true,
    });
  }

  // Expected Downtime
  const downtimeHours = Math.max(criticalIssues * 4 + maintenanceNeeded * 2, 0);
  if (downtimeHours > 0) {
    insights.push({
      type: "prediction",
      category: "downtime",
      title: "Expected Downtime",
      description: `Projected downtime for next month is approximately ${downtimeHours} hours based on current critical issues and maintenance needs.`,
      priority: downtimeHours > 20 ? "high" : "medium",
      confidence: 72,
      timeline: "next 30 days",
      cost_impact: downtimeHours > 20 ? "high" : "medium",
      action_required: downtimeHours > 20,
    });
  }

  // AI-Recommended Actions
  if (criticalIssues > 0 || maintenanceNeeded > 0) {
    insights.push({
      type: "action",
      category: "recommendation",
      title: "AI-Recommended Actions",
      description: `Prioritize servicing of ${criticalIssues} critical issues and ${maintenanceNeeded} maintenance items. Focus on high-cost, high-risk equipment first.`,
      priority: "medium",
      confidence: 90,
      cost_impact: "low",
      action_required: true,
    });
  }

  // Performance insights
  const activePercentage =
    totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0;
  if (activePercentage >= 85) {
    insights.push({
      type: "positive",
      category: "performance",
      title: "Excellent Equipment Health",
      description: `${activePercentage}% operational efficiency achieved. Your proactive maintenance strategy is delivering strong results.`,
      priority: "info",
      confidence: 95,
      cost_impact: "low",
      action_required: false,
    });
  }

  return insights;
}

function prioritizeInsights(insights: AIInsight[]): AIInsight[] {
  const priorityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    info: 0,
  };

  return insights
    .sort((a, b) => {
      // Sort by priority first
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by confidence
      return (b.confidence || 0) - (a.confidence || 0);
    })
    .filter((insight, index, array) => {
      // Remove duplicates with similar titles
      return (
        array.findIndex((other) =>
          other.title
            .toLowerCase()
            .includes(insight.title.toLowerCase().split(" ")[0])
        ) === index
      );
    });
}
