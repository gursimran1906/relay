import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found error
      console.error("Error fetching notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Default preferences if none exist
    const defaultPreferences = {
      // SMS Settings
      sms_enabled: false,
      phone_number: "",

      // Email Settings
      email_enabled: true,

      // Quiet Hours
      quiet_hours_enabled: false,
      quiet_start: "22:00",
      quiet_end: "08:00",

      // Digest Settings
      daily_digest: false,
      weekly_digest: true,
    };

    const preferences = profile?.notification_preferences || defaultPreferences;

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error in GET /api/notifications/preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();

    const preferences = await request.json();

    // Validate phone number format if SMS is enabled
    if (preferences.sms_enabled && preferences.phone_number) {
      if (!isValidPhoneNumber(preferences.phone_number)) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 }
        );
      }
    }

    // Check if profile exists, create if not
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Create profile with notification preferences
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          notification_preferences: preferences,
        },
      ]);

      if (insertError) {
        console.error("Error creating profile:", insertError);
        return NextResponse.json(
          { error: "Failed to save preferences" },
          { status: 500 }
        );
      }
    } else {
      // Update existing profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ notification_preferences: preferences })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating preferences:", updateError);
        return NextResponse.json(
          { error: "Failed to save preferences" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/notifications/preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Utility functions
function isValidPhoneNumber(phone: string) {
  // Basic phone number validation - adjust regex as needed
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
}
