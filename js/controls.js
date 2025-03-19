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

        // Handle double tap for orbit entry/exit
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                // Double tap to toggle orbit state
                if (this.game.spaceship.orbiting) {
                    this.game.exitOrbit();
                } else {
                    this.game.tryEnterOrbit();
                }
            }
            lastTap = currentTime;
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
                    this.game.startBoosting();
                    break;
                case 'Space':
                    keys.space = true;
                    // Toggle orbit state
                    if (this.game.spaceship.orbiting) {
                        this.game.exitOrbit();
                    } else {
                        this.game.tryEnterOrbit();
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
                    this.game.stopBoosting();
                    break;
                case 'Space':
                    keys.space = false;
                    break;
            }
        });

        // Update game state based on keys
        this.keysInterval = setInterval(() => {
            if (keys.left) {
                this.game.rotateShip(-0.1);
            }
            if (keys.right) {
                this.game.rotateShip(0.1);
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