# Escape Orbit Backend

This directory contains the serverless Express.js backend for the Escape Orbit game that will be deployed to AWS Lambda and API Gateway.

## Files

- `lambda.js` - Main server code adapted for AWS Lambda
- `serverless.yml` - Configuration for the Serverless Framework
- `package.json` - Dependencies and scripts

## Local Development

To run the server locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

This will run the server using Serverless Offline, which emulates AWS Lambda and API Gateway on your local machine.

## Deployment

To deploy to AWS:

1. Make sure you have AWS CLI configured with appropriate permissions
2. Install the Serverless Framework globally:
   ```bash
   npm install -g serverless
   ```

3. Deploy the backend:
   ```bash
   npm run deploy
   ```

4. After deployment, Serverless will output the API Gateway URL. Use this URL to update the frontend code in `frontend/js/leaderboard.js`.

## Using DynamoDB (Optional)

For a more persistent storage solution, you can modify the code to use DynamoDB as described in the AWS deployment guide. This is recommended for production use as Lambda's `/tmp` directory is ephemeral.

## Monitoring

Once deployed, you can monitor your Lambda function using AWS CloudWatch. Look for any error logs or performance issues there. 


# Managing Your Serverless Deployment

After running `npm run deploy` to deploy your backend to AWS, you don't need to "manage a server" in the traditional sense - that's the beauty of serverless! However, you might want to monitor, update, or remove your deployment.

## Monitoring Your Deployment

You can monitor your Lambda function and API Gateway through the AWS Console:

- **AWS Lambda Console**: View function details, metrics, and logs
- **API Gateway Console**: Monitor API requests, set throttling, etc.
- **CloudWatch**: View detailed logs and set up alarms

## Shutting Down / Removing the Deployment

To completely remove your serverless deployment:

1. Navigate to your backend directory:
   ```
   cd backend
   ```

2. Run the removal command:
   ```
   serverless remove
   ```
   or
   ```
   npm run remove
   ```
   (If you've defined this script in package.json)

This will remove all AWS resources created by your serverless deployment, including:
- Lambda function
- API Gateway endpoints
- IAM roles
- CloudWatch log groups
- Any other resources defined in your serverless.yml

## Temporarily Disabling Without Removing

If you want to temporarily disable your API without completely removing it:

1. In the AWS Console, go to API Gateway
2. Select your API
3. Go to "Stages"
4. Select your stage (e.g., "prod")
5. Click "Stage Actions" and select "Disable"

This will make your API unavailable without deleting any resources.

## Cost Management

Even when not actively used, some AWS resources might incur small charges:
- API Gateway has a small monthly charge for each REST API
- CloudWatch log storage has minimal costs
- DynamoDB will charge for stored data (if using the DynamoDB version)

The Lambda function itself only charges when invoked, so it won't cost anything when not in use.

If you're concerned about costs but want to keep your deployment, consider using the `serverless remove` command and re-deploying when needed. All your code and configuration will be preserved locally.
