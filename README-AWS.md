# AWS Deployment for Escape Orbit

This repository has been organized for deployment to AWS using:
- **S3** for hosting static content (frontend)
- **Lambda + API Gateway** for the serverless backend

## Directory Structure

- `frontend/` - Contains all static files to be deployed to S3
- `backend/` - Contains the Express.js server to be deployed to Lambda

## Quick Start

### 1. Deploy the Backend

```bash
cd backend
npm install
npm run deploy
```

This will deploy the backend to AWS Lambda and output the API Gateway URL.

### 2. Update Frontend Configuration

Edit `frontend/js/leaderboard.js` and update the API URL with your API Gateway URL:

```javascript
const API_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000/api/leaderboard'
    : 'https://YOUR_API_GATEWAY_URL/api/leaderboard'; // Replace with your actual URL
```

### 3. Deploy the Frontend

```bash
cd frontend
aws s3 sync . s3://YOUR_BUCKET_NAME --exclude "*.DS_Store" --exclude "*.git*" --exclude "README.md"
```

## Advanced Configuration

### DynamoDB Integration

For production use, it's recommended to use DynamoDB instead of Lambda's `/tmp` directory for data persistence. The backend directory includes files for DynamoDB integration:

- `lambda-dynamodb.js` - Lambda handler with DynamoDB
- `serverless-dynamodb.yml` - Serverless configuration with DynamoDB

To use DynamoDB:

1. Rename or copy `serverless-dynamodb.yml` to `serverless.yml`
2. Update the handler in `serverless.yml` to point to `lambda-dynamodb.js`
3. Deploy as usual with `npm run deploy`

### CloudFront Setup

For better performance and HTTPS support, set up CloudFront to serve your S3 content. See the detailed AWS deployment guide for instructions.

## Testing Locally

### Frontend

```bash
cd frontend
python -m http.server 8000
```

Open http://localhost:8000 in your browser.

### Backend

```bash
cd backend
npm install
npm start
```

This will start the API server on http://localhost:3000.

## Further Information

For a detailed step-by-step guide on AWS deployment, see the [AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md). 