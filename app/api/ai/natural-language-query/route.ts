import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface IssueWithItems {
  id: number;
  description: string;
  status: string;
  urgency: string;
  reported_at: string;
  items?: {
    name?: string;
    location?: string;
    user_id: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user (middleware ensures user is authenticated)
    const user = await getAuthenticatedUser();

    const { query, userId } = await request.json();

    if (!query || !userId) {
      return NextResponse.json(
        { error: "Query and userId are required" },
        { status: 400 }
      );
    }

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, let AI interpret the natural language query and convert it to SQL-like filters
    const interpretationPrompt = `
You are an AI assistant that converts natural language queries about asset management issues into structured filters.

User query: "${query}"

Convert this query into a JSON object with the following possible filters:
- status: array of status values ("open", "in_progress", "resolved")
- urgency: array of urgency values ("low", "medium", "high", "critical")
- dateRange: object with "start" and "end" dates (ISO format) or "days" for relative dates
- searchTerms: array of keywords to search in description
- assetLocation: string for location filtering
- assetName: string for asset name filtering

Examples:
"Show me all critical issues from last week" -> {"urgency": ["critical"], "dateRange": {"days": 7}}
"Open issues in Building A" -> {"status": ["open"], "assetLocation": "Building A"}
"All resolved maintenance issues" -> {"status": ["resolved"], "searchTerms": ["maintenance"]}

Respond only with valid JSON:
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: interpretationPrompt,
    });

    const interpretationResponse = result.text;

    if (!interpretationResponse) {
      throw new Error("No interpretation response from Gemini");
    }

    let filters;
    try {
      // Clean the response in case it has markdown formatting
      const cleanedResponse = interpretationResponse
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      filters = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Error parsing interpretation response:", parseError);
      // Fallback to basic text search
      filters = {
        searchTerms: query.split(" ").filter((word: string) => word.length > 2),
      };
    }

    // Build Supabase query based on interpreted filters
    let supabaseQuery = supabase
      .from("issues")
      .select(
        `
        *,
        items!inner (
          name,
          location,
          user_id
        )
      `
      )
      .eq("items.user_id", userId)
      .order("reported_at", { ascending: false });

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      supabaseQuery = supabaseQuery.in("status", filters.status);
    }

    // Apply urgency filter (previously priority)
    if (filters.urgency && filters.urgency.length > 0) {
      supabaseQuery = supabaseQuery.in("urgency", filters.urgency);
    }

    // Also support legacy priority filter for backward compatibility
    if (filters.priority && filters.priority.length > 0) {
      supabaseQuery = supabaseQuery.in("urgency", filters.priority);
    }

    // Apply date range filter
    if (filters.dateRange) {
      if (filters.dateRange.days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - filters.dateRange.days);
        supabaseQuery = supabaseQuery.gte("reported_at", daysAgo.toISOString());
      } else if (filters.dateRange.start && filters.dateRange.end) {
        supabaseQuery = supabaseQuery
          .gte("reported_at", filters.dateRange.start)
          .lte("reported_at", filters.dateRange.end);
      }
    }

    // Execute the query
    const { data: issues, error: queryError } = await supabaseQuery.limit(50);

    if (queryError) {
      console.error("Supabase query error:", queryError);
      throw queryError;
    }

    let results = issues || [];

    // Apply text-based filters (search terms, asset location, asset name)
    if (filters.searchTerms && filters.searchTerms.length > 0) {
      const searchTermsLower = filters.searchTerms.map((term: string) =>
        term.toLowerCase()
      );
      results = results.filter((issue: IssueWithItems) => {
        const searchableText = issue.description.toLowerCase();
        return searchTermsLower.some((term: string) =>
          searchableText.includes(term)
        );
      });
    }

    if (filters.assetLocation) {
      const locationLower = filters.assetLocation.toLowerCase();
      results = results.filter((issue: IssueWithItems) =>
        issue.items?.location?.toLowerCase().includes(locationLower)
      );
    }

    if (filters.assetName) {
      const nameLower = filters.assetName.toLowerCase();
      results = results.filter((issue: IssueWithItems) =>
        issue.items?.name?.toLowerCase().includes(nameLower)
      );
    }

    return NextResponse.json({
      results: results.slice(0, 20), // Limit to 20 results for UI
      query,
      filters,
      totalFound: results.length,
    });
  } catch (error) {
    console.error("Error processing natural language query:", error);

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
      { error: "Failed to process natural language query" },
      { status: 500 }
    );
  }
}
