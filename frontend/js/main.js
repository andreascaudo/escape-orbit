// Main entry point for Escape Orbit game
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    // Create sound directory (for sound files referenced in game.js)
    createSoundDirectory();

    // Check if we need to handle orientation
    const isMobile = detectMobile();

    // Create PixiJS application - always use landscape orientation on mobile
    let appWidth = window.innerWidth;
    let appHeight = window.innerHeight;

    // For mobile devices, ensure we're using the landscape dimensions
    if (isMobile) {
        appWidth = Math.max(window.innerWidth, window.innerHeight);
        appHeight = Math.min(window.innerWidth, window.innerHeight);

        // Try to lock to landscape if supported
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(error => {
                console.log('Unable to lock screen orientation:', error);
            });
        }
    }

    const app = new PIXI.Application({
        width: appWidth,
        height: appHeight,
        backgroundColor: 0x000022,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    });

    console.log('PixiJS app created');

    // Add the canvas to the DOM
    document.getElementById('game-container').appendChild(app.view);

    // Game state variables
    let game = null;
    let usernameScreen = null;
    let currentUsername = getUsername(); // Get existing username if available

    // First show the username screen, then create the game when it's done
    usernameScreen = new UsernameScreen(app, (username) => {
        // Store the username for game use
        currentUsername = username;

        // Create and initialize game
        game = new Game(app, username);
        console.log('Game initialized with username:', username);

        // Make game instance globally accessible for scoring and other interactions
        window.game = game;
    });

    // Handle orientation change
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial check for orientation
    if (isMobile) {
        checkOrientation();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        // Update app size based on window size and device orientation
        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;

        // For mobile, always use landscape dimensions
        if (isMobile) {
            newWidth = Math.max(window.innerWidth, window.innerHeight);
            newHeight = Math.min(window.innerWidth, window.innerHeight);
        }

        app.renderer.resize(newWidth, newHeight);

        // Update constants
        CONSTANTS.SCREEN_WIDTH = newWidth;
        CONSTANTS.SCREEN_HEIGHT = newHeight;

        // Update UI positions if game exists
        if (game) {
            // Update UI positions
            if (game.fuelText) {
                game.fuelText.x = 20;
                game.fuelText.y = 20;
            }

            if (game.scoreText) {
                game.scoreText.x = 20;
                game.scoreText.y = 50;
            }

            if (game.zoomText) {
                game.zoomText.x = 20;
                game.zoomText.y = 80;
            }

            if (game.messageText) {
                game.messageText.x = newWidth / 2;
                game.messageText.y = newHeight / 2;
            }

            if (game.orbitHelpText) {
                game.orbitHelpText.x = newWidth / 2;
                game.orbitHelpText.y = newHeight - 40;
            }

            if (game.planetCountText) {
                game.planetCountText.x = 20;
                game.planetCountText.y = 110;
            }
        }

        // Reposition joystick and boost button for landscape
        const joystickZone = document.getElementById('joystick-zone');
        if (joystickZone) {
            joystickZone.style.left = '20px';
            joystickZone.style.bottom = '20px';
        }

        // Check orientation again after resize
        if (isMobile) {
            checkOrientation();
        }
    });
});

// Function to detect mobile devices
function detectMobile() {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 800
    );
}

// Function to handle orientation changes
function handleOrientationChange() {
    checkOrientation();

    // Small delay to ensure the resize event has completed
    setTimeout(() => {
        // Force a resize event to update the game dimensions
        window.dispatchEvent(new Event('resize'));
    }, 300);
}

// Function to check and handle the device orientation
function checkOrientation() {
    const orientationMessage = document.getElementById('orientation-message');
    const gameContainer = document.getElementById('game-container');

    if (window.innerHeight > window.innerWidth) {
        // Portrait mode
        console.log('Device in portrait mode - showing orientation message');
        if (orientationMessage) orientationMessage.style.display = 'flex';
        if (gameContainer) gameContainer.style.visibility = 'hidden';
    } else {
        // Landscape mode
        console.log('Device in landscape mode - showing game');
        if (orientationMessage) orientationMessage.style.display = 'none';
        if (gameContainer) gameContainer.style.visibility = 'visible';
    }
}

// Create a sound directory for the game
function createSoundDirectory() {
    // This function would normally create audio files
    // For this demo, we'll just make sure the sound directory exists
    // In a real implementation, you would include the actual sound files

    // Create a simple sound stub so our game doesn't error
    Howler.volume(0.5); // Set global volume

    // Override the Howl prototype play method to avoid errors with missing files
    const originalPlay = Howl.prototype.play;
    Howl.prototype.play = function () {
        // Check if the src file exists
        const src = this._src;
        if (typeof src === 'string' && src.startsWith('sound/')) {
            console.log(`Sound would play: ${src}`);
            return this;
        }
        return originalPlay.apply(this, arguments);
    };
} 