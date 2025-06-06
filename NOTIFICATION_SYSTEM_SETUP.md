# Notification System Setup Guide

This guide will help you set up the notification system that sends alerts for issues based on their criticality.

## Overview

The notification system supports two channels:

- **SMS** for critical issues (via Twilio)
- **Email** for normal/critical issues (via SendGrid/AWS SES)

## Database Setup

First, ensure your `profiles` table has the `notification_preferences` column:

```sql
-- Add notification preferences column to profiles table
ALTER TABLE profiles
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "sms_enabled": false,
  "phone_number": "",
  "email_enabled": true,
  "quiet_hours_enabled": false,
  "quiet_start": "22:00",
  "quiet_end": "08:00",
  "daily_digest": false,
  "weekly_digest": true
}';
```

## SMS Setup (Twilio)

1. **Create Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)

2. **Get Credentials**:

   - Account SID
   - Auth Token
   - Phone Number

3. **Environment Variables**:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

4. **Update SMS Function** in `app/api/notifications/send/route.ts`:

```javascript
const sendSMS = async (phoneNumber: string, message: string) => {
  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  return { success: true };
};
```

5. **Install Twilio SDK**:

```bash
npm install twilio
```

## Email Setup (SendGrid)

1. **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)

2. **Get API Key**: Create an API key in SendGrid dashboard

3. **Environment Variables**:

```bash
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

4. **Update Email Function** in `app/api/notifications/send/route.ts`:

```javascript
const sendEmail = async (email: string, subject: string, body: string) => {
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: subject,
    text: body,
    html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
  });

  return { success: true };
};
```

5. **Install SendGrid SDK**:

```bash
npm install @sendgrid/mail
```

## Alternative: AWS SES Setup

If you prefer AWS SES over SendGrid:

1. **AWS Configuration**:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com
```

2. **Update Email Function**:

```javascript
const AWS = require("aws-sdk");
const ses = new AWS.SES({ region: process.env.AWS_REGION });

const sendEmail = async (email: string, subject: string, body: string) => {
  const params = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: {
        Text: { Data: body },
        Html: { Data: `<p>${body.replace(/\n/g, "<br>")}</p>` },
      },
      Subject: { Data: subject },
    },
    Source: process.env.SES_FROM_EMAIL,
  };

  await ses.sendEmail(params).promise();
  return { success: true };
};
```

3. **Install AWS SDK**:

```bash
npm install aws-sdk
```

## How Notifications Work

### Critical Issues

- **Triggers**: `urgency === "critical"` or `urgency === "high"` or `isCritical === true`
- **Channels**: SMS + Email (if enabled)
- **Message Format**: 🚨 CRITICAL ISSUE ALERT

### Normal Issues

- **Triggers**: All other issues
- **Channels**: Email (if normal issues enabled)
- **Message Format**: ⚠️ New Issue Reported

### Notification Flow

1. Issue is created via report API
2. System determines criticality
3. Fetches user notification preferences
4. Sends notifications to enabled channels
5. Logs results (doesn't fail if notifications fail)

## User Configuration

Users can configure notifications in Profile → Notifications tab:

- **SMS Settings**: Enable/disable + phone number
- **Email Settings**: Enable/disable (uses account email)
- **Quiet Hours**: Disable non-critical notifications during specified hours
- **Digest Options**: Daily/weekly summary emails

## Testing the System

1. **Test Critical Issue**:

```bash
curl -X POST http://localhost:3000/api/report-issue \
-H "Content-Type: application/json" \
-d '{
  "itemId": 1,
  "description": "Test critical issue",
  "urgency": "critical",
  "isCritical": true
}'
```

2. **Test Normal Issue**:

```bash
curl -X POST http://localhost:3000/api/report-issue \
-H "Content-Type: application/json" \
-d '{
  "itemId": 1,
  "description": "Test normal issue",
  "urgency": "medium"
}'
```

3. **Check Logs**: Monitor console for notification success/failure messages

## Security Considerations

- Store all API keys and tokens in environment variables
- Use HTTPS for all webhook URLs
- Validate phone numbers before sending SMS
- Implement rate limiting for notifications
- Don't expose sensitive data in notification messages

## Troubleshooting

### SMS Not Working

- Check Twilio credentials
- Verify phone number format (+1234567890)
- Check Twilio account balance
- Verify phone number is not blacklisted

### Email Not Working

- Check SendGrid/SES API key
- Verify sender email is authenticated
- Check email reputation
- Look for bounce/complaint notifications

### General Issues

- Check environment variables
- Verify database connection
- Look at API logs
- Test with simple curl commands

## Production Deployment

1. **Environment Variables**: Set all required variables in production
2. **DNS**: Ensure domain is configured for email sending
3. **SSL**: Use HTTPS for all API endpoints
4. **Monitoring**: Set up logging and alerting for notification failures
5. **Backup**: Configure alternative notification channels (email + SMS)
6. **Testing**: Test both SMS and email notifications in production environment

## Rate Limiting

Consider implementing rate limiting for notifications:

```javascript
// Example rate limiting by user
const userNotificationCounts = new Map();

const checkRateLimit = (userId: string) => {
  const now = Date.now();
  const userCount = userNotificationCounts.get(userId) || {
    count: 0,
    resetTime: now + 3600000,
  }; // 1 hour

  if (now > userCount.resetTime) {
    userCount.count = 0;
    userCount.resetTime = now + 3600000;
  }

  if (userCount.count >= 10) {
    // Max 10 notifications per hour
    return false;
  }

  userCount.count++;
  userNotificationCounts.set(userId, userCount);
  return true;
};
```

This notification system provides reliable, focused alerting for your issue management system with SMS for critical issues and email for all issues, while maintaining user control and preferences.
