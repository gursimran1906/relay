# AI Features Setup Guide

This guide covers setting up AI-powered features in the Relay Asset Management system using Google's Gemini API.

## Prerequisites

1. Google AI Studio account (sign up at https://makersuite.google.com/app/apikey)
2. Gemini API key with access to Gemini Pro model

## Environment Configuration

Add the following to your `.env.local` file:

```bash
# Google Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

## Features Overview

### 1. Natural Language Query Processing

Transform natural language questions into structured database queries:

**Examples:**

- "Show me all critical issues from last week"
- "Find open maintenance requests in Building A"
- "What issues were resolved this month?"

**Technical Implementation:**

- Uses Gemini Pro model for query interpretation
- Converts natural language to structured filters
- Applies filters to Supabase database queries
- Returns formatted results with metadata

### 2. AI-Generated Reports & Insights

Generate intelligent summaries and recommendations from asset data:

**Features:**

- Executive summary generation
- Trend analysis and pattern recognition
- Actionable recommendations
- Performance insights

**Data Analysis Includes:**

- Issue resolution rates
- Priority distribution patterns
- Location-based trends
- Temporal analysis
- Resource utilization insights

## API Endpoints

### `/api/ai/natural-language-query`

**Purpose:** Convert natural language to database queries
**Method:** POST
**Payload:**

```json
{
  "query": "string",
  "userId": "string"
}
```

**Response:**

```json
{
  "results": [...],
  "query": "string",
  "filters": {...},
  "totalFound": number
}
```

### `/api/ai/generate-summary`

**Purpose:** Generate AI insights from report data
**Method:** POST
**Payload:**

```json
{
  "reportData": {...},
  "timeRange": "string"
}
```

**Response:**

```json
{
  "summary": "string",
  "keyInsights": [...],
  "recommendations": [...]
}
```

## Security & Privacy

### Data Protection

- User data is anonymized before sending to Gemini
- No personally identifiable information (PII) transmitted
- Asset IDs and sensitive details filtered out
- Only aggregated, anonymized data sent to Google AI

### Access Control

- All AI endpoints require user authentication
- User isolation enforced (users only access their data)
- Rate limiting applied per user
- Audit logging for AI feature usage

### Error Handling

- Graceful fallbacks when Gemini API unavailable
- Local processing backup for critical functions
- User-friendly error messages
- Comprehensive logging for debugging

## Rate Limits & Usage

### Gemini API Limits

- Standard tier: 60 requests per minute
- Requests are automatically queued and retried
- Fallback responses provided during high usage

### Optimization

- Response caching for common queries
- Request batching where applicable
- Efficient prompt engineering to minimize token usage

## Monitoring & Analytics

### Performance Tracking

Monitor your Gemini usage through:

1. Google AI Studio Console (https://makersuite.google.com)
2. Application logs for response times
3. User satisfaction metrics

### Cost Management

- Track API usage and costs
- Set up billing alerts in Google Cloud Console
- Monitor token consumption patterns

### Data Insights

- Only aggregated, anonymized data sent to Google AI
- No personal information or sensitive asset details shared
- Full audit trail of AI interactions

## Development Setup

### 1. Local Development

1. Set up Gemini API key in `.env.local`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Test AI endpoints using provided examples

### 2. Production Deployment

1. Configure production Gemini API key
2. Set up monitoring and alerting
3. Enable request logging
4. Test AI functionality in staging environment

## Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**

   - Solution: Add `GEMINI_API_KEY` to environment variables
   - Verify key is active in Google AI Studio

2. **Rate limit exceeded**

   - Solution: Implement request throttling
   - Verify Google AI account has sufficient quota

3. **Invalid JSON response**
   - Solution: Update prompt engineering
   - Check Gemini model response format

### Debug Mode

Enable detailed logging:

```bash
DEBUG=gemini:*
```

### Health Checks

Test AI functionality:

1. Natural language query test: "Show me recent issues"
2. Summary generation test with sample data
3. Error handling test with invalid inputs

### Support Resources

1. Check Google AI service status: https://status.cloud.google.com
2. Google AI Studio documentation: https://ai.google.dev/docs
3. Gemini API reference: https://ai.google.dev/api/rest

## Best Practices

### Query Optimization

- Use specific, targeted queries
- Avoid overly broad requests
- Include relevant context in prompts

### Error Handling

- Always provide fallback responses
- Implement retry logic with exponential backoff
- Log errors for analysis and improvement

### User Experience

- Show loading states during AI processing
- Provide clear feedback on AI-generated content
- Allow users to refine queries if needed

### Performance

- Cache frequently requested insights
- Batch multiple queries when possible
- Use streaming responses for long-running analysis

This setup provides powerful AI capabilities while maintaining security, privacy, and performance standards for your asset management system.
