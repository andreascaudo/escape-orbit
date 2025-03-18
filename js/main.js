// Main entry point for Escape Orbit game
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    // Create sound directory (for sound files referenced in game.js)
    createSoundDirectory();

    // Create PixiJS application
    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000022,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    });

    console.log('PixiJS app created');

    // Add the canvas to the DOM
    document.getElementById('game-container').appendChild(app.view);

    // Create and initialize game
    const game = new Game(app);
    console.log('Game initialized');

    // Handle window resize
    window.addEventListener('resize', () => {
        // Update app size
        app.renderer.resize(window.innerWidth, window.innerHeight);

        // Update constants
        CONSTANTS.SCREEN_WIDTH = window.innerWidth;
        CONSTANTS.SCREEN_HEIGHT = window.innerHeight;

        // Update UI positions
        if (game.messageText) {
            game.messageText.x = window.innerWidth / 2;
            game.messageText.y = window.innerHeight / 2;
        }
    });
});

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