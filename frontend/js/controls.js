// controls.js

class Controls {
    constructor(game) {
        this.game = game;
        this.touchDevice = this.isTouchDevice();

        // Touch state variables
        this.touchStartTime = 0;
        this.touchLongPressActive = false; // Tracks if the long press threshold was met for the current touch
        this.touchTimer = null;          // Stores timer reference for long press detection
        this.isBoosting = false;         // Tracks if boosting is currently active

        // Keyboard/Mouse state variables (for desktop)
        this.keys = { left: false, right: false, up: false, space: false };
        this.spacebarPressStart = 0;
        this.spacebarLongPressActive = false;
        this.mouseDownStart = 0;
        this.mouseLongPressActive = false;
        this.mouseIsDown = false;
        this.keysInterval = null;        // Stores timer reference for keyboard polling

        // --- Store bound event handlers ---
        // Touch
        this._boundHandleTouchStart = this._handleTouchStart.bind(this);
        this._boundHandleTouchMove = this._handleTouchMove.bind(this);
        this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
        // Keyboard
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleKeyUp = this._handleKeyUp.bind(this);
        // Mouse
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);
        // Keyboard Interval Tick
        this._boundHandleKeysIntervalTick = this._handleKeysIntervalTick.bind(this);

        this.longPressThreshold = 300; // milliseconds

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

    // --- Touch Handlers ---

    _handleTouchStart(e) {
        if (this.game.gameState !== 'playing' || this.game.inputCooldown) return;
        // Consider preventing default if scroll/zoom becomes an issue:
        // e.preventDefault();

        const touch = e.touches[0];
        this.touchStartTime = Date.now();
        this.touchLongPressActive = false;
        this.isBoosting = false;

        clearTimeout(this.touchTimer); // Clear previous timer

        this.touchTimer = setTimeout(() => {
            if (this.game.gameState === 'playing' && !this.game.inputCooldown) {
                console.log('Long press detected - Starting boost');
                this.touchLongPressActive = true;
                this.isBoosting = true;
                this.game.startBoosting();
            }
        }, this.longPressThreshold);
    }

    _handleTouchMove(e) {
        if (this.game.gameState !== 'playing' || this.game.inputCooldown) return;

        // If boosting, ignore movement for rotation/cancelling boost
        if (this.isBoosting) {
            // Prevent default browser actions if boosting and moving (optional)
            // e.preventDefault();
            return;
        }

        // If NOT boosting yet, cancel the boost timer if finger moves.
        // Optional: Add a small pixel threshold here if needed.
        if (!this.touchLongPressActive) {
            // console.log('Touch moved before long press timer - cancelling boost timer.');
            clearTimeout(this.touchTimer);
        }

        // Rotation Logic (Only if not orbiting and not boosting)
        if (!this.game.spaceship.orbiting) {
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = Math.atan2(currentY - centerY, currentX - centerX);
            this.game.setShipRotation(angle + Math.PI / 2); // Adjust by 90 degrees
            // Prevent default browser actions if rotating (optional)
            // e.preventDefault();
        }
    }

    _handleTouchEnd(e) {
        // Check gameState but maybe not inputCooldown, as we need to stop boost regardless
        if (this.game.gameState !== 'playing') return;

        console.log('Touch end detected');
        clearTimeout(this.touchTimer); // Clear pending timer

        const touchDuration = Date.now() - this.touchStartTime;

        // Stop Boosting if it was active
        if (this.isBoosting) {
            console.log('Stopping boost on touch end');
            this.game.stopBoosting();
            this.isBoosting = false;
        }
        // Orbit Toggle on Short Tap (only if boost wasn't activated)
        else if (touchDuration < this.longPressThreshold && !this.touchLongPressActive) {
            console.log('Short tap detected - Toggling orbit');
            if (this.game.spaceship.orbiting) {
                this.game.exitOrbit();
            } else {
                this.game.tryEnterOrbit();
            }
        }

        // Reset flags
        this.touchLongPressActive = false;
        // isBoosting should be false here already
    }

    setupTouchControls() {
        console.log('Setting up improved touch controls for mobile');
        // Use passive: false if preventDefault() is needed inside the handlers
        const eventOptions = { passive: false };
        document.addEventListener('touchstart', this._boundHandleTouchStart, eventOptions);
        document.addEventListener('touchmove', this._boundHandleTouchMove, eventOptions);
        document.addEventListener('touchend', this._boundHandleTouchEnd); // touchend often doesn't need options
    }


    // --- Keyboard/Mouse Handlers ---

    _handleKeyDown(e) {
        if (this.game.inputCooldown && e.code !== 'Escape') return;

        switch (e.code) {
            case 'ArrowLeft': case 'KeyA':
                this.keys.left = true; break;
            case 'ArrowRight': case 'KeyD':
                this.keys.right = true; break;
            case 'ArrowUp': case 'KeyW':
                this.keys.up = true; break; // Still track 'up' if needed elsewhere
            case 'Space':
                if (!this.keys.space) {
                    this.spacebarPressStart = Date.now();
                    this.spacebarLongPressActive = false; // Reset on new press
                }
                this.keys.space = true;
                break;
            case 'Escape':
                if (this.game.gameState === 'playing' || this.game.gameState === 'gameover') {
                    this.game.startGame();
                }
                break;
        }
    }

    _handleKeyUp(e) {
        if (this.game.inputCooldown && e.code !== 'Escape') return;

        switch (e.code) {
            case 'ArrowLeft': case 'KeyA':
                this.keys.left = false; break;
            case 'ArrowRight': case 'KeyD':
                this.keys.right = false; break;
            case 'ArrowUp': case 'KeyW':
                this.keys.up = false; break;
            case 'Space':
                this.keys.space = false;
                const pressDuration = Date.now() - this.spacebarPressStart;

                // If boosting via space, stop it
                if (this.spacebarLongPressActive) {
                    this.game.stopBoosting();
                    this.spacebarLongPressActive = false;
                }
                // Otherwise, if it was a short press, toggle orbit
                else if (pressDuration < this.longPressThreshold) {
                    if (this.game.spaceship.orbiting) {
                        this.game.exitOrbit();
                    } else {
                        this.game.tryEnterOrbit();
                    }
                }
                break;
        }
    }

    _handleMouseDown(e) {
        if (this.game.gameState !== 'playing' || this.game.inputCooldown) return;
        // Add check for e.button === 0 for left click only if needed

        this.mouseIsDown = true;
        this.mouseDownStart = Date.now();
        this.mouseLongPressActive = false; // Reset on new press
    }

    _handleMouseUp(e) {
        if (this.game.gameState !== 'playing' /*|| this.game.inputCooldown*/) return; // Allow stopping boost even if cooldown started?
        // Add check for e.button === 0 for left click only if needed

        // If boosting via mouse, stop it
        if (this.mouseLongPressActive) {
            this.game.stopBoosting();
            this.mouseLongPressActive = false;
        }
        // Otherwise, if it was a short click, toggle orbit
        else if (this.mouseIsDown /*&& (Date.now() - this.mouseDownStart < this.longPressThreshold)*/) {
            // Check duration on mouseup as well to confirm short click
            const pressDuration = Date.now() - this.mouseDownStart;
            if (pressDuration < this.longPressThreshold) {
                if (this.game.spaceship.orbiting) {
                    this.game.exitOrbit();
                } else {
                    this.game.tryEnterOrbit();
                }
            }
        }

        this.mouseIsDown = false; // Reset flag last
    }

    // Handles continuous actions based on key state for keyboard/mouse
    _handleKeysIntervalTick() {
        if (this.game.gameState !== 'playing' || this.game.inputCooldown) return;

        // Rotation
        if (this.keys.left) { this.game.rotateShip(-0.1); }
        if (this.keys.right) { this.game.rotateShip(0.1); }

        // Boosting Check (Spacebar)
        if (this.keys.space && !this.spacebarLongPressActive) {
            if (Date.now() - this.spacebarPressStart >= this.longPressThreshold) {
                this.game.startBoosting();
                this.spacebarLongPressActive = true;
            }
        }

        // Boosting Check (Mouse)
        if (this.mouseIsDown && !this.mouseLongPressActive) {
            if (Date.now() - this.mouseDownStart >= this.longPressThreshold) {
                this.game.startBoosting();
                this.mouseLongPressActive = true;
            }
        }
    }

    setupKeyboardControls() {
        console.log('Setting up keyboard/mouse controls');
        document.addEventListener('keydown', this._boundHandleKeyDown);
        document.addEventListener('keyup', this._boundHandleKeyUp);
        document.addEventListener('mousedown', this._boundHandleMouseDown);
        document.addEventListener('mouseup', this._boundHandleMouseUp);

        // Start polling interval
        this.keysInterval = setInterval(this._boundHandleKeysIntervalTick, 16); // Approx 60fps
    }

    destroy() {
        console.log('Destroying Controls and removing listeners...');

        // Clear timers
        clearInterval(this.keysInterval);
        clearTimeout(this.touchTimer);
        this.keysInterval = null;
        this.touchTimer = null;

        // Remove touch listeners
        document.removeEventListener('touchstart', this._boundHandleTouchStart);
        document.removeEventListener('touchmove', this._boundHandleTouchMove);
        document.removeEventListener('touchend', this._boundHandleTouchEnd);

        // Remove keyboard listeners
        document.removeEventListener('keydown', this._boundHandleKeyDown);
        document.removeEventListener('keyup', this._boundHandleKeyUp);

        // Remove mouse listeners
        document.removeEventListener('mousedown', this._boundHandleMouseDown);
        document.removeEventListener('mouseup', this._boundHandleMouseUp);

        console.log('Controls destroyed.');
    }
}