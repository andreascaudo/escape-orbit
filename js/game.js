class Game {
    constructor(app) {
        this.app = app;
        this.stage = app.stage;
        this.width = app.screen.width;
        this.height = app.screen.height;

        this.gameState = 'title'; // title, playing, gameover
        this.score = 0;
        this.highScore = getHighScore();

        // Camera and zoom settings
        this.zoom = 0.6; // Start with a zoomed out view to see the larger orbits
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
        this.spaceship = null;

        // Text elements
        this.fuelText = null;
        this.scoreText = null;
        this.messageText = null;
        this.zoomText = null;
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

        // Create zoom instruction
        const zoomInstructions = new PIXI.Text('Press + to zoom in, - to zoom out, 0 to reset', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xAAAAAA
        });
        zoomInstructions.x = 20;
        zoomInstructions.y = 110;
        this.uiContainer.addChild(zoomInstructions);

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
        console.log('Showing title screen');
        this.gameState = 'title';

        // Show title and instructions
        this.messageText.text = 'ESCAPE ORBIT\n\nColonize planets and escape the solar system\n\nTap/Click to Start';

        // Make the message text interactive and visible
        this.messageText.interactive = true;
        this.messageText.buttonMode = true;

        // Add a background rectangle to make the clickable area more visible
        const clickArea = new PIXI.Graphics();
        clickArea.beginFill(0x000000, 0.01); // Almost transparent
        clickArea.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
        clickArea.endFill();
        clickArea.x = this.width / 2;
        clickArea.y = this.height / 2;
        clickArea.interactive = true;
        this.uiContainer.addChild(clickArea);

        console.log('Setting up click events');

        // Listen for click/tap on message text
        this.messageText.on('pointerdown', () => {
            console.log('Message text clicked');
            this.startGame();
        });

        // Listen for click/tap on background
        clickArea.on('pointerdown', () => {
            console.log('Click area clicked');
            this.startGame();
        });

        // Also keep the stage interactive as a fallback
        this.stage.interactive = true;
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
        this.zoom = 0.6; // Use the same default zoom as constructor

        // Clear any existing game objects
        this.gameContainer.removeChildren();
        this.planets = [];
        this.hazards = [];

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
            if (this.spaceship.fuel <= 0 && !this.spaceship.orbiting) {
                this.gameOver('Out of fuel! You drift in space forever...');
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

        // Periodically replace disintegrated meteors to keep the game challenging
        if (this.gameState === 'playing' && Math.random() < 0.01 && activeHazardCount < 15) {
            this.addNewMeteor();
        }

        // Remove inactive hazards
        this.cleanupInactiveHazards();

        // Check for colonization
        this.checkForColonization();

        // Update score
        this.updateScore();
    }

    updateCamera() {
        // Only follow spaceship if it's not in orbit around starting planet
        if (!this.spaceship.orbiting || this.spaceship.orbiting !== this.planets[CONSTANTS.STARTING_PLANET]) {
            // Center camera on spaceship with some deadzone
            const cameraDeadZoneX = this.width * 0.3;
            const cameraDeadZoneY = this.height * 0.3;

            // How far ship is from center of screen, accounting for zoom
            const adjustedX = this.spaceship.x * this.zoom;
            const adjustedY = this.spaceship.y * this.zoom;
            const centerX = this.width / 2;
            const centerY = this.height / 2;

            const distX = adjustedX - (centerX - this.gameContainer.x);
            const distY = adjustedY - (centerY - this.gameContainer.y);

            // Only move camera if ship is outside deadzone
            if (Math.abs(distX) > cameraDeadZoneX) {
                const moveX = distX - Math.sign(distX) * cameraDeadZoneX;
                this.gameContainer.x -= moveX;
            }

            if (Math.abs(distY) > cameraDeadZoneY) {
                const moveY = distY - Math.sign(distY) * cameraDeadZoneY;
                this.gameContainer.y -= moveY;
            }
        } else {
            // Smoothly return to initial position when in orbit around starting planet
            const returnSpeed = 0.05;
            const targetX = this.width / 2 - this.planets[CONSTANTS.STARTING_PLANET].x * this.zoom;
            const targetY = this.height / 2 - this.planets[CONSTANTS.STARTING_PLANET].y * this.zoom;

            this.gameContainer.x += (targetX - this.gameContainer.x) * returnSpeed;
            this.gameContainer.y += (targetY - this.gameContainer.y) * returnSpeed;
        }
    }

    checkForColonization() {
        // Count colonized and visited planets
        let colonizedCount = 0;
        let visitedCount = 0;
        let totalPlanetsToColonize = 0;

        this.planets.forEach((planet, index) => {
            // Skip the starting planet in the win condition count
            if (index !== CONSTANTS.STARTING_PLANET) {
                totalPlanetsToColonize++;
                if (planet.colonized) {
                    colonizedCount++;
                }
                if (planet.visited) {
                    visitedCount++;
                }
            }
        });

        // Update score display (no need to recalculate score each frame)
        this.scoreText.text = `SCORE: ${this.score} | Visited: ${visitedCount}/${totalPlanetsToColonize}`;

        // Win condition - all planets except starting planet colonized
        if (colonizedCount === totalPlanetsToColonize && totalPlanetsToColonize > 0) {
            this.gameOver('Victory! You colonized all planets!', true);
        }
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
        }
        else if (action === 'colonize' && !planet.colonizeScoreAdded) {
            this.score += 100;
            planet.colonizeScoreAdded = true; // Mark that we've already awarded colonization points
            console.log(`Added 100 points for colonizing ${planet.name}`);
        }

        // Update the score display
        this.scoreText.text = `SCORE: ${this.score} | Visited: ${this.getVisitCount()}/${this.getTotalPlanets()}`;
    }

    // Helper method to get visited planet count
    getVisitCount() {
        return this.planets.filter((planet, index) =>
            index !== CONSTANTS.STARTING_PLANET && planet.visited
        ).length;
    }

    // Helper method to get total planet count (excluding starting planet)
    getTotalPlanets() {
        return this.planets.length - 1; // Exclude starting planet
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
        this.gameContainer.scale.set(this.zoom);
        this.zoomText.text = `ZOOM: ${Math.round(this.zoom * 100)}%`;

        // Re-center view after zoom
        const startingPlanet = this.planets[CONSTANTS.STARTING_PLANET];
        if (startingPlanet) {
            this.gameContainer.x = this.width / 2 - startingPlanet.x * this.zoom;
            this.gameContainer.y = this.height / 2 - startingPlanet.y * this.zoom;
        }
    }

    // Try to enter orbit
    tryEnterOrbit() {
        if (this.spaceship && this.gameState === 'playing' && !this.spaceship.orbiting) {
            if (this.spaceship.tryEnterOrbit()) {
                // Play orbit sound
                this.sounds.orbit.play();
            }
        }
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

    // Clean up inactive hazards
    cleanupInactiveHazards() {
        // Remove inactive sprites from the game container
        this.hazards.forEach(hazard => {
            if (!hazard.active && hazard.sprite.parent) {
                this.gameContainer.removeChild(hazard.sprite);
            }
        });

        // Filter out inactive hazards from the array
        this.hazards = this.hazards.filter(hazard => hazard.active || hazard.type === 'blackhole');
    }
} 