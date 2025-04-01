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

# Debugging Game Mechanics

## Visual Timer Indicators

If you're experiencing issues with the visual timer indicators for planets:

1. **Timer Doesn't Appear for Earth**:
   - Check the initialization in `frontend/js/game.js` to ensure Earth's timer is properly initialized
   - Verify that the `initializeTimerIndicator` method is being called for Earth
   - If using the console, look for "Silently refueled from Earth" messages

2. **Timer Not Updating Correctly**:
   - Examine the `update` method in `frontend/js/objects/planet.js`
   - Ensure the timer indicator graphics are being properly drawn and updated
   - Verify that the timer countdown starts when exiting orbit, not when entering

3. **Timer Graphics Appearing Incorrectly**:
   - Check the `createTimerIndicator` method to ensure proper radius calculations
   - Verify that the circle is being drawn with the correct color and alpha values
   - Check if the indicator is properly positioned relative to the planet

## Fuel Refill Mechanics

If you're having issues with the fuel refill when passing through planets:

1. **No Fuel Added When Passing Through Planets**:
   - Check the `addScoreForDirectPass` method in `frontend/js/game.js`
   - Verify that `showFuelRefillMessage` is being called
   - Examine the `checkOrbit` method in `frontend/js/objects/spaceship.js` to ensure proper logic flow

2. **No Fuel Added When Passing Through Earth**:
   - Ensure the Earth planet is correctly calling `addScoreForDirectPass` rather than just `showFuelRefillMessage`
   - Check console logs for "Refueled from Earth" messages
   - Verify that the logic in `spaceship.js` is not excluding Earth from refueling

3. **Receiving Too Much Fuel**:
   - Check if refueling logic is being called multiple times per pass
   - Verify the `currentlyInsidePlanets` tracking in `checkOrbit` is working correctly
   - Ensure the `PLANET_REFUEL_AMOUNT` constant is set correctly in `frontend/js/constants.js`

4. **No Refill Message Appears**:
   - Check the `showFuelRefillMessage` method to ensure it's creating visible messages
   - Verify that any conditional logic for message display is working correctly
   - Ensure the message queue system is not being blocked by other messages

## Common Issues and Solutions

1. **AWS Region Mismatch**: Ensure all references to AWS regions match.
2. **API Gateway Endpoint Incorrect**: Double-check the API Gateway URL in the frontend code.
3. **CORS Issues**: Browser security might block requests if CORS is not configured properly.
4. **Lambda IAM Permissions**: Verify that your Lambda function has permissions to access DynamoDB.
5. **Browser Cache**: Old JavaScript files might be cached, showing outdated behavior.
6. **Local Storage Fallback**: The code correctly falls back to localStorage when the API fails, which might mask the underlying issue.
7. **Planet Visitation Logic**: The same planet might be counted multiple times if event tracking is incorrect.
8. **Fuel Refill Double-Counting**: Ensure fuel is only added once when passing through a planet.

## Testing After Fixes

After applying fixes:
1. Clear browser cache
2. Reload your game
3. Play a round and check if your score appears in the DynamoDB table
4. Use the AWS Console to view the DynamoDB table directly
5. Monitor CloudWatch logs for any errors
6. Test passing through planets to verify fuel refill mechanics
7. Check that timer indicators appear and update correctly

If you still encounter issues, review the console logs for specific error messages. 