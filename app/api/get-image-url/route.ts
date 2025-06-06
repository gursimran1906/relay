import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { imagePath } = await request.json();

    if (!imagePath) {
      return NextResponse.json(
        { error: "Image path is required" },
        { status: 400 }
      );
    }

    // Use authenticated Supabase client
    const supabase = await createClient();

    // Check if user is authenticated
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

    // Generate signed URL (expires in 1 hour)
    const { data, error } = await supabase.storage
      .from("issue-attachments")
      .createSignedUrl(imagePath, 3600); // 3600 seconds = 1 hour

    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json(
        { error: "Failed to generate image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error in get-image-url API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
