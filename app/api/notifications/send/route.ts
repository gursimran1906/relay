import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Define interface for notification preferences
interface NotificationPreferences {
  sms_enabled?: boolean;
  email_enabled?: boolean;
  phone_number?: string;
  [key: string]: any; // Allow additional properties
}

// Mock notification services - replace with actual implementations
const sendSMS = async (phoneNumber: string, message: string) => {
  // Using Twilio or similar SMS service
  console.log(`SMS to ${phoneNumber}: ${message}`);

  // Example Twilio implementation:
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({
  //   body: message,
  //   from: '+1234567890',
  //   to: phoneNumber
  // });

  return { success: true };
};

const sendEmail = async (email: string, subject: string, body: string) => {
  // Using email service like SendGrid, AWS SES, etc.
  console.log(`Email to ${email}: ${subject} - ${body}`);

  // Example SendGrid implementation:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@yourapp.com',
  //   subject: subject,
  //   text: body,
  //   html: `<p>${body}</p>`
  // });

  return { success: true };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      issueId,
      itemId,
      description,
      isCritical,
      urgency,
      // New fields for internal calls
      itemName,
      itemLocation,
      itemOwnerId,
      isInternalCall = false,
    } = body;

    const supabase = await createClient();
    let user;
    let userEmail;
    let preferences: NotificationPreferences = {};

    if (isInternalCall && itemOwnerId) {
      // For internal calls (like from report-issue API), we use the item owner's ID
      // and bypass authentication since this is a server-to-server call
      const { data: userData } = await supabase.auth.admin.getUserById(
        itemOwnerId
      );
      if (userData?.user) {
        user = userData.user;
        userEmail = user.email;

        // Get user notification preferences
        const { data: profile } = await supabase
          .from("profiles")
          .select("notification_preferences")
          .eq("id", itemOwnerId)
          .single();

        preferences =
          (profile?.notification_preferences as NotificationPreferences) || {};
      } else {
        console.log("Could not find item owner for notifications");
        return NextResponse.json({ success: true, notifications_sent: 0 });
      }
    } else {
      // For regular authenticated calls
      user = await getAuthenticatedUser();
      userEmail = user.email;

      // Get user notification preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      preferences =
        (profile?.notification_preferences as NotificationPreferences) || {};
    }

    // Use provided item details or fetch from database
    let finalItemName = itemName;
    let finalLocation = itemLocation;

    if (!finalItemName || !finalLocation) {
      const { data: item } = await supabase
        .from("items")
        .select("name, location")
        .eq("id", itemId)
        .single();

      finalItemName = item?.name || finalItemName || "Unknown Item";
      finalLocation = item?.location || finalLocation || "Unknown Location";
    }

    // Compose notification message
    const baseMessage = `${
      isCritical ? "CRITICAL ISSUE" : "New Issue"
    }: ${description}`;
    const fullMessage = `${baseMessage}\n\nItem: ${finalItemName}\nLocation: ${finalLocation}\nUrgency: ${urgency}`;

    const results = [];

    if (isCritical) {
      // Send SMS for critical issues
      if (preferences.sms_enabled && preferences.phone_number) {
        const smsResult = await sendSMS(
          preferences.phone_number,
          `🚨 ${fullMessage}`
        );
        results.push({ type: "sms", success: smsResult.success });
      }

      // Send email for critical issues
      if (preferences.email_enabled && userEmail) {
        const emailResult = await sendEmail(
          userEmail,
          `🚨 Critical Issue Reported: ${finalItemName}`,
          fullMessage
        );
        results.push({ type: "email", success: emailResult.success });
      }
    } else {
      // Send email for normal issues
      if (preferences.email_enabled && userEmail) {
        const emailResult = await sendEmail(
          userEmail,
          `New Issue Reported: ${finalItemName}`,
          fullMessage
        );
        results.push({ type: "email", success: emailResult.success });
      }
    }

    return NextResponse.json({
      success: true,
      notifications_sent: results.length,
      results,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
