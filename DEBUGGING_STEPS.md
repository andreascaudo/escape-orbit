# Debugging Guide: DynamoDB Leaderboard Not Populating

This guide provides steps to troubleshoot and fix the issue where your DynamoDB table is not being populated with scores, and instead, the leaderboard is falling back to using local storage.

## Step 1: Verify Lambda Function Works

Run the DynamoDB test script to verify AWS connectivity:

```bash
cd backend
npm install # Make sure aws-sdk is installed
node test-dynamodb.js
```

If this fails, check your AWS credentials and region configuration.

## Step 2: Test API Endpoint Directly

1. Open the test page you now have at: `frontend/test-api.html`
2. Click "Test GET Request" to see if you can retrieve leaderboard entries
3. Try posting a new score using "Test POST Request"
4. Check "View Local Storage" to see what's stored locally

## Step 3: Check Lambda CloudWatch Logs

1. Log into your AWS Console
2. Go to CloudWatch > Log Groups
3. Find the log group for your Lambda function (typically `/aws/lambda/escape-orbit-prod-api`)
4. Look at recent log streams for errors or warnings
5. Pay special attention to the enhanced debug logs we added

## Step 4: Verify AWS Region Configuration

Ensure your region is consistent across:
- `serverless.yml` (provider.region)
- `lambda-dynamodb.js` (AWS.config.update)
- `test-dynamodb.js` (AWS.config.update)
- `frontend/js/leaderboard.js` (API_URL)

## Step 5: Check Frontend API URL

In `frontend/js/leaderboard.js`, verify that your API_URL points to the correct API Gateway endpoint:

```javascript
const API_URL = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000/api/leaderboard'
    : 'https://your-api-id.execute-api.your-region.amazonaws.com/prod/api/leaderboard';
```

Make sure to replace the non-localhost URL with your actual API Gateway endpoint.

## Step 6: Clear Browser Cache

1. Clear your browser cache completely
2. In Chrome: Settings > Privacy and security > Clear browsing data
3. Make sure to include "Cookies and other site data" and "Cached images and files"

## Step 7: Check CORS Configuration

If the API works in the test script but not in the browser, it might be a CORS issue:

1. In the AWS Console, go to API Gateway
2. Select your API
3. Under Resources, click on the OPTIONS method for your endpoint
4. Make sure CORS is enabled and properly configured
5. After changes, deploy your API again

## Step 8: Rebuild and Redeploy

If you've made changes to fix the issues:

```bash
# In the backend directory
npm install
npm run deploy

# Update the API_URL in frontend/js/leaderboard.js if needed
# Then redeploy your frontend to S3
```

## Common Issues and Solutions

1. **AWS Region Mismatch**: Ensure all references to AWS regions match.
2. **API Gateway Endpoint Incorrect**: Double-check the API Gateway URL in the frontend code.
3. **CORS Issues**: Browser security might block requests if CORS is not configured properly.
4. **Lambda IAM Permissions**: Verify that your Lambda function has permissions to access DynamoDB.
5. **Browser Cache**: Old JavaScript files might be cached, showing outdated behavior.
6. **Local Storage Fallback**: The code correctly falls back to localStorage when the API fails, which might mask the underlying issue.

## Testing After Fixes

After applying fixes:
1. Clear browser cache
2. Reload your game
3. Play a round and check if your score appears in the DynamoDB table
4. Use the AWS Console to view the DynamoDB table directly
5. Monitor CloudWatch logs for any errors

If you still encounter issues, review the Lambda logs in detail for specific error messages. 