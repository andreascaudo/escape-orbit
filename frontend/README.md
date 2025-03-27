# Escape Orbit Frontend

This directory contains all the static files for the Escape Orbit game that will be deployed to AWS S3.

## Structure

- `index.html` - Main HTML file
- `js/` - JavaScript files including game logic and UI
- `sound/` - Sound assets for the game

## Deployment Instructions

Before deploying to S3, make sure to update the API URL in `js/leaderboard.js`:

```javascript
const API_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000/api/leaderboard'
    : 'https://YOUR_API_GATEWAY_URL/api/leaderboard'; // Replace with your actual API Gateway URL
```

Once you've set up your S3 bucket, deploy the frontend with:

```bash
aws s3 sync . s3://YOUR_BUCKET_NAME --exclude "*.DS_Store" --exclude "*.git*" --exclude "README.md"
```

## Testing Locally

To test the frontend locally:

```bash
# Using Python's built-in HTTP server
python -m http.server 8000

# Or using Node.js http-server
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser. 