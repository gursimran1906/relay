import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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
    const supabase = await createClient();
    const user = await getAuthenticatedUser();

    const { issueId, itemId, description, isCritical, urgency } =
      await request.json();

    // Get user notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single();

    const preferences = profile?.notification_preferences || {};

    // Get item details
    const { data: item } = await supabase
      .from("items")
      .select("name, location")
      .eq("id", itemId)
      .single();

    const itemName = item?.name || "Unknown Item";
    const location = item?.location || "Unknown Location";

    // Compose notification message
    const baseMessage = `${
      isCritical ? "CRITICAL ISSUE" : "New Issue"
    }: ${description}`;
    const fullMessage = `${baseMessage}\n\nItem: ${itemName}\nLocation: ${location}\nUrgency: ${urgency}`;

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
      if (preferences.email_enabled && user.email) {
        const emailResult = await sendEmail(
          user.email,
          `New Issue Reported: ${itemName}`,
          fullMessage
        );
        results.push({ type: "email", success: emailResult.success });
      }
    } else {
      // Send email for normal issues
      if (preferences.email_enabled && user.email) {
        const emailResult = await sendEmail(
          user.email,
          `New Issue Reported: ${itemName}`,
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
