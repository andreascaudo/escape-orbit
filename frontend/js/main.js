// main.js

// Global variables to hold instances and state
let app = null;
let usernameScreen = null;
let game = null;
let gameLogicInitialized = false; // <-- New flag

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    createSoundDirectory();

    const isMobile = detectMobile();
    let appWidth = window.innerWidth;
    let appHeight = window.innerHeight;

    // --- Create PixiJS application immediately ---
    // We need the app and canvas ready even if we hide it initially
    app = new PIXI.Application({
        width: appWidth,
        height: appHeight,
        backgroundColor: 0x000022,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    });
    // console.log('PixiJS app created');
    document.getElementById('game-container').appendChild(app.view);

    // --- Set initial visibility based on orientation ---
    // Don't fully initialize game logic yet, just manage visibility
    const gameContainer = document.getElementById('game-container');
    if (isMobile && window.innerHeight > window.innerWidth) {
        // console.log('Initially loading in portrait mode, hiding game container');
        if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
            gameContainer.style.position = 'absolute'; // Keep position absolute when hidden
        }
    } else {
        // console.log('Initially loading in landscape or desktop, showing game container');
        if (gameContainer) {
            gameContainer.style.visibility = 'visible';
            gameContainer.style.position = 'relative'; // Use relative when visible
        }
    }

    // Center the view (might be hidden, but useful for later)
    ensureGameViewCentered();

    // --- Add Event Listeners ---
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    // Removed deviceorientation listener for simplicity, resize/orientationchange should cover it

    // --- Perform Initial Orientation Check ---
    // This will now also handle the *first* potential initialization of game logic
    checkOrientation();

});

// --- Function to initialize the game logic ONCE ---
function initializeGameLogic() {
    // Prevent running more than once
    if (gameLogicInitialized) {
        // console.log('Game logic already initialized, skipping.');
        return;
    }
    gameLogicInitialized = true;
    // console.log('Initializing game logic...');

    // Get current username
    let currentUsername = getUsername();

    // Create Username Screen - This will now run only when in landscape/desktop
    usernameScreen = new UsernameScreen(app, (username) => {
        currentUsername = username;
        // Create and initialize game AFTER username is entered
        game = new Game(app, username);
        // console.log('Game initialized with username:', username);
        window.game = game; // Make game instance globally accessible
        setTimeout(ensureGameViewCentered, 100); // Recenter after game creation
    });

    // console.log('Username screen created.');
    // Recenter after username screen setup
    ensureGameViewCentered();
    setTimeout(ensureGameViewCentered, 100);
}

// --- Function to check and handle the device orientation ---
function checkOrientation() {
    const orientationMessage = document.getElementById('orientation-message');
    const gameContainer = document.getElementById('game-container');
    const isMobile = detectMobile(); // Re-check or use a stored flag if preferred

    if (!gameContainer || !orientationMessage) {
        console.error('Required elements #game-container or #orientation-message not found!');
        return;
    }

    if (isMobile && window.innerHeight > window.innerWidth) {
        // Portrait mode on Mobile
        // console.log('checkOrientation: Portrait mode detected (Mobile)');
        orientationMessage.style.display = 'flex';
        gameContainer.style.visibility = 'hidden';
        gameContainer.style.position = 'absolute'; // Ensure it's absolute when hidden
        loadPortraitLeaderboard(); // Load HTML leaderboard
    } else {
        // Landscape mode (Mobile/Desktop) or Desktop
        // console.log('checkOrientation: Landscape or Desktop detected');
        orientationMessage.style.display = 'none';
        gameContainer.style.visibility = 'visible';
        gameContainer.style.position = 'relative'; // Ensure it's relative when visible

        // --- Trigger game logic initialization if needed ---
        // This is the crucial part: only initialize if we are now in landscape/desktop
        // and haven't done so before.
        initializeGameLogic();

        // Ensure the game view is centered now that it's visible
        ensureGameViewCentered();
        // Trigger resize updates maybe necessary after init
        if (app && gameLogicInitialized) {
            setTimeout(handleResize, 50); // Give a tiny delay for PIXI setup
        }
    }
}

// --- Function to handle orientation changes ---
function handleOrientationChange() {
    // console.log('handleOrientationChange triggered');

    // Clear previous HTML leaderboard content when rotating (might not be needed if checkOrientation handles it)
    const leaderboardContainer = document.getElementById('portrait-leaderboard');
    if (leaderboardContainer) {
        const loadingText = document.getElementById('leaderboard-loading');
        while (leaderboardContainer.firstChild) {
            leaderboardContainer.removeChild(leaderboardContainer.firstChild);
        }
        if (loadingText) {
            leaderboardContainer.appendChild(loadingText); // Re-add loading text stub
            loadingText.style.display = 'block';
        }
    }

    // Check orientation will handle visibility and potential initialization
    checkOrientation();

    // Force a resize event after a short delay to ensure layout updates
    setTimeout(handleResize, 150); // Increased delay slightly
}

function handleResize() {
    // console.log('handleResize triggered');
    if (!app) {
        // console.log('Resize called before PIXI app initialized, skipping.');
        return;
    }

    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    // --- Explicitly set container size ---
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.width = newWidth + 'px';
        gameContainer.style.height = newHeight + 'px';
        // console.log(`Set #game-container dimensions to: ${newWidth}x${newHeight}`);
    }
    // --- End container size ---

    // Resize the app renderer
    app.renderer.resize(newWidth, newHeight);
    // console.log(`Resized PIXI app to: ${newWidth}x${newHeight}`);

    // Update constants
    CONSTANTS.SCREEN_WIDTH = newWidth;
    CONSTANTS.SCREEN_HEIGHT = newHeight;

    // Re-check orientation (handles visibility)
    checkOrientation(); // Check orientation still manages visibility logic

    // Update UI positions if game exists
    if (gameLogicInitialized && game) {
        // console.log('Updating game UI positions after resize.');
        if (typeof game.handleResize === 'function') {
            game.handleResize(newWidth, newHeight);
        } else {
            // Fallback manual updates (ensure these are correct for new dimensions)
            if (game.fuelText) { game.fuelText.x = 20; game.fuelText.y = 20; }
            if (game.scoreText) { game.scoreText.x = 20; game.scoreText.y = 50; }
            if (game.zoomText) { game.zoomText.x = 20; game.zoomText.y = 80; }
            if (game.planetCountText) { game.planetCountText.x = 20; game.planetCountText.y = 110; }
            if (game.usernameText) { game.usernameText.x = 20; game.usernameText.y = 140; }
            if (game.messageText) { game.messageText.x = newWidth / 2; game.messageText.y = newHeight / 2; }
            if (game.orbitHelpText) { game.orbitHelpText.x = newWidth / 2; game.orbitHelpText.y = newHeight - 40; }
            if (game.orbitEntryText) { game.orbitEntryText.x = newWidth / 2; game.orbitEntryText.y = newHeight - 70; }
            if (game.sunWarningText) { game.sunWarningText.x = newWidth / 2; game.sunWarningText.y = 100; }
            if (game.boundaryWarningText) { game.boundaryWarningText.x = newWidth / 2; game.boundaryWarningText.y = 130; }
        }
        // Ensure UsernameScreen also resizes if it's still active
        if (usernameScreen && usernameScreen.container && usernameScreen.container.visible) {
            if (typeof usernameScreen.handleResize === 'function') {
                usernameScreen.handleResize(newWidth, newHeight);
            }
            // Optional: Add manual repositioning here if handleResize isn't implemented
            // e.g., usernameScreen.repositionUI(newWidth, newHeight);
        }
    }

    // Always re-center the view after resize logic
    ensureGameViewCentered(); // Call ensureGameViewCentered to apply canvas styles
    // Use shorter delays or potentially remove one if layout is stable
    // setTimeout(ensureGameViewCentered, 50);
}

// --- Helper Functions (detectMobile, loadPortraitLeaderboard, createSoundDirectory, ensureGameViewCentered) ---
// Keep these functions as they were, but ensure `ensureGameViewCentered` works correctly
// when the container might be hidden/absolute or visible/relative.

function detectMobile() {
    // Keep your existing implementation
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 800 // Consider if this width check is always appropriate
    );
}

function loadPortraitLeaderboard() {
    // Keep your existing implementation - this correctly targets the HTML element
    // console.log('Loading portrait leaderboard (HTML)');
    formatLeaderboardHtml(); // Call the function from leaderboard.js
    // ... (rest of the function)
}

function createSoundDirectory() {
    // Keep your existing implementation
    // ... (rest of the function)
}

function ensureGameViewCentered() {
    const gameContainer = document.getElementById('game-container');
    const canvas = gameContainer?.querySelector('canvas');

    if (!gameContainer || !canvas) return;

    // console.log('Ensuring game view is centered...');

    // --- Explicitly set container size ---
    // Also set it here for initial load and orientation changes
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    gameContainer.style.width = currentWidth + 'px';
    gameContainer.style.height = currentHeight + 'px';
    // --- End container size ---

    // Container styles (mostly for flex centering)
    gameContainer.style.display = 'flex';
    gameContainer.style.justifyContent = 'center';
    gameContainer.style.alignItems = 'center';
    gameContainer.style.overflow = 'hidden';
    gameContainer.style.transform = 'translateZ(0)';
    gameContainer.style.webkitTransform = 'translateZ(0)';

    // Canvas styles - ensure it fills the container
    canvas.style.display = 'block';
    canvas.style.position = 'relative';
    canvas.style.left = 'auto'; // Let flexbox handle positioning
    canvas.style.top = 'auto';  // Let flexbox handle positioning
    canvas.style.transform = 'none';
    canvas.style.margin = '0'; // Remove margin auto, rely on flex
    canvas.style.width = '100%'; // Fill the container width
    canvas.style.height = '100%'; // Fill the container height
    canvas.style.maxWidth = 'none';
    canvas.style.maxHeight = 'none';
    // canvas.style.objectFit = 'contain'; // Ensure this is removed or commented out

    // console.log('Game view centering styles applied.');
}

// ... (rest of main.js, including checkOrientation, initializeGameLogic etc.)

// Make sure the initial setup in DOMContentLoaded also sets the container size
document.addEventListener('DOMContentLoaded', () => {
    // ... (other setup) ...

    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.width = window.innerWidth + 'px';
        gameContainer.style.height = window.innerHeight + 'px';
    }

    // ... (rest of DOMContentLoaded) ...
    checkOrientation(); // This will call ensureGameViewCentered again
});

// --- Add resize handlers to Game and UsernameScreen (Optional but recommended) ---

// Add to game.js (inside Game class)
/*
handleResize(newWidth, newHeight) {
    this.width = newWidth;
    this.height = newHeight;

    // Update UI positions more robustly
    if (this.fuelText) { this.fuelText.x = 20; this.fuelText.y = 20; }
    if (this.scoreText) { this.scoreText.x = 20; this.scoreText.y = 50; }
    if (this.zoomText) { this.zoomText.x = 20; this.zoomText.y = 80; }
    if (this.planetCountText) { this.planetCountText.x = 20; this.planetCountText.y = 110; }
    if (this.usernameText) { this.usernameText.x = 20; this.usernameText.y = 140; }
    if (this.messageText) { this.messageText.x = newWidth / 2; this.messageText.y = newHeight / 2; }
    if (this.orbitHelpText) { this.orbitHelpText.x = newWidth / 2; this.orbitHelpText.y = newHeight - 40; }
    if (this.orbitEntryText) { this.orbitEntryText.x = newWidth / 2; this.orbitEntryText.y = newHeight - 70; }
    if (this.sunWarningText) { this.sunWarningText.x = newWidth / 2; this.sunWarningText.y = 100; }
    if (this.boundaryWarningText) { this.boundaryWarningText.x = newWidth / 2; this.boundaryWarningText.y = 130; }

    // Recalculate boundary maybe? Or other dimension-dependent things
    this.drawBoundary();
}
*/

// Add to username_screen.js (inside UsernameScreen class)
/*
handleResize(newWidth, newHeight) {
    // Reposition elements based on new screen size
    if (this.background) {
        this.background.clear();
        this.background.beginFill(0x000022);
        this.background.drawRect(0, 0, newWidth, newHeight);
        this.background.endFill();
    }
    // Reposition title, subtitle, input box, buttons etc. based on newWidth/newHeight
    // Example:
    // if (this.title) { this.title.x = newWidth / 2; }
    // if (this.inputBg) { this.inputBg.x = newWidth / 2 - 200; this.inputBg.y = newHeight / 2 - 25; }
    // ... and so on for all UI elements ...
    // Don't forget to update cursor position relative to inputText
    // this.updateCursorPosition();

    // Re-create/reposition leaderboard if it's part of this screen (only for desktop)
    // if (!this.detectMobile() && this.leaderboardContainer) {
    //     // Remove old one
    //     this.container.removeChild(this.leaderboardContainer);
    //     // Recreate or reposition
    //     this.createLeaderboardDisplay(); // Assuming this function correctly uses current app dimensions
    // }
}
*/