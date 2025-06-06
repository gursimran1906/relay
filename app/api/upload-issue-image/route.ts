import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const assetId = formData.get("assetId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Use authenticated Supabase client for private bucket
    const supabase = await createClient();

    // Check if user is authenticated (optional additional check)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const filename = `${assetId}-${timestamp}.${fileExt}`;
    const filePath = `issue-images/${filename}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase storage (private bucket)
    const { data, error } = await supabase.storage
      .from("issue-attachments")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return NextResponse.json(
        { error: "Failed to upload image to storage" },
        { status: 500 }
      );
    }

    // For private buckets, we'll return the path instead of public URL
    // The frontend will request signed URLs when needed
    return NextResponse.json({
      success: true,
      path: filePath,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
