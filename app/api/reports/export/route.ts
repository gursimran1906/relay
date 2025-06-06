import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user (middleware ensures user is authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { reportData, timeRange, aiSummary } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: "Report data is required" },
        { status: 400 }
      );
    }

    // Generate HTML content for the report
    const htmlContent = generateReportHTML(reportData, timeRange, aiSummary);

    // For now, return the HTML content as a downloadable file
    // In a production environment, you might want to use a library like Puppeteer
    // to convert HTML to PDF
    const blob = new Blob([htmlContent], { type: "text/html" });

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="relay-report-${
          new Date().toISOString().split("T")[0]
        }.html"`,
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

function generateReportHTML(
  reportData: any,
  timeRange: string,
  aiSummary: any
) {
  const currentDate = new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relay Asset Management Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1f2937;
            margin: 0;
        }
        .header p {
            color: #6b7280;
            margin: 5px 0;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #3b82f6;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.9em;
        }
        .chart-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .bar-chart {
            margin: 20px 0;
        }
        .bar-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .bar-label {
            width: 120px;
            font-size: 0.9em;
        }
        .bar-visual {
            flex: 1;
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            margin: 0 10px;
            position: relative;
        }
        .bar-fill {
            height: 100%;
            background: #3b82f6;
            border-radius: 10px;
        }
        .bar-value {
            font-weight: bold;
            font-size: 0.9em;
        }
        .ai-summary {
            background: #f3f4f6;
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            margin: 20px 0;
        }
        .ai-summary h3 {
            color: #8b5cf6;
            margin-top: 0;
        }
        .insights-list, .recommendations-list {
            list-style: none;
            padding: 0;
        }
        .insights-list li, .recommendations-list li {
            background: white;
            margin: 10px 0;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #8b5cf6;
        }
        .recent-issues {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
        }
        .issue-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .issue-title {
            font-weight: bold;
            color: #1f2937;
        }
        .issue-meta {
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-open { background: #fef2f2; color: #dc2626; }
        .status-in_progress { background: #fef3c7; color: #d97706; }
        .status-resolved { background: #f0fdf4; color: #16a34a; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Asset Management Report</h1>
        <p>Generated on ${currentDate}</p>
        <p>Time Range: ${getTimeRangeLabel(timeRange)}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${reportData.totalIssues}</div>
                <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.openIssues}</div>
                <div class="stat-label">Open Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.resolvedIssues}</div>
                <div class="stat-label">Resolved Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.criticalIssues}</div>
                <div class="stat-label">Critical Issues</div>
            </div>
        </div>
    </div>

    ${
      aiSummary
        ? `
    <div class="section">
        <div class="ai-summary">
            <h3>🤖 AI-Powered Analysis</h3>
            <p><strong>Summary:</strong> ${aiSummary.summary}</p>
            
            ${
              aiSummary.keyInsights && aiSummary.keyInsights.length > 0
                ? `
            <h4>Key Insights:</h4>
            <ul class="insights-list">
                ${aiSummary.keyInsights
                  .map((insight: string) => `<li>⚡ ${insight}</li>`)
                  .join("")}
            </ul>
            `
                : ""
            }
            
            ${
              aiSummary.recommendations && aiSummary.recommendations.length > 0
                ? `
            <h4>Recommendations:</h4>
            <ul class="recommendations-list">
                ${aiSummary.recommendations
                  .map((rec: string) => `<li>📈 ${rec}</li>`)
                  .join("")}
            </ul>
            `
                : ""
            }
        </div>
    </div>
    `
        : ""
    }

    <div class="section">
        <h2>Issues by Status</h2>
        <div class="chart-section">
            <div class="bar-chart">
                ${reportData.issuesByStatus
                  .map((item: any) => {
                    const percentage =
                      reportData.totalIssues > 0
                        ? (item.count / reportData.totalIssues) * 100
                        : 0;
                    return `
                    <div class="bar-item">
                        <div class="bar-label">${item.status.replace(
                          "_",
                          " "
                        )}</div>
                        <div class="bar-visual">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${item.count}</div>
                    </div>
                  `;
                  })
                  .join("")}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Issues by Priority</h2>
        <div class="chart-section">
            <div class="bar-chart">
                ${reportData.issuesByPriority
                  .map((item: any) => {
                    const percentage =
                      reportData.totalIssues > 0
                        ? (item.count / reportData.totalIssues) * 100
                        : 0;
                    return `
                    <div class="bar-item">
                        <div class="bar-label">${item.priority}</div>
                        <div class="bar-visual">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${item.count}</div>
                    </div>
                  `;
                  })
                  .join("")}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Recent Issues</h2>
        <div class="recent-issues">
            ${reportData.recentIssues
              .slice(0, 10)
              .map(
                (issue: any) => `
                <div class="issue-item">
                    <div class="issue-title">${issue.description?.substring(
                      0,
                      100
                    )}${issue.description?.length > 100 ? "..." : ""}</div>
                    <div class="issue-meta">
                        <span class="status-badge status-${issue.status}">${
                  issue.status
                }</span>
                        • ${issue.items?.name || "Unknown Asset"} - ${
                  issue.items?.location || "Unknown Location"
                }
                        • ${new Date(issue.reported_at).toLocaleDateString()}
                        • Urgency: ${issue.urgency || "medium"}
                        ${issue.is_critical ? " • 🚨 CRITICAL" : ""}
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    </div>

    <div class="footer">
        <p>This report was generated by Relay Asset Management System</p>
        <p>For more detailed analysis, please visit the application dashboard</p>
    </div>
</body>
</html>
  `;
}

function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 3 months";
    case "1y":
      return "Last year";
    default:
      return "Custom range";
  }
}
