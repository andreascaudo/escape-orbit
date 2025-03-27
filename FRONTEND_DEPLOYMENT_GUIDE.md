# Frontend Deployment Guide for Escape Orbit

This guide outlines the steps to update your frontend files in S3 and invalidate the CloudFront cache to ensure changes are immediately visible to users.

## Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Your S3 bucket name: `escapeorbit.scau.do`
- Your CloudFront distribution ID: `EN0Z9I9ZC0GBJ`

## Step 1: Update Your Local Files

Make all necessary changes to your frontend files locally.

## Step 2: Upload Files to S3

Upload your modified files to S3 with appropriate cache control headers:

```bash
# For individual files:
aws s3 cp js/leaderboard.js s3://escapeorbit.scau.do/js/ \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "application/javascript"

aws s3 cp js/game.js s3://escapeorbit.scau.do/js/ \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "application/javascript"

# For CSS files:
aws s3 cp css/style.css s3://escapeorbit.scau.do/css/ \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "text/css"

# For HTML files:
aws s3 cp index.html s3://escapeorbit.scau.do/ \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "text/html"

# For multiple files or directories:
aws s3 sync . s3://escapeorbit.scau.do/ \
    --exclude ".git/*" \
    --exclude "node_modules/*" \
    --exclude "README*" \
    --exclude "*.md" \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate"
```

## Step 3: Invalidate CloudFront Cache

After uploading your files, you need to invalidate the CloudFront cache to ensure users see your changes immediately:

```bash
# To invalidate specific files:
aws cloudfront create-invalidation \
    --distribution-id EN0Z9I9ZC0GBJ \
    --paths "/js/leaderboard.js" "/js/game.js"

# To invalidate all JavaScript files:
aws cloudfront create-invalidation \
    --distribution-id EN0Z9I9ZC0GBJ \
    --paths "/js/*"

# To invalidate everything (use sparingly as it counts against your monthly quota):
aws cloudfront create-invalidation \
    --distribution-id EN0Z9I9ZC0GBJ \
    --paths "/*"
```

## Step 4: Verify Your Changes

To verify your changes have been applied:

1. Open your website in a private/incognito browser window
2. Check CloudFront invalidation status:

```bash
aws cloudfront list-invalidations --distribution-id EN0Z9I9ZC0GBJ
```

3. Confirm the specific invalidation is complete:

```bash
aws cloudfront get-invalidation \
    --distribution-id EN0Z9I9ZC0GBJ \
    --id YOUR_INVALIDATION_ID
```

## Troubleshooting

If changes still aren't visible after invalidation:

1. **Browser Cache**: Press Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac) to perform a hard refresh
2. **Check S3 Content**: Confirm your files were uploaded correctly:
   ```bash
   aws s3 cp s3://escapeorbit.scau.do/js/leaderboard.js -
   ```
3. **Check Headers**: Verify the cache-control headers are set correctly:
   ```bash
   curl -I https://d1sapd6yophwdu.cloudfront.net/js/leaderboard.js
   ```
4. **Clear Local Storage**: Sometimes you need to clear your browser's local storage to see changes in the application:
   ```javascript
   // Run this in browser console
   localStorage.clear();
   ```

## Best Practices

1. **Version Files**: Consider adding a version parameter to file URLs for critical updates:
   ```html
   <script src="js/leaderboard.js?v=20250327"></script>
   ```

2. **Limit Invalidations**: CloudFront gives you 1,000 free path invalidations per month. Beyond that, you pay for each invalidation.

3. **Use Shorter Cache Times**: For frequently updated files, use shorter max-age values instead of no-cache to reduce load on your origin while still allowing updates.

4. **Test in Incognito Mode**: Always test updates in a private/incognito browser window to avoid local caching issues. 