// Game Controls Handler
class Controls {
    constructor(game) {
        this.game = game;
        this.joystick = null;
        this.boostButtonActive = false;
        this.touchDevice = this.isTouchDevice();

        this.setupControls();
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    setupControls() {
        if (this.touchDevice) {
            this.setupTouchControls();
        } else {
            this.setupKeyboardControls();
        }
    }

    setupTouchControls() {
        // No joystick or boost button on mobile anymore, just use simple touch controls
        console.log('Setting up simplified touch controls for mobile');

        // Variables for touch long press
        let touchStartTime = 0;
        let touchLongPressActive = false;
        const longPressThreshold = 300; // milliseconds to consider a long press
        let touchStartX = 0;
        let touchStartY = 0;

        // Handle touch on the screen (for all touches now)
        document.addEventListener('touchstart', (e) => {
            // Only activate for gameplay screen
            if (this.game.gameState !== 'playing') return;

            // Skip if input cooldown is active
            if (this.game.inputCooldown) return;

            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            touchLongPressActive = false;

            // Start touch timer to detect long press
            this.touchTimer = setTimeout(() => {
                if (this.game.gameState === 'playing' && !this.game.inputCooldown) {
                    touchLongPressActive = true;
                    this.game.startBoosting();
                }
            }, longPressThreshold);
        });

        document.addEventListener('touchend', (e) => {
            // Only activate for gameplay screen
            if (this.game.gameState !== 'playing') return;

            // Skip if input cooldown is active
            if (this.game.inputCooldown) return;

            // Clear the long press timer
            clearTimeout(this.touchTimer);

            const touchDuration = Date.now() - touchStartTime;

            // If it was a short tap, toggle orbit
            if (touchDuration < longPressThreshold) {
                if (this.game.spaceship.orbiting) {
                    this.game.exitOrbit();
                } else {
                    this.game.tryEnterOrbit();
                }
            }

            // Always stop boosting on touch end if it was active
            if (touchLongPressActive) {
                this.game.stopBoosting();
                touchLongPressActive = false;
            }
        });

        // For ship rotation on touch move
        document.addEventListener('touchmove', (e) => {
            // Only activate for gameplay screen
            if (this.game.gameState !== 'playing') return;

            // Skip if input cooldown is active
            if (this.game.inputCooldown) return;

            // Don't rotate if in orbit or if long press is active
            if (this.game.spaceship.orbiting || touchLongPressActive) {
                // Clear the long press timer if touch moves significantly
                clearTimeout(this.touchTimer);

                // Stop boosting if it was active
                if (touchLongPressActive) {
                    this.game.stopBoosting();
                    touchLongPressActive = false;
                }
                return;
            }

            // Get current touch position
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;

            // Calculate angle from center of the screen to touch point for rotation
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = Math.atan2(currentY - centerY, currentX - centerX);

            // Set ship rotation
            this.game.setShipRotation(angle + Math.PI / 2); // Adjust by 90 degrees
        });
    }

    setupKeyboardControls() {
        // Keyboard controls mapping
        const keys = {
            left: false,
            right: false,
            up: false,
            space: false
        };

        // Variables for space bar long press
        let spacebarPressStart = 0;
        let spacebarLongPressActive = false;
        const longPressThreshold = 300; // milliseconds to consider a long press

        // Variables for mouse click long press
        let mouseDownStart = 0;
        let mouseLongPressActive = false;
        let mouseIsDown = false;

        // Keydown event
        document.addEventListener('keydown', (e) => {
            // Skip if input cooldown is active (except for ESC)
            if (this.game.inputCooldown && e.code !== 'Escape') return;

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    keys.right = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    keys.up = true;
                    // No longer used for boost
                    break;
                case 'Space':
                    if (!keys.space) {
                        // Only set the start time when the key is first pressed
                        spacebarPressStart = Date.now();
                    }
                    keys.space = true;
                    // Toggle orbit state handled in keyup event for quick press
                    break;
                case 'Escape':
                    // Restart game when ESC is pressed
                    if (this.game.gameState === 'playing' || this.game.gameState === 'gameover') {
                        this.game.startGame();
                    }
                    break;
            }
        });

        // Keyup event
        document.addEventListener('keyup', (e) => {
            // Skip if input cooldown is active (except for ESC)
            if (this.game.inputCooldown && e.code !== 'Escape') return;

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    keys.up = false;
                    break;
                case 'Space':
                    keys.space = false;
                    const pressDuration = Date.now() - spacebarPressStart;

                    // If it was a short press, toggle orbit
                    if (pressDuration < longPressThreshold) {
                        if (this.game.spaceship.orbiting) {
                            this.game.exitOrbit();
                        } else {
                            this.game.tryEnterOrbit();
                        }
                    }

                    // Always stop boosting when spacebar is released
                    if (spacebarLongPressActive) {
                        this.game.stopBoosting();
                        spacebarLongPressActive = false;
                    }
                    break;
            }
        });

        // Mouse down event for long press
        document.addEventListener('mousedown', (e) => {
            if (this.game.gameState === 'playing') {
                // Skip if input cooldown is active
                if (this.game.inputCooldown) return;

                mouseIsDown = true;
                mouseDownStart = Date.now();
                mouseLongPressActive = false;
            }
        });

        // Mouse up event
        document.addEventListener('mouseup', (e) => {
            if (this.game.gameState === 'playing') {
                // Skip if input cooldown is active
                if (this.game.inputCooldown) return;

                const pressDuration = Date.now() - mouseDownStart;

                // If it was a short click, toggle orbit
                if (mouseIsDown && pressDuration < longPressThreshold) {
                    if (this.game.spaceship.orbiting) {
                        this.game.exitOrbit();
                    } else {
                        this.game.tryEnterOrbit();
                    }
                }

                // Always stop boosting when mouse is released
                if (mouseLongPressActive) {
                    this.game.stopBoosting();
                    mouseLongPressActive = false;
                }

                mouseIsDown = false;
            }
        });

        // Update game state based on keys and mouse
        this.keysInterval = setInterval(() => {
            // Skip updates if input cooldown is active
            if (this.game.inputCooldown) return;

            if (keys.left) {
                this.game.rotateShip(-0.1);
            }
            if (keys.right) {
                this.game.rotateShip(0.1);
            }

            // Check for spacebar long press
            if (keys.space && !spacebarLongPressActive) {
                const pressDuration = Date.now() - spacebarPressStart;
                if (pressDuration >= longPressThreshold) {
                    // Start boosting after long press threshold
                    this.game.startBoosting();
                    spacebarLongPressActive = true;
                }
            }

            // Check for mouse long press
            if (mouseIsDown && !mouseLongPressActive && this.game.gameState === 'playing') {
                const pressDuration = Date.now() - mouseDownStart;
                if (pressDuration >= longPressThreshold) {
                    // Start boosting after long press threshold
                    this.game.startBoosting();
                    mouseLongPressActive = true;
                }
            }
        }, 16);
    }

    destroy() {
        // Clean up any intervals/timers
        if (this.keysInterval) {
            clearInterval(this.keysInterval);
        }

        // Clear any remaining touch timers
        clearTimeout(this.touchTimer);
    }
} 