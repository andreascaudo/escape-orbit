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
        // Setup virtual joystick using nipplejs
        const joystickOptions = {
            zone: document.getElementById('joystick-zone'),
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 100
        };

        this.joystick = nipplejs.create(joystickOptions);

        // Handle joystick events
        this.joystick.on('move', (event, data) => {
            if (data.angle) {
                // Convert angle to radians and adjust for nipplejs coordinate system
                const angle = (data.angle.radian + Math.PI / 2) % (Math.PI * 2);
                this.game.setShipRotation(angle);
            }
        });

        // Setup boost button
        const boostButton = document.getElementById('boost-button');

        boostButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.boostButtonActive = true;
            this.game.startBoosting();
        });

        boostButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.boostButtonActive = false;
            this.game.stopBoosting();
        });

        // Variables for touch long press
        let touchStartTime = 0;
        let touchLongPressActive = false;
        const longPressThreshold = 300; // milliseconds to consider a long press

        // Handle touch on the screen (excluding joystick and boost button)
        document.addEventListener('touchstart', (e) => {
            // Only activate for gameplay screen
            if (this.game.gameState !== 'playing') return;

            // Skip if the touch is on the joystick or boost button
            const target = e.target;
            if (target.id === 'joystick-zone' || target.id === 'boost-button') return;

            touchStartTime = Date.now();
            touchLongPressActive = false;

            // Start touch timer to detect long press
            this.touchTimer = setTimeout(() => {
                if (this.game.gameState === 'playing') {
                    touchLongPressActive = true;
                    this.game.startBoosting();
                }
            }, longPressThreshold);
        });

        document.addEventListener('touchend', (e) => {
            // Only activate for gameplay screen
            if (this.game.gameState !== 'playing') return;

            // Skip if the touch is on the joystick or boost button
            const target = e.target;
            if (target.id === 'joystick-zone' || target.id === 'boost-button') return;

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

        // Cancel boost on touch move (if moved too far)
        document.addEventListener('touchmove', (e) => {
            // Clear the long press timer if touch moves significantly
            clearTimeout(this.touchTimer);

            // Stop boosting if it was active
            if (touchLongPressActive) {
                this.game.stopBoosting();
                touchLongPressActive = false;
            }
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
                mouseIsDown = true;
                mouseDownStart = Date.now();
                mouseLongPressActive = false;
            }
        });

        // Mouse up event
        document.addEventListener('mouseup', (e) => {
            if (this.game.gameState === 'playing') {
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
        if (this.joystick) {
            this.joystick.destroy();
        }
        if (this.keysInterval) {
            clearInterval(this.keysInterval);
        }
    }
} 