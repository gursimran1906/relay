# AI Insights Setup Guide

This guide explains how to set up the enhanced AI-powered insights system that uses Google Gemini AI for predictive maintenance analytics.

## Overview

The AI Insights system provides:

- **Predicted Maintenance Needs**: AI forecasts which items likely need maintenance soon
- **Failure Risk Forecasts**: Identifies equipment with high failure probability
- **Anomaly Detection**: Spots unusual patterns in issue reports
- **Expected Downtime Predictions**: Estimates potential downtime based on current trends
- **AI-Recommended Actions**: Prioritized maintenance tasks and strategies

## Prerequisites

1. **Google AI Studio Account**: Sign up at [aistudio.google.com](https://aistudio.google.com)
2. **Node.js**: Version 18 or later
3. **Google GenAI Package**: Already installed (`@google/genai`)

## Setup Instructions

### 1. Get Google AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Choose your Google Cloud project or create a new one
4. Copy the generated API key

### 2. Configure Environment Variable

Add your API key to your environment variables:

```bash
# .env.local
GOOGLE_AI_API_KEY=your_api_key_here
```

**Security Note**: Never commit API keys to version control. Keep them in environment variables.

### 3. Verify Installation

The system automatically detects if the API key is available:

- **With API Key**: Uses Google Gemini AI for advanced insights
- **Without API Key**: Falls back to rule-based insights

## How It Works

### Data Analysis Process

1. **Data Collection**: Gathers comprehensive item and issue data
2. **Pattern Analysis**: Identifies repeat offenders, trends, and anomalies
3. **AI Processing**: Sends structured data to Gemini for advanced analysis
4. **Insight Generation**: Combines AI predictions with rule-based insights
5. **Prioritization**: Sorts insights by priority and confidence levels

### AI Insights Categories

#### 1. Predicted Maintenance Needs

- **What**: Items likely to require maintenance soon
- **Example**: "Item #X123 is likely to require maintenance within 7-10 days"
- **Based on**: Issue frequency, age, maintenance history

#### 2. Failure Risk Forecasts

- **What**: Equipment with high failure probability
- **Example**: "3 items show high failure probability within 30 days"
- **Based on**: Issue patterns, equipment age, failure history

#### 3. Anomaly Detection

- **What**: Unusual patterns in the data
- **Example**: "Unusual spike: 5 issues in last 7 days (75% of total issues)"
- **Based on**: Statistical analysis of issue timing and frequency

#### 4. Expected Downtime

- **What**: Projected downtime based on current issues
- **Example**: "Projected downtime: 12 hours next month"
- **Based on**: Critical issues, maintenance needs, historical data

#### 5. AI-Recommended Actions

- **What**: Prioritized maintenance strategies
- **Example**: "Prioritize servicing high-cost, high-risk items"
- **Based on**: Cost-benefit analysis, risk assessment

### Insight Properties

Each insight includes:

- **Type**: prediction, risk, anomaly, maintenance, action
- **Category**: maintenance, failure_risk, anomaly, downtime, recommendation
- **Priority**: critical, high, medium, low, info
- **Confidence**: 0-100% AI confidence level
- **Timeline**: When action is needed (e.g., "within 7-10 days")
- **Affected Items**: Specific equipment involved
- **Cost Impact**: high, medium, low
- **Action Required**: Whether immediate action is needed

## Dashboard Display

### Enhanced UI Features

- **Category Badges**: Color-coded insight categories
- **Confidence Levels**: AI prediction confidence displayed
- **Timeline Information**: When predictions will occur
- **Cost Impact**: Financial impact indicators
- **Action Required**: Visual indicators for urgent items
- **Affected Items**: List of specific equipment involved

### Color Coding

- **Critical**: Red - Immediate attention required
- **High**: Orange - Address soon
- **Medium**: Yellow - Monitor closely
- **Low**: Blue - Informational
- **Info**: Gray - General information

## API Usage

### Endpoint

```
GET /api/ai-insights
```

### Response Format

```json
{
  "insights": [
    {
      "type": "prediction",
      "category": "maintenance",
      "title": "Predicted Maintenance Need",
      "description": "Item #X123 has 4 reported issues and is likely to require maintenance within 7-10 days.",
      "priority": "high",
      "confidence": 82,
      "timeline": "7-10 days",
      "affected_items": ["Industrial Printer X123"],
      "cost_impact": "medium",
      "action_required": true
    }
  ],
  "source": "ai-enhanced" // or "rule-based" or "rule-based-fallback"
}
```

### Source Types

- **ai-enhanced**: Using Gemini AI + rule-based insights
- **rule-based**: No API key, using only rule-based logic
- **rule-based-fallback**: API error, fell back to rule-based

## Troubleshooting

### Common Issues

#### 1. "No insights available yet"

- **Cause**: Insufficient data
- **Solution**: Add more items and track more issues

#### 2. API Key Not Working

- **Check**: Environment variable is set correctly
- **Verify**: API key is valid in Google AI Studio
- **Test**: System falls back to rule-based insights

#### 3. Low Confidence Scores

- **Cause**: Limited data or unclear patterns
- **Solution**: More data over time improves predictions

#### 4. Gemini API Errors

- **Monitoring**: Check console for API error messages
- **Fallback**: System automatically uses rule-based insights
- **Quota**: Verify API quota in Google AI Studio

### Rate Limits

Google AI has usage limits:

- **Free Tier**: 15 requests per minute
- **Paid Plans**: Higher limits available

The system automatically handles rate limiting and falls back gracefully.

## Cost Optimization

### Request Optimization

- Insights are cached and only updated when data changes
- Batched analysis reduces API calls
- Fallback system prevents service interruption

### Token Management

- Prompts are optimized for relevant data only
- Response parsing extracts only necessary information
- Error handling prevents redundant calls

## Security Considerations

1. **API Key Security**: Store in environment variables only
2. **Data Privacy**: No sensitive data sent to external APIs
3. **Fallback System**: Service continues without AI features
4. **Error Handling**: Graceful degradation on API failures

## Future Enhancements

Planned improvements:

- **Learning from Feedback**: Improve predictions based on outcomes
- **Custom Models**: Train on your specific equipment data
- **Integration Alerts**: Connect with external maintenance systems
- **Mobile Notifications**: Push critical insights to mobile devices

## Testing

To test the system:

1. **Add Test Data**: Create items and issues
2. **Trigger Analysis**: Visit dashboard to fetch insights
3. **Check Console**: Monitor for API calls and responses
4. **Verify Fallback**: Remove API key to test rule-based mode

## Support

For issues with:

- **Google AI API**: Check [Google AI documentation](https://ai.google.dev/gemini-api/docs)
- **System Integration**: Review console logs for detailed error messages
- **Data Analysis**: Ensure sufficient item and issue data exists

The AI insights system provides powerful predictive maintenance capabilities while maintaining reliability through intelligent fallback mechanisms.
