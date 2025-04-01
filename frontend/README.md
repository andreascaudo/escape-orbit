# Escape Orbit Frontend

This directory contains all the static files for the Escape Orbit game that will be deployed to AWS S3.

## Structure

- `index.html` - Main HTML file
- `js/` - JavaScript files including game logic and UI
- `sound/` - Sound assets for the game

## Recent Updates

- Replaced planet emojis with visual circular timer indicators for planet visits
- Fixed Earth's timer indicator to always display a full circle
- Improved fuel mechanics to get 30 fuel from all planets including Earth
- Added fuel refill notification messages for all planets including Earth
- Updated spaceship graphics with new image assets (spaceship_noflames.png and spaceship_flames.png)
- Improved game over screen with better leaderboard display and spacing
- Removed username display from top left UI and moved it to the game over screen
- Repositioned UI elements (fuel, score, planets) to the bottom of the screen on mobile devices
- Moved zoom instructions to the bottom-right corner on desktop
- Increased font size for UI elements on desktop for better readability
- Fixed overlapping leaderboard entries in the game over screen
- Centered game instructions text in portrait mode for improved readability
- Fixed planet creation error in the username screen
- The leaderboard now appears directly in the portrait orientation screen below the game instructions
- Added game boundary detection - The game now ends when the spaceship travels outside the solar system boundary
- Fixed centering issues during orientation changes - Game canvas now properly centers when switching from portrait to landscape mode
- Improved mobile responsiveness - Eliminated black bands on the sides in landscape mode
- Enhanced iOS compatibility with additional meta tags
- Added bonus mechanics - Players receive 1000 points for visiting all planets but can continue playing
- Fixed UI cleanup issues - Leaderboard is properly removed when starting a new game

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

## Mobile Testing

For optimal mobile testing:
- Test in both portrait and landscape orientations
- Verify the leaderboard appears correctly in the portrait orientation instructions
- Check that boundary detection works when flying outside the solar system
- Ensure proper centering when rotating the device
- Test fuel refill mechanics with all planets including Earth
- Verify that visual timer indicators display correctly for visited planets 