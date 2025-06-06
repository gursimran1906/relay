import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user (middleware ensures user is authenticated)
    const user = await getAuthenticatedUser();

    const { reportData, timeRange } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: "Report data is required" },
        { status: 400 }
      );
    }

    // Prepare data for AI analysis
    const analysisData = {
      totalIssues: reportData.totalIssues,
      openIssues: reportData.openIssues,
      resolvedIssues: reportData.resolvedIssues,
      criticalIssues: reportData.criticalIssues,
      issuesByStatus: reportData.issuesByStatus,
      issuesByPriority: reportData.issuesByPriority,
      issuesByMonth: reportData.issuesByMonth,
      timeRange,
      recentIssues: reportData.recentIssues.slice(0, 5).map((issue: any) => ({
        description: issue.description,
        status: issue.status,
        urgency: issue.urgency,
        isCritical: issue.is_critical,
        issueType: issue.issue_type,
        assetName: issue.items?.name,
        location: issue.items?.location,
        reportedAt: issue.reported_at,
      })),
    };

    const prompt = `
You are an AI assistant specializing in asset management and issue analysis. Analyze the following report data and provide insights:

Report Data:
${JSON.stringify(analysisData, null, 2)}

Please provide:
1. A concise summary (2-3 sentences) of the current state of issues
2. 3-5 key insights about patterns, trends, or notable findings
3. 3-5 actionable recommendations for improvement

Focus on:
- Issue resolution rates and trends
- Priority distribution and critical issues
- Patterns in asset locations or types
- Seasonal or temporal trends
- Operational efficiency opportunities

Respond in JSON format:
{
  "summary": "Brief overview of the current situation",
  "keyInsights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}
`;

    // Create a readable stream for Server-Sent Events with fast streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ai.models.generateContentStream({
            model: "gemini-2.0-flash",
            contents: prompt,
          });

          let accumulatedText = "";

          for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
              accumulatedText += chunkText;

              // Send each word/chunk as it arrives for fastest streaming
              const data = JSON.stringify({
                type: "chunk",
                content: chunkText,
                accumulated: accumulatedText,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Try to parse the complete response
          try {
            const cleanedResponse = accumulatedText
              .replace(/```json\n?|\n?```/g, "")
              .trim();
            const parsedResponse = JSON.parse(cleanedResponse);

            // Send the final parsed response
            const finalData = JSON.stringify({
              type: "complete",
              data: parsedResponse,
            });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          } catch (parseError) {
            console.error("Error parsing Gemini response:", parseError);

            // Send fallback response
            const fallbackData = JSON.stringify({
              type: "complete",
              data: {
                summary:
                  "Analysis completed. Please review the detailed metrics above for insights into your asset management performance.",
                keyInsights: [
                  "Issue tracking data has been analyzed",
                  "Patterns in asset performance identified",
                  "Operational metrics reviewed",
                ],
                recommendations: [
                  "Continue monitoring critical issues closely",
                  "Review asset maintenance schedules",
                  "Consider preventive maintenance strategies",
                ],
              },
            });
            controller.enqueue(encoder.encode(`data: ${fallbackData}\n\n`));
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);

          // Send error message
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Accel-Buffering": "no", // Disable nginx buffering for faster streaming
      },
    });
  } catch (error) {
    console.error("Error generating AI summary:", error);

    // Check if it's a Gemini API error
    if (
      error instanceof Error &&
      (error.message.includes("API key") ||
        error.message.includes("GEMINI_API_KEY"))
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini API key not configured. Please add GEMINI_API_KEY to environment variables.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate AI summary" },
      { status: 500 }
    );
  }
}
