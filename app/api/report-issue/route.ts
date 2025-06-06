import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemId,
      itemUid,
      issueType,
      urgency,
      description,
      reporterName,
      reporterEmail,
      isCritical,
      imagePath,
      metadata,
    } = body;

    // Validate required fields - need either itemId or itemUid
    if (!itemId && !itemUid) {
      return NextResponse.json(
        {
          error: "Missing required fields (need itemId or itemUid)",
        },
        { status: 400 }
      );
    }

    const supabase = await createPublicClient();

    // Use itemId if provided, otherwise we'll need to handle itemUid differently
    // For now, if only itemUid is provided, we'll store it in metadata and use a placeholder itemId
    let actualItemId = itemId;

    if (!actualItemId && itemUid) {
      // Store the itemUid in metadata for reference and use 0 as placeholder
      // The system can resolve this later if needed
      actualItemId = 0;
    }

    // Prepare contact info
    const contactInfo = [reporterName, reporterEmail]
      .filter(Boolean)
      .join(" - ");

    // Merge provided metadata with source info
    const enhancedMetadata = {
      ...(metadata || {}),
      reporter_email: reporterEmail?.trim() || null,
      source: itemId ? "authenticated" : "qr_scan",
      submitted_at: new Date().toISOString(),
      // Store itemUid in metadata if that's what was provided
      ...(itemUid && !itemId ? { original_item_uid: itemUid } : {}),
    };

    // Determine if issue is critical
    const isIssueCritical =
      isCritical || urgency === "critical" || urgency === "high";

    // Create issue report using existing issues table
    const { data, error } = await supabase.from("issues").insert([
      {
        item_id: actualItemId,
        description: description?.trim() || null,
        issue_type: issueType || null,
        urgency: urgency || "medium",
        reported_by: reporterName?.trim() || null,
        contact_info: contactInfo || null,
        is_critical: isIssueCritical,
        status: "open",
        image_path: imagePath || null,
        metadata: enhancedMetadata,
      },
    ]);

    if (error) {
      console.error("Error creating issue report:", error);
      return NextResponse.json(
        { error: "Failed to create issue report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isIssueCritical
        ? "Critical issue reported successfully!"
        : "Issue reported successfully!",
    });
  } catch (error) {
    console.error("Error in report-issue API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
