# AWS Deployment Guide for Escape Orbit

This guide provides detailed instructions for deploying the Escape Orbit game on AWS using:
- **S3** for hosting static content (HTML, CSS, JS files)
- **Lambda + API Gateway** for the serverless Express.js backend

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Node.js (v14.x or later) and npm installed
- [Serverless Framework](https://www.serverless.com/) installed globally (`npm install -g serverless`)

## Project Structure

The project is already organized into two main parts:
```
escape-orbit/
├── frontend/         # Static content for S3
│   ├── index.html
│   ├── js/
│   ├── sound/
│   └── README.md
└── backend/          # Server code for Lambda
    ├── lambda.js               # Basic Lambda handler
    ├── lambda-dynamodb.js      # Advanced handler with DynamoDB
    ├── serverless.yml          # Basic serverless config
    ├── serverless-dynamodb.yml # Advanced config with DynamoDB
    ├── package.json
    └── README.md
```

## Step 1: Deploy the Backend with Lambda and API Gateway

### 1.1 Choose Your Backend Implementation

You have two options:
- **Basic**: Uses Lambda's `/tmp` directory for storage (simpler but less persistent)
- **Advanced**: Uses DynamoDB for storage (more robust for production)

For the basic implementation, the files are already set up. For DynamoDB:

```bash
# If you want to use DynamoDB instead of the basic implementation
cd backend
cp serverless-dynamodb.yml serverless.yml
# Edit serverless.yml to ensure handler points to lambda-dynamodb.js
```

### 1.2 Install Dependencies and Deploy

```bash
cd backend
npm install
npm run deploy
```

The deployment may take a few minutes. Once complete, Serverless will output information about your deployment, including the API Gateway URL, which looks like:
```
endpoints:
  ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
  ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/{proxy+}
```

**IMPORTANT**: Copy the base URL (e.g., `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`). You'll need this for the frontend configuration.

## Step 2: Configure and Deploy the Frontend to S3

### 2.1 Create an S3 Bucket

1. Open the AWS Management Console and navigate to S3
2. Click "Create bucket"
3. Enter a unique bucket name (e.g., `escape-orbit-game`)
4. Select the region closest to your target audience (same region as your Lambda function is recommended)
5. Uncheck "Block all public access" (since this is a public website)
6. Acknowledge the warning about making the bucket public
7. Click "Create bucket"

### 2.2 Configure the Bucket for Static Website Hosting

1. Select your newly created bucket
2. Go to the "Properties" tab
3. Scroll down to "Static website hosting" and click "Edit"
4. Select "Enable"
5. Set "Index document" to `index.html`
6. Set "Error document" to `index.html`
7. Click "Save changes"

### 2.3 Set Bucket Policy for Public Access

1. Go to the "Permissions" tab
2. Under "Bucket policy", click "Edit"
3. Enter the following policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

4. Click "Save changes"

### 2.4 Update the Frontend API URL

1. Edit the file `frontend/js/leaderboard.js`
2. Update the API_URL constant with your API Gateway URL:

```javascript
const API_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000/api/leaderboard'
    : 'https://YOUR_API_GATEWAY_URL/prod/api/leaderboard'; // Replace with your actual URL
```

Note: Make sure to add `/api/leaderboard` to the end of your API Gateway URL.

### 2.5 Upload Static Content to S3

```bash
cd frontend
aws s3 sync . s3://YOUR_BUCKET_NAME --exclude "*.DS_Store" --exclude "*.git*" --exclude "README.md"
```

### 2.6 Access Your Website

Your game is now deployed! Access it via the S3 website endpoint:
```
http://YOUR_BUCKET_NAME.s3-website-YOUR_REGION.amazonaws.com
```

Replace `YOUR_REGION` with the AWS region you deployed to (e.g., `us-east-1`).

## Step 3: Set Up CloudFront (Optional but Recommended)

For better performance, HTTPS support, and CDN capabilities:

### 3.1 Create a CloudFront Distribution

1. Go to the CloudFront service in the AWS console
2. Click "Create Distribution"
3. For "Origin Domain", select your S3 bucket website endpoint
4. For "Origin Protocol Policy", select "HTTP Only"
5. For "Viewer Protocol Policy", select "Redirect HTTP to HTTPS"
6. For "Allowed HTTP Methods", select "GET, HEAD, OPTIONS"
7. For "Cache Policy", select "CachingOptimized"
8. For "Default root object", enter `index.html`
9. Click "Create Distribution"

CloudFront distribution may take up to 15 minutes to deploy. Once ready, you can access your site through the CloudFront domain (e.g., `https://d1234abcd.cloudfront.net`).

## Step 4: Set Up a Custom Domain (Optional)

### 4.1 Register or Use an Existing Domain in Route 53

1. Go to Route 53 in the AWS console
2. Register a domain or use an existing domain
3. Create a hosted zone for your domain if you don't have one

### 4.2 Create SSL Certificate in ACM

1. Go to AWS Certificate Manager
2. Request a public certificate for your domain
3. Validate the certificate (usually through DNS validation)

### 4.3 Update CloudFront to Use Your Custom Domain

1. Go to your CloudFront distribution
2. Click "Edit" > "General"
3. Under "Alternate domain names (CNAMEs)", add your domain
4. Under "Custom SSL Certificate", select your ACM certificate
5. Click "Save changes"

### 4.4 Create DNS Record in Route 53

1. Go to Route 53 > Hosted zones > your domain
2. Create a new record
3. Set record name as needed (or leave blank for root domain)
4. Record type: A
5. Route traffic to: Alias to CloudFront distribution
6. Select your CloudFront distribution
7. Click "Create records"

DNS changes may take some time to propagate. Once complete, your game will be accessible at your custom domain.

## Step 5: Advanced DynamoDB Setup (If Using DynamoDB)

If you chose the DynamoDB implementation, your table should have been created automatically during deployment. To verify:

1. Go to DynamoDB in the AWS console
2. Click "Tables" in the left navigation
3. Look for "EscapeOrbitLeaderboard" table

You can manually add or inspect entries in this table if needed.

## Step 6: Setting Up Continuous Deployment (Optional)

For automating deployments with GitHub Actions:

### 6.1 Create AWS IAM User for Deployments

1. Go to IAM in the AWS console
2. Create a new user with programmatic access
3. Attach policies:
   - AmazonS3FullAccess
   - AmazonAPIGatewayAdministrator
   - AWSLambda_FullAccess
   - AmazonDynamoDBFullAccess (if using DynamoDB)
   - CloudFrontFullAccess (if using CloudFront)
4. Note the Access Key ID and Secret Access Key

### 6.2 Add GitHub Secrets

In your GitHub repository:
1. Go to Settings > Secrets and variables > Actions
2. Add these secrets:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - S3_BUCKET_NAME

### 6.3 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 14
        
    - name: Deploy Backend
      working-directory: ./backend
      run: |
        npm install -g serverless
        npm install
        serverless deploy
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_REGION: ${{ secrets.AWS_REGION }}
        
    - name: Deploy Frontend
      working-directory: ./frontend
      run: |
        aws s3 sync . s3://${{ secrets.S3_BUCKET_NAME }} --delete --exclude "README.md" --exclude ".git*" --exclude ".DS_Store"
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_REGION: ${{ secrets.AWS_REGION }}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: If you see CORS errors in the browser console:
   - Verify CORS is enabled in API Gateway
   - Check that the `cors: true` setting is in serverless.yml
   - Confirm the API_URL in leaderboard.js is correct

2. **Lambda Errors**: Check CloudWatch Logs for your Lambda function:
   - Go to CloudWatch > Log groups
   - Look for `/aws/lambda/escape-orbit-api-prod-app`

3. **S3 Access Denied**: Verify your bucket policy allows public read access

4. **API Gateway 5xx Errors**: 
   - Check CloudWatch Logs for Lambda errors
   - Verify the correct handler is specified in serverless.yml

5. **DynamoDB Errors**:
   - Check IAM permissions for your Lambda function
   - Verify the table exists and has the correct schema

### Debugging

- Use `console.log` statements in your Lambda code to debug issues
- Check CloudWatch Logs for details on function execution
- Test API endpoints directly using tools like Postman
- Check S3 bucket permissions and policies

## Cost Management

AWS Free Tier provides generous allowances:
- S3: 5GB storage, 20,000 GET requests/month
- Lambda: 1 million requests/month
- API Gateway: 1 million requests/month
- DynamoDB: 25GB storage, 25 WCU/RCU
- CloudFront: 50GB data transfer/month

For cost estimation, use the [AWS Pricing Calculator](https://calculator.aws).

## Security Best Practices

1. **API Gateway Throttling**: Set up throttling to prevent abuse
2. **CloudFront WAF**: Add AWS WAF for protection against common web exploits
3. **Lambda IAM Roles**: Use the principle of least privilege
4. **DynamoDB Encryption**: Enable encryption at rest
5. **S3 Bucket Policies**: Restrict access to only what's needed
6. **CloudFront Security Headers**: Implement security headers like CSP

## Cleanup

To avoid unnecessary charges:

1. Delete CloudFront distribution (if created)
2. Delete S3 bucket content and bucket
3. Run `serverless remove` in the backend directory to remove Lambda and API Gateway
4. Delete DynamoDB table (if created)
5. Delete Route 53 records and hosted zone (if created)

## Conclusion

Your Escape Orbit game is now fully deployed on AWS using a serverless architecture! This setup provides excellent scalability and cost-efficiency since you only pay for the resources you actually use.

For further assistance or to learn more about AWS services, refer to the [AWS Documentation](https://docs.aws.amazon.com/). 