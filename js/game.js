class Game {
    constructor(app) {
        this.app = app;
        this.stage = app.stage;
        this.width = app.screen.width;
        this.height = app.screen.height;

        this.gameState = 'title'; // title, playing, gameover
        this.score = 0;
        this.highScore = getHighScore();

        // Create game containers
        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();

        this.stage.addChild(this.gameContainer);
        this.stage.addChild(this.uiContainer);

        // Game objects
        this.planets = [];
        this.hazards = [];
        this.spaceship = null;

        // Text elements
        this.fuelText = null;
        this.scoreText = null;
        this.messageText = null;

        // Sound effects
        this.sounds = {
            boost: new Howl({ src: ['sound/boost.mp3'] }),
            orbit: new Howl({ src: ['sound/orbit.mp3'] }),
            colonize: new Howl({ src: ['sound/colonize.mp3'] }),
            explosion: new Howl({ src: ['sound/explosion.mp3'] })
        };

        // Initialize the game
        this.init();
    }

    init() {
        // Initialize UI
        this.createUI();

        // Show title screen
        this.showTitleScreen();

        // Initialize controls
        this.controls = new Controls(this);

        // Start the game loop
        this.app.ticker.add(this.update, this);
    }

    createUI() {
        // Create fuel gauge
        this.fuelText = new PIXI.Text('FUEL: 100%', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        this.fuelText.x = 20;
        this.fuelText.y = 20;
        this.uiContainer.addChild(this.fuelText);

        // Create score display
        this.scoreText = new PIXI.Text('SCORE: 0', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        this.scoreText.x = 20;
        this.scoreText.y = 50;
        this.uiContainer.addChild(this.scoreText);

        // Create message text
        this.messageText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.messageText.anchor.set(0.5);
        this.messageText.x = this.width / 2;
        this.messageText.y = this.height / 2;
        this.uiContainer.addChild(this.messageText);
    }

    showTitleScreen() {
        this.gameState = 'title';

        // Show title and instructions
        this.messageText.text = 'ESCAPE ORBIT\n\nColonize planets and escape the solar system\n\nTap/Click to Start';

        // Listen for click/tap to start
        this.stage.interactive = true;
        this.stage.once('pointerdown', () => {
            this.startGame();
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.messageText.text = '';

        // Clear any existing game objects
        this.gameContainer.removeChildren();
        this.planets = [];
        this.hazards = [];

        // Create planets
        this.createPlanets();

        // Create spaceship
        this.createSpaceship();

        // Create initial hazards
        this.createHazards();
    }

    createPlanets() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Create planets based on constants
        CONSTANTS.PLANETS.forEach((planetData, index) => {
            // Position planets in a row from left to right
            const x = centerX + (index - CONSTANTS.STARTING_PLANET) *
                (this.width * CONSTANTS.PLANET_DISTANCE_MULTIPLIER);
            const y = centerY + Math.sin(index * 0.7) * (this.height * 0.2);

            const planet = new Planet({
                name: planetData.name,
                radius: planetData.radius,
                color: planetData.color,
                x: x,
                y: y
            });

            this.planets.push(planet);
            this.gameContainer.addChild(planet.sprite);
        });

        // Colonize the starting planet (Earth)
        this.planets[CONSTANTS.STARTING_PLANET].colonize();
    }

    createSpaceship() {
        // Create spaceship
        this.spaceship = new Spaceship();

        // Place spaceship in orbit around Earth
        const startingPlanet = this.planets[CONSTANTS.STARTING_PLANET];
        this.spaceship.x = startingPlanet.x + startingPlanet.radius * 1.5;
        this.spaceship.y = startingPlanet.y;
        this.spaceship.enterOrbit(startingPlanet, startingPlanet.radius * 1.5);

        this.gameContainer.addChild(this.spaceship.sprite);
    }

    createHazards() {
        // Create some meteors
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;

            // Don't spawn too close to the starting planet
            const startingPlanet = this.planets[CONSTANTS.STARTING_PLANET];
            if (distance(x, y, startingPlanet.x, startingPlanet.y) < 200) continue;

            const meteor = new Hazard('meteor', x, y);
            this.hazards.push(meteor);
            this.gameContainer.addChild(meteor.sprite);
        }

        // Create a black hole
        const x = this.width * 0.8;
        const y = this.height * 0.3;
        const blackhole = new Hazard('blackhole', x, y);
        this.hazards.push(blackhole);
        this.gameContainer.addChild(blackhole.sprite);
    }

    update(delta) {
        if (this.gameState !== 'playing') return;

        // Update spaceship
        if (this.spaceship) {
            this.spaceship.update(this.planets);

            // Update camera to follow spaceship
            this.updateCamera();

            // Update fuel display
            this.fuelText.text = `FUEL: ${Math.floor(this.spaceship.fuel)}%`;

            // Check for game over conditions
            if (this.spaceship.fuel <= 0 && !this.spaceship.orbiting) {
                this.gameOver('Out of fuel! You drift in space forever...');
                return;
            }
        }

        // Update planets
        this.planets.forEach(planet => planet.update());

        // Update hazards and check for collisions
        this.hazards.forEach(hazard => {
            hazard.update();

            const collision = hazard.applyEffect(this.spaceship);
            if (collision === 'collision') {
                this.gameOver('Your ship was destroyed by a meteor!');
                return;
            } else if (collision === 'consumed') {
                this.gameOver('Your ship was consumed by a black hole!');
                return;
            }
        });

        // Check for colonization
        this.checkForColonization();

        // Update score
        this.updateScore();
    }

    updateCamera() {
        // Center camera on spaceship with some deadzone
        const cameraDeadZoneX = this.width * 0.3;
        const cameraDeadZoneY = this.height * 0.3;

        // How far ship is from center of screen
        const distX = this.spaceship.x - (this.width / 2);
        const distY = this.spaceship.y - (this.height / 2);

        // Only move camera if ship is outside deadzone
        if (Math.abs(distX) > cameraDeadZoneX) {
            const moveX = distX - Math.sign(distX) * cameraDeadZoneX;
            this.gameContainer.x -= moveX;
        }

        if (Math.abs(distY) > cameraDeadZoneY) {
            const moveY = distY - Math.sign(distY) * cameraDeadZoneY;
            this.gameContainer.y -= moveY;
        }
    }

    checkForColonization() {
        // Count colonized planets
        let colonizedCount = 0;

        this.planets.forEach(planet => {
            if (planet.colonized) {
                colonizedCount++;
            }
        });

        // Update score based on colonized planets
        this.score = colonizedCount * 100;
        this.scoreText.text = `SCORE: ${this.score}`;

        // Win condition - all planets colonized
        if (colonizedCount === this.planets.length) {
            this.gameOver('Victory! You colonized all planets!', true);
        }
    }

    updateScore() {
        // Update the score display
        this.scoreText.text = `SCORE: ${this.score}`;
    }

    gameOver(message, isVictory = false) {
        this.gameState = 'gameover';

        // Check for high score
        const newHighScore = saveHighScore(this.score);
        this.highScore = getHighScore();

        let gameOverText = message + '\n\n';
        gameOverText += `SCORE: ${this.score}\n`;
        gameOverText += `HIGH SCORE: ${this.highScore}\n\n`;

        if (newHighScore) {
            gameOverText += 'NEW HIGH SCORE!\n\n';
        }

        gameOverText += 'Tap/Click to Play Again';

        this.messageText.text = gameOverText;

        // Play sound effect
        if (isVictory) {
            // this.sounds.victory.play();
        } else {
            this.sounds.explosion.play();
        }

        // Listen for click/tap to restart
        this.stage.once('pointerdown', () => {
            this.startGame();
        });
    }

    // Control methods called by Controls class
    startBoosting() {
        if (this.spaceship && this.gameState === 'playing') {
            this.spaceship.startBoosting();
            this.sounds.boost.play();
        }
    }

    stopBoosting() {
        if (this.spaceship) {
            this.spaceship.stopBoosting();
        }
    }

    rotateShip(amount) {
        if (this.spaceship && !this.spaceship.orbiting) {
            this.spaceship.rotation += amount;
        }
    }

    setShipRotation(angle) {
        if (this.spaceship && !this.spaceship.orbiting) {
            this.spaceship.rotation = angle;
        }
    }

    exitOrbit() {
        if (this.spaceship && this.spaceship.orbiting && this.gameState === 'playing') {
            this.spaceship.exitOrbit();
            this.sounds.orbit.play();
        }
    }
} 