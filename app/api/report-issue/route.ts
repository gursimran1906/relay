import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemId,
      issueType,
      urgency,
      description,
      reporterName,
      reporterEmail,
      isCritical,
      imagePath,
      metadata,
    } = body;

    // Validate required fields
    if (!itemId || !description?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createPublicClient();

    // Prepare contact info
    const contactInfo = [reporterName, reporterEmail]
      .filter(Boolean)
      .join(" - ");

    // Merge provided metadata with source info
    const enhancedMetadata = {
      ...(metadata || {}),
      reporter_email: reporterEmail?.trim() || null,
      source: "qr_scan",
      submitted_at: new Date().toISOString(),
    };

    // Determine if issue is critical
    const isIssueCritical =
      isCritical || urgency === "critical" || urgency === "high";

    // Create issue report using existing issues table
    const { data, error } = await supabase
      .from("issues")
      .insert([
        {
          item_id: itemId,
          description: description.trim(),
          issue_type: issueType || null,
          urgency: urgency || "medium",
          reported_by: reporterName?.trim() || null,
          contact_info: contactInfo || null,
          is_critical: isIssueCritical,
          status: "open",
          image_path: imagePath || null,
          metadata: enhancedMetadata,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating issue report:", error);
      return NextResponse.json(
        { error: "Failed to create issue report" },
        { status: 500 }
      );
    }

    // Trigger notifications after successful issue creation
    try {
      const notificationResponse = await fetch(
        `${request.nextUrl.origin}/api/notifications/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            issueId: data.id,
            itemId: itemId,
            description: description.trim(),
            isCritical: isIssueCritical,
            urgency: urgency || "medium",
          }),
        }
      );

      if (!notificationResponse.ok) {
        console.error(
          "Failed to send notifications:",
          await notificationResponse.text()
        );
        // Don't fail the entire request if notifications fail
      } else {
        const notificationResult = await notificationResponse.json();
        console.log(
          `Sent ${notificationResult.notifications_sent} notifications for issue ${data.id}`
        );
      }
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError);
      // Don't fail the entire request if notifications fail
    }

    return NextResponse.json({
      success: true,
      issue: data,
      message: isIssueCritical
        ? "Critical issue reported successfully! Notifications have been sent."
        : "Issue reported successfully! Notifications have been sent.",
    });
  } catch (error) {
    console.error("Error in report-issue API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
