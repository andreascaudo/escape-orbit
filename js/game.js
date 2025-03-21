class Game {
    constructor(app) {
        this.app = app;
        this.stage = app.stage;
        this.width = app.screen.width;
        this.height = app.screen.height;

        this.gameState = 'title'; // title, playing, gameover
        this.score = 0;
        this.highScore = getHighScore();

        // Detect if on mobile device
        this.isMobile = this.detectMobile();

        // Camera and zoom settings - adjust based on device and orientation
        if (this.isMobile) {
            // Check if we're in landscape (width > height)
            const isLandscape = window.innerWidth > window.innerHeight;
            // For landscape orientation on mobile, use a slightly larger zoom 
            this.zoom = isLandscape ? 0.4 : 0.3; // 40% zoom on mobile landscape, 30% on portrait
        } else {
            this.zoom = 0.6; // 60% on desktop
        }
        this.minZoom = 0.3; // Allow zooming out further
        this.maxZoom = 2;

        // Create game containers
        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();

        this.stage.addChild(this.gameContainer);
        this.stage.addChild(this.uiContainer);

        // Game objects
        this.planets = [];
        this.hazards = [];
        this.fuelBoosts = []; // Add fuel boosts array
        this.spaceship = null;

        // Text elements
        this.fuelText = null;
        this.scoreText = null;
        this.messageText = null;
        this.zoomText = null;
        this.planetCountText = null; // Add planet counter text
        this.orbitHelpText = null;
        this.orbitEntryText = null;
        this.sunWarningText = null;

        // Sound effects
        this.sounds = {
            boost: new Howl({ src: ['sound/boost.mp3'] }),
            orbit: new Howl({ src: ['sound/orbit.mp3'] }),
            colonize: new Howl({ src: ['sound/colonize.mp3'] }),
            explosion: new Howl({ src: ['sound/explosion.mp3'] }),
            burning: new Howl({
                src: ['sound/burning.mp3'],
                volume: 0.5,
                loop: true
            })
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

        // Add keyboard event listeners for zoom
        window.addEventListener('keydown', (e) => {
            // Zoom in with '+' key or '='
            if (e.key === '+' || e.key === '=') {
                this.zoomIn();
            }
            // Zoom out with '-' key
            else if (e.key === '-') {
                this.zoomOut();
            }
            // Reset zoom with '0' key
            else if (e.key === '0') {
                this.resetZoom();
            }
        });

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

        // Create zoom display
        this.zoomText = new PIXI.Text('ZOOM: 100%', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        this.zoomText.x = 20;
        this.zoomText.y = 80;
        this.uiContainer.addChild(this.zoomText);

        // Create planet counter with more space
        this.planetCountText = new PIXI.Text('Visited 🪂: 0/8\nColonized 🏴‍☠️: 0/8', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        this.planetCountText.x = 20;
        this.planetCountText.y = 110;
        this.uiContainer.addChild(this.planetCountText);

        // Create zoom instruction - only on desktop
        if (!this.isMobile) {
            const zoomInstructions = new PIXI.Text('Press + to zoom in, - to zoom out, 0 to reset', {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xAAAAAA
            });
            zoomInstructions.x = 20;
            zoomInstructions.y = 165;
            this.uiContainer.addChild(zoomInstructions);
        }

        // Create orbit help text
        this.orbitHelpText = new PIXI.Text('SPACE: Exit Orbit | Trajectory line shows predicted path', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFCC33
        });
        this.orbitHelpText.x = this.width / 2;
        this.orbitHelpText.y = this.height - 40;
        this.orbitHelpText.anchor.set(0.5, 0);
        this.orbitHelpText.visible = false; // Initially hidden
        this.uiContainer.addChild(this.orbitHelpText);

        // Create orbit entry help text
        this.orbitEntryText = new PIXI.Text('SPACE: Enter Orbit around nearby planet', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x33CCFF
        });
        this.orbitEntryText.x = this.width / 2;
        this.orbitEntryText.y = this.height - 70;
        this.orbitEntryText.anchor.set(0.5, 0);
        this.orbitEntryText.visible = false; // Initially hidden
        this.uiContainer.addChild(this.orbitEntryText);

        // Create message text
        this.messageText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 22,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center',
            lineHeight: 28,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 2
        });
        this.messageText.anchor.set(0.5);
        this.messageText.x = this.width / 2;
        this.messageText.y = this.height / 2;
        this.uiContainer.addChild(this.messageText);
    }

    showTitleScreen() {
        console.log('Showing title screen');
        this.gameState = 'title';

        // Create a background for the instructions
        const instructionsBg = new PIXI.Graphics();
        instructionsBg.beginFill(0x000000, 0.1);
        instructionsBg.drawRoundedRect(-this.width * 0.4, -this.height * 0.4, this.width * 0.8, this.height * 0.8, 20);
        instructionsBg.endFill();
        instructionsBg.x = this.width / 2;
        instructionsBg.y = this.height / 2;
        this.uiContainer.addChild(instructionsBg);

        // Show title and instructions
        this.messageText.text = 'ESCAPE ORBIT\n\n' +
            'CONTROLS:\n' +
            '• SPACE/MOUSE: Hold for boost, tap to enter/exit orbit\n' +
            '• +/- KEYS: Zoom in/out\n\n' +
            'GAMEPLAY:\n' +
            '• 🪂 Visit planets by entering orbit\n' +
            '• 🏴‍☠️ Colonize planets by moving close to their surface\n' +
            '• Collect fuel pods (🛰️) and avoid hazards (☄️)\n' +
            '• Win by colonizing all planets\n\n' +
            'Tap/Click to Start';

        // Make the message text interactive and visible
        this.messageText.eventMode = 'static';
        this.messageText.cursor = 'pointer';

        // Add a background rectangle to make the clickable area more visible
        const clickArea = new PIXI.Graphics();
        clickArea.beginFill(0x000000, 0.01); // Almost transparent
        clickArea.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
        clickArea.endFill();
        clickArea.x = this.width / 2;
        clickArea.y = this.height / 2;
        clickArea.eventMode = 'static';
        this.uiContainer.addChild(clickArea);

        console.log('Setting up click events');

        // Listen for click/tap on message text (only for title screen)
        this.messageText.on('pointerdown', () => {
            console.log('Message text clicked');
            if (this.gameState === 'title') {
                this.startGame();
            }
        });

        // Listen for click/tap on background (only for title screen)
        clickArea.on('pointerdown', () => {
            console.log('Click area clicked');
            if (this.gameState === 'title') {
                this.startGame();
            }
        });

        // Make the entire stage clickable as fallback
        this.stage.eventMode = 'static';
        this.stage.on('pointerdown', () => {
            console.log('Stage clicked');
            if (this.gameState === 'title') {
                this.startGame();
            }
        });
    }

    startGame() {
        console.log('Starting game');
        this.gameState = 'playing';
        this.score = 0;
        this.messageText.text = '';
        this.zoom = this.isMobile ? 0.3 : 0.6; // Use 30% zoom on mobile, 60% on desktop

        // Remove any UI elements from the title screen
        this.uiContainer.children.forEach(child => {
            if (child !== this.fuelText &&
                child !== this.scoreText &&
                child !== this.zoomText &&
                child !== this.planetCountText &&
                child !== this.messageText &&
                child !== this.orbitHelpText &&
                child !== this.orbitEntryText &&
                !(this.isMobile ? false : child.text && child.text.includes('Press + to zoom'))) {
                this.uiContainer.removeChild(child);
            }
        });

        // Add a short cooldown period to prevent input actions right after starting the game
        this.inputCooldown = true;
        setTimeout(() => {
            this.inputCooldown = false;
        }, 500); // 500ms cooldown

        // Clear any existing game objects
        this.clearGameObjects();

        // Create planets
        this.createPlanets();
        console.log('Planets created:', this.planets.length);

        // Draw system boundary
        this.drawBoundary();

        // Create spaceship
        this.createSpaceship();
        console.log('Spaceship created');

        // Create initial hazards
        this.createHazards();
        console.log('Hazards created:', this.hazards.length);

        // Create fuel boosts
        this.createFuelBoosts(); // Add initial fuel boosts

        // Calculate total planets excluding starting planet
        const totalPlanets = this.planets.length;

        // Initialize planet counters (will be updated in checkForColonization)
        this.planetCountText.text = `Visited 🪂: 0/${totalPlanets}\nColonized 🏴‍☠️: 0/${totalPlanets}`;

        // Apply initial zoom
        this.applyZoom();
    }

    createPlanets() {
        // Create the center of the solar system (the Sun)
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Create the Sun
        this.sun = new Sun({
            name: CONSTANTS.SUN.name,
            radius: CONSTANTS.SUN.radius,
            color: CONSTANTS.SUN.color,
            x: centerX,
            y: centerY
        });

        // Add the Sun to the stage
        this.gameContainer.addChild(this.sun.sprite);

        // Create Sun label
        const sunLabel = new PIXI.Text('Sun', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
        });
        sunLabel.anchor.set(0.5);
        sunLabel.x = centerX;
        sunLabel.y = centerY + this.sun.radius + 20;
        this.gameContainer.addChild(sunLabel);

        // Create planets based on constants
        CONSTANTS.PLANETS.forEach((planetData, index) => {
            // Randomize the orbit angle for planets
            const randomAngle = Math.random() * Math.PI * 2;

            const planet = new Planet({
                name: planetData.name,
                radius: planetData.radius,
                color: planetData.color,
                orbitRadius: planetData.orbitRadius,
                orbitSpeed: planetData.orbitSpeed,
                orbitAngle: randomAngle // Use random angle instead of fixed value
            });

            // Set the Sun's position for each planet's orbit
            planet.setSunPosition(centerX, centerY);

            // Add orbit path to game container
            this.gameContainer.addChild(planet.orbitPath);

            // Add planet to array and game container
            this.planets.push(planet);
            this.gameContainer.addChild(planet.sprite);

            // Add orbit indicator to game container (initially invisible)
            planet.updateOrbitIndicator(false);
            this.gameContainer.addChild(planet.orbitIndicator);

            // Add planet label to game container
            this.gameContainer.addChild(planet.label);
        });

        // Colonize the starting planet (Earth)
        this.planets[CONSTANTS.STARTING_PLANET].colonize();
    }

    createSpaceship() {
        // Create spaceship
        this.spaceship = new Spaceship();

        // Place spaceship in orbit around Earth
        const startingPlanet = this.planets[CONSTANTS.STARTING_PLANET];

        // Position the spaceship slightly offset from the planet
        this.spaceship.x = startingPlanet.x + startingPlanet.radius * 1.5;
        this.spaceship.y = startingPlanet.y;

        // Enter orbit around the starting planet
        this.spaceship.enterOrbit(startingPlanet, startingPlanet.radius * 1.5);

        // Add spaceship and trajectory line to the game container
        this.gameContainer.addChild(this.spaceship.trajectoryLine);
        this.gameContainer.addChild(this.spaceship.sprite);

        // Initialize camera position to center on the starting planet
        this.gameContainer.x = this.width / 2 - startingPlanet.x;
        this.gameContainer.y = this.height / 2 - startingPlanet.y;

        // Store initial camera position
        this.initialCameraX = this.gameContainer.x;
        this.initialCameraY = this.gameContainer.y;
    }

    createHazards() {
        // Create some meteors
        for (let i = 0; i < 10; i++) {
            const x = this.width * Math.random();
            const y = this.width * Math.random();

            // Don't spawn too close to the starting planet
            const startingPlanet = this.planets[CONSTANTS.STARTING_PLANET];
            if (distance(x, y, startingPlanet.x, startingPlanet.y) < 200) continue;

            const meteor = new Hazard('meteor', x, y);
            this.hazards.push(meteor);
            this.gameContainer.addChild(meteor.sprite);
        }

        // Create a black hole
        const x = this.width * Math.random();
        const y = this.height * Math.random();
        const blackhole = new Hazard('blackhole', x, y);
        this.hazards.push(blackhole);
        this.gameContainer.addChild(blackhole.sprite);
    }

    createFuelBoosts() {
        // Create fewer fuel boosts initially
        for (let i = 0; i < 2; i++) { // Reduced from 3 to 2
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;

            // Don't spawn too close to the starting planet
            const startingPlanet = this.planets[CONSTANTS.STARTING_PLANET];
            if (distance(x, y, startingPlanet.x, startingPlanet.y) < 200) continue;

            const fuelBoost = new FuelBoost(x, y);
            this.fuelBoosts.push(fuelBoost);
            this.gameContainer.addChild(fuelBoost.sprite);
        }
    }

    update(delta) {
        if (this.gameState !== 'playing') return;

        // Update the Sun
        if (this.sun) {
            this.sun.update();

            // Check if spaceship is too close to the sun
            if (this.spaceship) {
                const sunProximity = this.sun.checkSpaceshipProximity(this.spaceship);

                // If spaceship is destroyed by the sun
                if (sunProximity === 'destroyed') {
                    this.gameOver('Your spaceship was incinerated by the Sun!');
                    return;
                }

                // Set burning state on spaceship for visual effects
                const wasBurning = this.spaceship.burning;
                this.spaceship.burning = sunProximity === 'burning';

                // Handle sound effects for burning
                if (this.spaceship.burning && !wasBurning) {
                    // Start burning sound when entering danger zone
                    this.sounds.burning.play();
                } else if (!this.spaceship.burning && wasBurning) {
                    // Stop burning sound when leaving danger zone
                    this.sounds.burning.stop();
                }

                // Add warning message when burning
                if (this.spaceship.burning) {
                    if (!this.sunWarningText) {
                        this.sunWarningText = new PIXI.Text('WARNING: Solar radiation damaging ship!', {
                            fontFamily: 'Arial',
                            fontSize: 20,
                            fontWeight: 'bold',
                            fill: 0xFF3300,
                            align: 'center'
                        });
                        this.sunWarningText.anchor.set(0.5);
                        this.sunWarningText.x = this.width / 2;
                        this.sunWarningText.y = 100;
                        this.uiContainer.addChild(this.sunWarningText);
                    }

                    // Pulse the warning text
                    this.sunWarningText.alpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
                    this.sunWarningText.visible = true;
                } else if (this.sunWarningText) {
                    this.sunWarningText.visible = false;
                }
            }

            // Check if hazards are too close to the sun
            this.hazards.forEach(hazard => {
                if (hazard.active && this.sun.checkObjectProximity(hazard)) {
                    // Disintegrate the hazard
                    hazard.startDisintegration();
                }
            });

            // Check if fuel boosts are too close to the sun
            this.fuelBoosts.forEach(fuelBoost => {
                if (fuelBoost.active && this.sun.checkObjectProximity(fuelBoost)) {
                    // Disintegrate the fuel boost
                    fuelBoost.startDisintegration();
                }
            });
        }

        // Update spaceship
        if (this.spaceship) {
            this.spaceship.update(this.planets);

            // Update camera
            this.updateCamera();

            // Update fuel display
            this.fuelText.text = `FUEL: ${Math.floor(this.spaceship.fuel)}%`;

            // Show orbit help text when in orbit
            this.orbitHelpText.visible = !!this.spaceship.orbiting;

            // Update orbit indicators on all planets
            this.updateOrbitIndicators();

            // Show orbit entry text when near a planet but not in orbit
            this.orbitEntryText.visible = false; // We're using visual indicators now instead

            // Check for game over conditions
            if (this.spaceship.fuel <= 0) {
                if (this.spaceship.orbiting) {
                    this.gameOver('Out of fuel! Your ship is stranded in orbit forever...');
                } else {
                    this.gameOver('Out of fuel! You drift in space forever...');
                }
                return;
            }
        }

        // Update planets
        this.planets.forEach(planet => planet.update());

        // Update hazards and check for collisions
        let activeHazardCount = 0;
        this.hazards.forEach(hazard => {
            // Check if meteors should disintegrate near planets or orbiting spaceship
            hazard.checkPlanetInteraction(this.planets, this.spaceship);

            hazard.update();

            if (hazard.active) {
                activeHazardCount++;

                const collision = hazard.applyEffect(this.spaceship);
                if (collision === 'collision') {
                    this.gameOver('Your ship was destroyed by a meteor!');
                    return;
                } else if (collision === 'consumed') {
                    this.gameOver('Your ship was consumed by a black hole!');
                    return;
                }
            }
        });

        // Update fuel boosts
        this.fuelBoosts.forEach(fuelBoost => {
            try {
                fuelBoost.update();
                fuelBoost.checkPlanetInteraction(this.planets);

                // Check for collection
                if (this.spaceship) {
                    const fuelAmount = fuelBoost.checkCollection(this.spaceship);
                    if (fuelAmount) {
                        // Add fuel to spaceship
                        this.spaceship.fuel = Math.min(CONSTANTS.MAX_FUEL, this.spaceship.fuel + fuelAmount);

                        // Show fuel collection message
                        this.showMessage(`Collected ${fuelAmount} fuel!`, 1500);

                        // Play sound effect (reuse existing sound)
                        this.sounds.colonize.play();
                    }
                }
            } catch (error) {
                console.error("Error with fuel boost:", error);
                // Deactivate problematic fuel boost to prevent further issues
                fuelBoost.active = false;
                if (fuelBoost.sprite && fuelBoost.sprite.parent) {
                    fuelBoost.sprite.parent.removeChild(fuelBoost.sprite);
                }
            }
        });

        // Periodically replace disintegrated meteors to keep the game challenging
        if (this.gameState === 'playing' && Math.random() < 0.01 && activeHazardCount < 15) {
            this.addNewMeteor();
        }

        // Occasionally spawn a new fuel boost if we're below the desired count
        // Even less frequent spawning (0.002 -> 0.001) and maintain maximum of 2 boosts (reduced from 3)
        if (this.fuelBoosts.filter(fb => fb.active).length < 2 && Math.random() < 0.001) {
            this.addNewFuelBoost();
        }

        // Remove inactive hazards and fuel boosts
        this.cleanupInactiveObjects();

        // Check for colonization
        this.checkForColonization();

        // Update score
        this.updateScore();
    }

    updateCamera() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Only follow spaceship if it's not in orbit around starting planet
        if (!this.spaceship.orbiting || this.spaceship.orbiting !== this.planets[CONSTANTS.STARTING_PLANET]) {
            // Calculate target position to center the ship
            const targetX = centerX - this.spaceship.x * this.zoom;
            const targetY = centerY - this.spaceship.y * this.zoom;

            // Use smooth interpolation for camera movement
            const cameraSpeed = 0.15; // Adjust this value to control smoothness (0.1 to 0.3 works well)
            this.gameContainer.x += (targetX - this.gameContainer.x) * cameraSpeed;
            this.gameContainer.y += (targetY - this.gameContainer.y) * cameraSpeed;
        } else {
            // Smoothly return to initial position when in orbit around starting planet
            const returnSpeed = 0.05;
            const targetX = centerX - this.planets[CONSTANTS.STARTING_PLANET].x * this.zoom;
            const targetY = centerY - this.planets[CONSTANTS.STARTING_PLANET].y * this.zoom;

            this.gameContainer.x += (targetX - this.gameContainer.x) * returnSpeed;
            this.gameContainer.y += (targetY - this.gameContainer.y) * returnSpeed;
        }
    }

    checkForColonization() {
        // Count colonized and visited planets
        let colonizedCount = 0;
        let orbitVisitedCount = 0; // Only planets visited by orbit (parachute)
        let totalPlanetsToColonize = 0;

        this.planets.forEach((planet, index) => {
            // Skip the starting planet in the win condition count
            totalPlanetsToColonize++;
            if (index !== CONSTANTS.STARTING_PLANET) {
                if (planet.colonized) {
                    colonizedCount++;
                } else if (planet.orbitVisited) {
                    orbitVisitedCount++;
                }
            }
        });

        // Calculate the total planets excluding the starting planet
        const totalPlanets = totalPlanetsToColonize; // Exclude starting planet from count

        // Update score display (no need to recalculate score each frame)
        this.scoreText.text = `SCORE: ${this.score}`;

        // Win condition - all planets except starting planet colonized
        if (colonizedCount === totalPlanets && totalPlanets > 0) {
            this.gameOver('Victory! You colonized all planets!', true);
        }

        // Update planet counter with separate counts for visited and colonized, showing totals
        this.planetCountText.text = `Visited 🪂: ${orbitVisitedCount}/${totalPlanets}\nColonized 🏴‍☠️: ${colonizedCount}/${totalPlanets}`;
    }

    // Separate scoring method for planet visits and colonization
    addScoreForPlanetAction(planet, action) {
        // Don't add score for the starting planet
        if (planet === this.planets[CONSTANTS.STARTING_PLANET]) {
            return;
        }

        // Add score based on action type
        if (action === 'visit' && !planet.visitScoreAdded) {
            this.score += 20;
            planet.visitScoreAdded = true; // Mark that we've already awarded visit points
            console.log(`Added 20 points for visiting ${planet.name}`);

            // Update the score display
            this.updateScore();
            // No need to update planet counter here, it's handled in checkForColonization
        }
        else if (action === 'colonize' && !planet.colonizeScoreAdded) {
            this.score += 100;
            planet.colonizeScoreAdded = true; // Mark that we've already awarded colonization points
            console.log(`Added 100 points for colonizing ${planet.name}`);

            // Update the score display
            this.updateScore();
            // No need to update planet counter here, it's handled in checkForColonization
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

        gameOverText += 'Click/Tap or Press ESC to Play Again';

        this.messageText.text = gameOverText;

        // Play sound effect
        if (isVictory) {
            // this.sounds.victory.play();
        } else {
            this.sounds.explosion.play();
        }

        // Add click/tap listener to restart the game
        this.setupGameOverClickListener();
    }

    // Set up click/tap to restart game after game over
    setupGameOverClickListener() {
        // Make sure we don't add duplicate listeners
        this.stage.eventMode = 'static';
        this.stage.off('pointerdown');

        // Make message text interactive
        this.messageText.eventMode = 'static';
        this.messageText.cursor = 'pointer';

        // Add the click/tap listener to both stage and message text
        this.stage.on('pointerdown', () => {
            if (this.gameState === 'gameover') {
                this.startGame();
            }
        });

        this.messageText.on('pointerdown', () => {
            if (this.gameState === 'gameover') {
                this.startGame();
            }
        });
    }

    // Control methods called by Controls class
    startBoosting() {
        // Skip during input cooldown period
        if (this.inputCooldown) return;

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
        // Skip during input cooldown period
        if (this.inputCooldown) return;

        if (this.spaceship && this.spaceship.orbiting && this.gameState === 'playing') {
            const success = this.spaceship.exitOrbit();

            if (success) {
                // Play orbit exit sound if successful
                this.sounds.orbit.play();
            } else if (this.spaceship.fuel < CONSTANTS.BOOST_FUEL_CONSUMPTION * 0.75) {
                // Show a message if there's not enough fuel to exit orbit
                this.showMessage("Not enough fuel to exit orbit!", 1500);
            }
        }
    }

    drawBoundary() {
        // Draw a boundary around the solar system to help with orientation
        const outerPlanetDistance = CONSTANTS.PLANETS[CONSTANTS.PLANETS.length - 1].orbitRadius;
        // Make the boundary slightly larger to accommodate the larger orbits
        const boundaryRadius = outerPlanetDistance * 1.1;

        // Create a boundary circle
        if (!this.boundary) {
            this.boundary = new PIXI.Graphics();
            this.gameContainer.addChild(this.boundary);
        }

        this.boundary.clear();
        this.boundary.lineStyle(2, 0x444466, 0.3);
        this.boundary.drawCircle(this.width / 2, this.height / 2, boundaryRadius);
    }

    zoomIn() {
        this.zoom = Math.min(this.maxZoom, this.zoom + 0.1);
        this.applyZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.minZoom, this.zoom - 0.1);
        this.applyZoom();
    }

    resetZoom() {
        this.zoom = 1;
        this.applyZoom();
    }

    applyZoom() {
        // Set container scale
        this.gameContainer.scale.set(this.zoom);

        // Don't directly set the container position here as it will cause a jump
        // Instead, let the updateCamera method handle the smooth positioning
        // Just update the zoom text
        const zoomPercentage = Math.round(this.zoom * 100);
        this.zoomText.text = `ZOOM: ${zoomPercentage}%`;

        // Force camera update to start adjusting to the new zoom level
        this.updateCamera();
    }

    // Try to enter orbit
    tryEnterOrbit() {
        // Skip during input cooldown period
        if (this.inputCooldown) return false;

        if (this.spaceship && this.gameState === 'playing' && !this.spaceship.orbiting) {
            if (this.spaceship.tryEnterOrbit()) {
                // Play orbit sound
                this.sounds.orbit.play();
                return true;
            }
        }
        return false;
    }

    // Update orbit indicators on planets
    updateOrbitIndicators() {
        if (!this.spaceship || this.spaceship.orbiting) {
            // If in orbit, make sure all indicators are hidden
            this.planets.forEach(planet => {
                planet.updateOrbitIndicator(false);
            });
            return;
        }

        // First, hide all indicators
        this.planets.forEach(planet => {
            planet.updateOrbitIndicator(false);
        });

        // Find the closest planet in orbit range
        let closestPlanet = null;
        let closestDistance = Infinity;

        this.planets.forEach(planet => {
            const dist = distance(this.spaceship.x, this.spaceship.y, planet.x, planet.y);

            // Check if planet is in range
            const orbitRangeMultiplier = 5; // How far away player can enter orbit
            if (dist > planet.radius * 1.2 && dist < planet.atmosphere * orbitRangeMultiplier) {
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestPlanet = planet;
                }
            }
        });

        // Only show indicator for the closest planet
        if (closestPlanet) {
            closestPlanet.updateOrbitIndicator(true);
        }
    }

    // Add a new meteor to replace disintegrated ones
    addNewMeteor() {
        // Choose a random edge of the screen to spawn from
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;

        // Position meteor at the edge of the screen
        switch (edge) {
            case 0: // top
                x = Math.random() * this.width;
                y = -50;
                break;
            case 1: // right
                x = this.width + 50;
                y = Math.random() * this.height;
                break;
            case 2: // bottom
                x = Math.random() * this.width;
                y = this.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.height;
                break;
        }

        // Adjust for camera position
        x -= this.gameContainer.x / this.zoom;
        y -= this.gameContainer.y / this.zoom;

        // Create new meteor
        const meteor = new Hazard('meteor', x, y);

        // Add velocity toward the center of the screen
        const angle = Math.atan2(
            this.height / 2 - y,
            this.width / 2 - x
        );
        const speed = 0.5 + Math.random() * 0.5;
        meteor.vx = Math.cos(angle) * speed;
        meteor.vy = Math.sin(angle) * speed;

        // Add to game
        this.hazards.push(meteor);
        this.gameContainer.addChild(meteor.sprite);
    }

    // Add a new fuel boost
    addNewFuelBoost() {
        // Choose a random position at the edge of the visible area, similar to meteors
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;

        // Position fuel boost at the edge of the screen
        switch (edge) {
            case 0: // top
                x = Math.random() * this.width;
                y = -50;
                break;
            case 1: // right
                x = this.width + 50;
                y = Math.random() * this.height;
                break;
            case 2: // bottom
                x = Math.random() * this.width;
                y = this.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.height;
                break;
        }

        // Adjust for camera position
        x -= this.gameContainer.x / this.zoom;
        y -= this.gameContainer.y / this.zoom;

        // Create new fuel boost
        const fuelBoost = new FuelBoost(x, y);

        // Add velocity toward the center area (with some randomness)
        const angle = Math.atan2(
            this.height / 2 - y + (Math.random() - 0.5) * this.height * 0.5,
            this.width / 2 - x + (Math.random() - 0.5) * this.width * 0.5
        );
        const speed = 0.3 + Math.random() * 0.3; // Slower than meteors
        fuelBoost.vx = Math.cos(angle) * speed;
        fuelBoost.vy = Math.sin(angle) * speed;

        // Add to game
        this.fuelBoosts.push(fuelBoost);
        this.gameContainer.addChild(fuelBoost.sprite);
    }

    // Clean up inactive objects
    cleanupInactiveObjects() {
        // Clean up inactive hazards
        this.hazards.forEach(hazard => {
            if (!hazard.active && hazard.sprite.parent) {
                this.gameContainer.removeChild(hazard.sprite);
            }
        });
        this.hazards = this.hazards.filter(hazard => hazard.active || hazard.type === 'blackhole');

        // Clean up inactive fuel boosts
        this.fuelBoosts.forEach(fuelBoost => {
            if (!fuelBoost.active && fuelBoost.sprite.parent) {
                this.gameContainer.removeChild(fuelBoost.sprite);
            }
        });
        this.fuelBoosts = this.fuelBoosts.filter(fuelBoost => fuelBoost.active);
    }

    // Clear all game objects for reset
    clearGameObjects() {
        // Properly clean up each planet
        if (this.planets && this.planets.length > 0) {
            this.planets.forEach(planet => {
                if (planet && typeof planet.destroy === 'function') {
                    planet.destroy();
                }
            });
        }

        // Remove all existing planets, hazards, and the spaceship from the container
        this.gameContainer.removeChildren();

        // Clear arrays
        this.planets = [];
        this.hazards = [];
        this.fuelBoosts = [];
        this.spaceship = null;
    }

    // Detect if the user is on a mobile device
    detectMobile() {
        return (
            // Check for touch capability
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // Check for mobile user agent
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            // Check for viewport width (most mobile devices have smaller screens)
            window.innerWidth <= 800
        );
    }

    // Show a temporary message to the player
    showMessage(text, duration = 2000) {
        // Create a temporary message that shows then fades out
        const message = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 3
        });

        message.anchor.set(0.5);
        message.x = this.width / 2;
        message.y = this.height / 2 - 100; // Display above the center
        this.uiContainer.addChild(message);

        // Animate and remove after duration
        let elapsed = 0;
        const ticker = new PIXI.Ticker();
        ticker.add((delta) => {
            elapsed += delta * 16.67; // Approximate milliseconds per frame

            if (elapsed >= duration) {
                // Remove message and stop ticker
                if (message.parent) {
                    message.parent.removeChild(message);
                }
                ticker.stop();
                ticker.destroy();
            } else if (elapsed > duration - 500) {
                // Fade out in the last 500ms
                message.alpha = 1 - (elapsed - (duration - 500)) / 500;
            }
        });
        ticker.start();
    }
} 