class Game {
    constructor(app, username = 'Player') {
        this.app = app;
        this.stage = app.stage;
        this.width = app.screen.width;
        this.height = app.screen.height;

        this.gameState = 'title'; // title, playing, gameover
        this.score = 0;
        this.highScore = getHighScore();
        this.username = username; // Store the player's username
        this.maxPlanetsVisited = 0; // Track the maximum number of planets visited
        this.inputCooldown = false; // Track if input is currently in cooldown

        // Detect if on mobile device
        this.isMobile = this.detectMobile();

        // Camera and zoom settings - adjust based on device and orientation
        if (this.isMobile) {
            // Check if we're in landscape (width > height)
            const isLandscape = window.innerWidth > window.innerHeight;
            const screenRatio = isLandscape
                ? window.innerWidth / window.innerHeight
                : window.innerHeight / window.innerWidth;

            // Adjust zoom based on device aspect ratio
            if (isLandscape) {
                // For landscape orientation
                if (screenRatio > 2) { // Very wide screen (like iPhone X)
                    this.zoom = 0.35;
                } else if (screenRatio > 1.7) { // Standard wide screen
                    this.zoom = 0.4;
                } else { // More square-ish screen
                    this.zoom = 0.45;
                }
            } else {
                // For portrait orientation (though we show a rotate message)
                this.zoom = 0.3;
            }
        } else {
            // Desktop zoom
            this.zoom = 0.6;
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
        this.usernameText = null; // Add username display
        this.boundaryWarningText = null; // Add boundary warning text

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

        // Create zoom display with correct initial value
        const zoomPercentage = Math.round(this.zoom * 100);
        this.zoomText = new PIXI.Text(`ZOOM: ${zoomPercentage}%`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        this.zoomText.x = 20;
        this.zoomText.y = 80;
        this.uiContainer.addChild(this.zoomText);

        // Create planet counter with more space
        this.planetCountText = new PIXI.Text('Visited 🪂: 1/8', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        this.planetCountText.x = 20;
        this.planetCountText.y = 110;
        this.uiContainer.addChild(this.planetCountText);

        // Create username display
        this.usernameText = new PIXI.Text(`PILOT: ${this.username}`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFDD33
        });
        this.usernameText.x = 20;
        this.usernameText.y = 140;
        this.uiContainer.addChild(this.usernameText);

        // Create boundary warning text
        this.boundaryWarningText = new PIXI.Text('WARNING: Approaching solar system boundary!', {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0xFF9900,
            align: 'center'
        });
        this.boundaryWarningText.anchor.set(0.5);
        this.boundaryWarningText.x = this.width / 2;
        this.boundaryWarningText.y = 130;
        this.boundaryWarningText.visible = false; // Initially hidden
        this.uiContainer.addChild(this.boundaryWarningText);

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

    showTitleScreen() {
        this.gameState = 'title';

        // Check orientation
        const isPortrait = window.innerHeight > window.innerWidth;
        const screenRatio = window.innerWidth / window.innerHeight;

        // Create a background for the instructions
        const instructionsBg = new PIXI.Graphics();
        instructionsBg.beginFill(0x000000, 0.1);

        // Adjust container size based on device and screen ratio
        if (this.isMobile) {
            // Mobile layouts
            if (isPortrait) {
                // Portrait mode (though we show a rotate message)
                instructionsBg.drawRoundedRect(-this.width * 0.45, -this.height * 0.45, this.width * 0.9, this.height * 0.9, 20);
            } else if (screenRatio > 2) {
                // Very wide screen (like iPhone X in landscape)
                instructionsBg.drawRoundedRect(-this.width * 0.35, -this.height * 0.45, this.width * 0.7, this.height * 0.9, 20);
            } else {
                // Standard mobile landscape
                instructionsBg.drawRoundedRect(-this.width * 0.4, -this.height * 0.4, this.width * 0.8, this.height * 0.8, 20);
            }
        } else {
            // Desktop layout
            instructionsBg.drawRoundedRect(-this.width * 0.4, -this.height * 0.4, this.width * 0.8, this.height * 0.8, 20);
        }

        instructionsBg.endFill();

        // Add leaderboard display to title screen
        const leaderboardTitle = new PIXI.Text('LEADERBOARD', {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0xFFDD33,
            align: 'center'
        });
        leaderboardTitle.anchor.set(0.5, 0);
        leaderboardTitle.x = 0;
        leaderboardTitle.y = 50;

        // Create leaderboard container
        const leaderboardContainer = new PIXI.Container();
        leaderboardContainer.x = 0;
        leaderboardContainer.y = 80;

        // Create loading indicator for leaderboard
        const loadingText = new PIXI.Text('Loading leaderboard...', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xCCCCCC,
            align: 'center'
        });
        loadingText.anchor.set(0.5, 0);
        loadingText.x = 0;
        loadingText.y = 0;
        leaderboardContainer.addChild(loadingText);

        // Add title screen elements to the message container
        const titleContainer = new PIXI.Container();
        titleContainer.addChild(instructionsBg);

        // Game title
        const titleText = new PIXI.Text('ESCAPE ORBIT', {
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 3
        });
        titleText.anchor.set(0.5, 0);
        titleText.x = 0;

        // Adjust title position based on screen
        if (this.isMobile) {
            if (screenRatio > 2) {
                // Very wide screen - position higher
                titleText.y = -this.height * 0.3;
            } else {
                // Standard mobile - position slightly higher
                titleText.y = -this.height * 0.32;
            }
        } else {
            // Desktop position
            titleText.y = -this.height * 0.35;
        }

        titleContainer.addChild(titleText);

        // Add player username
        const welcomeText = new PIXI.Text(`Welcome, ${this.username}!`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFDD33,
            align: 'center'
        });
        welcomeText.anchor.set(0.5, 0);
        welcomeText.x = 0;

        // Adjust welcome text position based on screen
        if (this.isMobile) {
            if (screenRatio > 2) {
                // Very wide screen - position closer to title
                welcomeText.y = -this.height * 0.22;
            } else {
                // Standard mobile - adjust accordingly
                welcomeText.y = -this.height * 0.23;
            }
        } else {
            // Desktop position
            welcomeText.y = -this.height * 0.25;
        }

        titleContainer.addChild(welcomeText);

        // Add instructions text
        const instructionsText = new PIXI.Text('INSTRUCTIONS:', {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        instructionsText.anchor.set(0.5, 0);
        instructionsText.x = 0;
        instructionsText.y = -120;
        titleContainer.addChild(instructionsText);

        // Add control instructions based on device
        let controlsText;
        if (this.isMobile) {
            controlsText = new PIXI.Text(
                '• TAP to enter/exit orbit around planets\n• HOLD to boost your spaceship\n• Visit all planets to win!',
                {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0xCCCCFF,
                    align: 'center'
                }
            );
        } else {
            controlsText = new PIXI.Text(
                '• CLICK or SPACE to enter/exit orbit\n• HOLD CLICK or SPACE to boost\n• +/- keys to zoom in/out, 0 to reset\n• Visit all planets to win!',
                {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0xCCCCFF,
                    align: 'center'
                }
            );
        }
        controlsText.anchor.set(0.5, 0);
        controlsText.x = 0;
        controlsText.y = -80;
        titleContainer.addChild(controlsText);

        // Add scoring information
        const scoringText = new PIXI.Text(
            'SCORING:\n• 20 pts - Enter orbit\n• 50 pts - Fly through planet\n• 50 BONUS - Enter orbit after flythrough\n• 1000 pts - COSMIC ACHIEVEMENT (visit all planets)',
            {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFFFFFF,
                align: 'center'
            }
        );
        scoringText.anchor.set(0.5, 0);
        scoringText.x = 0;
        scoringText.y = -10;
        titleContainer.addChild(scoringText);

        // Add leaderboard elements - enhanced for mobile
        if (this.isMobile) {
            // Check orientation
            const isPortrait = window.innerHeight > window.innerWidth;

            // Position leaderboard below scoring info with more spacing on mobile
            const mobileLeaderboardTitle = new PIXI.Text('TOP PILOTS', {
                fontFamily: 'Arial',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0xFFDD33,
                align: 'center'
            });
            mobileLeaderboardTitle.anchor.set(0.5, 0);
            mobileLeaderboardTitle.x = 0;

            // Adjust position based on orientation
            if (isPortrait) {
                // In portrait mode, make sure it's clearly visible and not off-screen
                mobileLeaderboardTitle.y = 60;

                // Add attention indicator in portrait mode
                const attentionText = new PIXI.Text('⭐ LEADERBOARD ⭐', {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xFFFFFF,
                    align: 'center'
                });
                attentionText.anchor.set(0.5, 0);
                attentionText.x = 0;
                attentionText.y = mobileLeaderboardTitle.y - 25;
                titleContainer.addChild(attentionText);
            } else {
                // In landscape, position it below scoring info
                mobileLeaderboardTitle.y = scoringText.y + 100;
            }

            titleContainer.addChild(mobileLeaderboardTitle);

            // Create leaderboard container specifically designed for mobile
            const mobileLeaderboardContainer = new PIXI.Container();
            mobileLeaderboardContainer.y = mobileLeaderboardTitle.y + 30;
            mobileLeaderboardContainer.x = 0;
            titleContainer.addChild(mobileLeaderboardContainer);

            // Add background for better readability on mobile
            const leaderboardBg = new PIXI.Graphics();
            leaderboardBg.beginFill(0x000033, 0.7); // More opaque background
            leaderboardBg.lineStyle(2, 0x3355FF);
            if (isPortrait) {
                // Taller and wider in portrait mode
                leaderboardBg.drawRoundedRect(-170, 0, 340, 190, 10);
            } else {
                // Original size in landscape mode
                leaderboardBg.drawRoundedRect(-150, 0, 300, 150, 10);
            }
            leaderboardBg.endFill();
            mobileLeaderboardContainer.addChild(leaderboardBg);

            // Create loading text
            const mobileLoadingText = new PIXI.Text('Loading leaderboard...', {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xCCCCCC,
                align: 'center'
            });
            mobileLoadingText.anchor.set(0.5, 0);
            mobileLoadingText.x = 0;
            mobileLoadingText.y = 60;
            mobileLeaderboardContainer.addChild(mobileLoadingText);

            // Fetch and populate the mobile leaderboard
            getLeaderboard().then(leaderboard => {
                // Remove loading text
                mobileLeaderboardContainer.removeChild(mobileLoadingText);

                const topEntries = leaderboard.slice(0, 5);
                // Check orientation
                const isPortrait = window.innerHeight > window.innerWidth;
                const fontSize = isPortrait ? 18 : 16; // Larger font in portrait mode
                const lineSpacing = isPortrait ? 30 : 25; // More space between lines in portrait

                if (topEntries.length === 0) {
                    const noScoresText = new PIXI.Text('No scores yet. You could be the first!', {
                        fontFamily: 'Arial',
                        fontSize: fontSize,
                        fill: 0xCCCCCC,
                        align: 'center'
                    });
                    noScoresText.anchor.set(0.5, 0);
                    noScoresText.x = 0;
                    noScoresText.y = 60;
                    mobileLeaderboardContainer.addChild(noScoresText);
                } else {
                    // Display top entries in a more compact, mobile-friendly format
                    topEntries.forEach((entry, index) => {
                        const scoreRow = new PIXI.Text(
                            `${index + 1}. ${entry.username} - ${entry.score} pts`,
                            {
                                fontFamily: 'Arial',
                                fontSize: fontSize,
                                fill: index === 0 ? 0xFFDD33 : 0xCCCCFF,
                                align: 'center'
                            }
                        );
                        scoreRow.anchor.set(0.5, 0);
                        scoreRow.x = 0;
                        scoreRow.y = 20 + index * lineSpacing;
                        mobileLeaderboardContainer.addChild(scoreRow);
                    });
                }
            }).catch(error => {
                console.error('Error loading leaderboard:', error);
                mobileLoadingText.text = 'Error loading leaderboard';
            });
        }

        // Add standard leaderboard for desktop (only on non-mobile)
        if (!this.isMobile) {
            titleContainer.addChild(leaderboardTitle);
            titleContainer.addChild(leaderboardContainer);
        }

        // Position the title container
        titleContainer.x = this.width / 2;
        titleContainer.y = this.height / 2;

        // Add the title container to the UI container
        this.uiContainer.addChild(titleContainer);

        // Store reference to the title container for later removal
        this.titleContainer = titleContainer;

        // Fetch and populate the leaderboard
        getLeaderboard().then(leaderboard => {
            // Remove loading text
            leaderboardContainer.removeChild(loadingText);

            const topEntries = leaderboard.slice(0, 5);

            if (topEntries.length === 0) {
                const noScoresText = new PIXI.Text('No scores yet. You could be the first!', {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xCCCCCC,
                    align: 'center'
                });
                noScoresText.anchor.set(0.5, 0);
                noScoresText.x = 0;
                noScoresText.y = 0;
                leaderboardContainer.addChild(noScoresText);
            } else {
                // Display top entries
                topEntries.forEach((entry, index) => {
                    const scoreRow = new PIXI.Text(
                        `${index + 1}. ${entry.username} - ${entry.score} pts (${entry.planetsVisited} planets)`,
                        {
                            fontFamily: 'Arial',
                            fontSize: 16,
                            fill: index === 0 ? 0xFFDD33 : 0xCCCCFF,
                            align: 'left'
                        }
                    );
                    scoreRow.anchor.set(0.5, 0);
                    scoreRow.x = 0;
                    scoreRow.y = index * 25;
                    leaderboardContainer.addChild(scoreRow);
                });
            }
        }).catch(error => {
            console.error('Error loading leaderboard:', error);
            loadingText.text = 'Error loading leaderboard';
        });

        // Add start button
        const startButton = new PIXI.Graphics();
        startButton.beginFill(0x3355FF, 0.7);
        startButton.lineStyle(2, 0x6688FF);
        startButton.drawRoundedRect(-100, 0, 200, 50, 10);
        startButton.endFill();

        // Adjust button position based on device
        if (this.isMobile) {
            // Check orientation
            const isPortrait = window.innerHeight > window.innerWidth;

            if (isPortrait) {
                // In portrait mode, position button below the leaderboard
                startButton.y = this.height * 0.48; // Move further down in portrait
            } else {
                // In landscape, use original position
                startButton.y = this.height * 0.38;
            }
        } else {
            // Keep original position on desktop
            startButton.y = this.height * 0.25;
        }

        startButton.interactive = true;
        startButton.buttonMode = true;
        startButton.eventMode = 'static';
        startButton.cursor = 'pointer';

        const startText = new PIXI.Text('START GAME', {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        startText.anchor.set(0.5, 0.5);
        startText.x = 0;
        startText.y = startButton.y + 25;

        titleContainer.addChild(startButton);
        titleContainer.addChild(startText);

        // Set up click/tap handlers
        startButton.on('pointerdown', () => {
            this.startGame();
        });

        // Also allow clicking anywhere to start
        this.stage.eventMode = 'static';
        this.stage.on('pointerdown', () => {
            if (this.gameState === 'title') {
                this.startGame();
            }
        });
    }

    startGame() {
        console.log('Starting game');
        // If title container exists, remove it
        if (this.titleContainer) {
            this.uiContainer.removeChild(this.titleContainer);
            this.titleContainer = null;
        }

        // Ensure the game over leaderboard is properly removed
        if (this.gameOverLeaderboard) {
            if (this.gameOverLeaderboard.parent) {
                this.gameOverLeaderboard.parent.removeChild(this.gameOverLeaderboard);
            }
            this.gameOverLeaderboard = null;
        }

        // Remove any other leaderboard elements that might exist
        this.uiContainer.children.forEach(child => {
            if (child &&
                (child.name === 'leaderboard' ||
                    (child instanceof PIXI.Container && child.children.some(c => c.text && c.text.includes('TOP PILOTS'))))) {
                this.uiContainer.removeChild(child);
            }
        });

        // Clear message text from previous game
        this.messageText.text = '';

        // Cancel any queued messages from previous game
        this.messageQueue = [];

        // Clear out any previous game objects
        this.clearGameObjects();

        // Reset zoom to default value based on device type
        if (this.isMobile) {
            const isLandscape = window.innerWidth > window.innerHeight;
            this.zoom = isLandscape ? 0.4 : 0.3;
        } else {
            this.zoom = 0.6;
        }

        // Set up the solar system
        this.createPlanets();
        this.createSpaceship();
        this.createHazards();
        this.createFuelBoosts();

        // Draw boundary circle
        this.drawBoundary();

        // Reset game variables
        this.score = 0;
        this.maxPlanetsVisited = 0;
        this.allPlanetsBonus = false;
        this.burnWarningShown = false;
        this.updateScore();

        // Initialize planet counter
        this.updatePlanetCounter();

        // Make sure zoom is applied and displayed correctly
        this.applyZoom();

        // Set game state to playing
        this.gameState = 'playing';

        // Add a cooldown period to prevent immediate input actions
        this.inputCooldown = true;
        setTimeout(() => {
            this.inputCooldown = false;
        }, 1000); // 1 second cooldown

        // Show game start message
        this.showMessage('Mission commencing!\nVisit all planets to complete your mission', 3000);
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

            // Mark Earth (starting planet) so it doesn't have a timer
            if (index === CONSTANTS.STARTING_PLANET) {
                planet.markAsStartingPlanet();
            }

            // Add orbit path to game container
            this.gameContainer.addChild(planet.orbitPath);

            // Add planet to array and game container
            this.planets.push(planet);
            this.gameContainer.addChild(planet.sprite);

            // Add orbit indicator to game container (initially invisible)
            planet.updateOrbitIndicator(false);
            this.gameContainer.addChild(planet.orbitIndicator);

            // Add timer indicator to game container
            this.gameContainer.addChild(planet.timerIndicator);

            // Add planet label to game container
            this.gameContainer.addChild(planet.label);
        });

        // Mark the starting planet as visited
        this.planets[CONSTANTS.STARTING_PLANET].visitByOrbit();
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

                // Check if spaceship is outside the solar system boundary
                if (this.boundary && !this.spaceship.orbiting) {
                    // Get the center of the solar system
                    const centerX = this.width / 2;
                    const centerY = this.height / 2;

                    // Calculate distance from center
                    const distanceFromCenter = distance(this.spaceship.x, this.spaceship.y, centerX, centerY);

                    // Use the stored boundary radius
                    const boundaryRadius = this.boundaryRadius || (CONSTANTS.PLANETS[CONSTANTS.PLANETS.length - 1].orbitRadius * 1.1);

                    // Calculate how close to the boundary we are (as a percentage)
                    const distancePercentage = distanceFromCenter / boundaryRadius;

                    // If ship is beyond the boundary, end the game
                    if (distanceFromCenter > boundaryRadius) {
                        this.gameOver('Your ship drifted out of the solar system!');
                        return;
                    }

                    // Show warning when within 10% of the boundary
                    if (distancePercentage > 0.9) {
                        if (this.boundaryWarningText) {
                            this.boundaryWarningText.visible = true;
                            // Pulse the warning text (more intense as we get closer)
                            const pulseIntensity = 0.5 + (distancePercentage - 0.9) * 5; // Ranges from 0.5 to 1.0
                            this.boundaryWarningText.alpha = 0.5 + Math.sin(Date.now() * 0.01) * pulseIntensity;
                        }
                    } else if (this.boundaryWarningText) {
                        this.boundaryWarningText.visible = false;
                    }
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
            try {
                this.spaceship.update(this.planets);
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
            } catch (error) {
                console.error('Error updating spaceship:', error);
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

        // Process any pending animations
        if (this.pendingAnimations && this.pendingAnimations.length > 0) {
            // Filter out animations that have returned false (completed)
            this.pendingAnimations = this.pendingAnimations.filter(animation => animation());
        }

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
        // Count visited planets
        let visitedCount = 1; // Start with Earth already visited
        let totalPlanets = 0;

        this.planets.forEach((planet, index) => {
            totalPlanets++;
            if (index !== CONSTANTS.STARTING_PLANET) {
                if (planet.orbitVisited) {
                    visitedCount++;
                }
            }
        });

        // Update score display (no need to recalculate score each frame)
        this.scoreText.text = `SCORE: ${this.score}`;

        // Award bonus when all planets are visited, but don't end the game
        if (visitedCount === totalPlanets && totalPlanets > 0) {
            // Add a big bonus for visiting all planets
            if (!this.allPlanetsBonus) {
                this.allPlanetsBonus = true;
                this.score += 1000;
                this.updateScore();
                this.showMessage(`COSMIC ACHIEVEMENT: +1000 POINTS\nFor visiting all planets!`, 4000);
                console.log(`Added 1000 points bonus for visiting all planets!`);
                this.updateScore();

                // Create a special celebration effect
                this.createCompletionCelebration();

                // Show the second message with a delay to prevent overlap
                setTimeout(() => {
                    this.showMessage(`All planets visited! Continue exploring!`, 3000);
                }, 4500); // Wait until after the first message is gone (4000ms + 500ms buffer)
            }
        }

        // Update planet counter
        this.planetCountText.text = `Visited 🪂: ${visitedCount}/${totalPlanets}`;
    }

    // Add score for various planet actions (orbit or colonize)
    addScoreForPlanetAction(planet, action) {
        // Skip if the message queue is currently active
        if (this.messageQueue && this.messageQueue.length > 0) {
            return;
        }

        if (!planet.visited && action === 'orbit') {
            // First time visiting this planet via orbit
            planet.setVisited(true);
            this.score += 20;
            this.updateScore();
            this.showMessage(`${planet.name} visited! +20 points`, 1500);

            // Update the planet counter
            this.updatePlanetCounter();
        }
        else if (action === 'colonize') {
            // Direct colonization (flying through planet)
            this.addScoreForDirectPass(planet);
        }
    }

    // Method to award points for flying through a planet without marking it as visited
    addScoreForDirectPass(planet) {
        // Skip if the message queue is currently active
        if (this.messageQueue && this.messageQueue.length > 0) {
            return;
        }

        // First time direct pass through a planet
        if (!planet.visited) {
            planet.setVisited(true);
            this.score += 50;
            this.updateScore();
            this.showMessage(`Direct pass through ${planet.name}! +50 points`, 1500);

            // Mark for potential bonus if player enters orbit soon
            planet.markForDirectPassBonus();

            // Update the planet counter
            this.updatePlanetCounter();
        }
        // Refuel even if already visited
        this.spaceship.refuel(CONSTANTS.PLANET_REFUEL_AMOUNT);
        this.showFuelRefillMessage(planet);
    }

    // Method to show fuel refill message for already visited planets
    showFuelRefillMessage(planet) {
        // Don't show messages for the starting planet
        if (planet === this.planets[CONSTANTS.STARTING_PLANET]) {
            return;
        }

        console.log(`Refueled from ${planet.name} (already visited, no points)`);

        // Show message about fuel refill without points
        this.showMessage(`Refueled from ${planet.name}\n(No points - planet already visited)`, 1500);
    }

    // Method to add bonus score when entering orbit shortly after direct visit
    addBonusScore(planet) {
        if (typeof planet.markBonusAdded === 'function') {
            // Add bonus score (50 additional points)
            this.score += 50;
            planet.markBonusAdded(); // Mark that we've already awarded bonus points
            console.log(`Added 50 bonus points for entering orbit of ${planet.name} after direct visit!`);

            // Show message about bonus
            this.showMessage(`BONUS! +50 points for quick orbit\nafter passing through ${planet.name}!`, 3000);

            // Visual celebration (optional) - add some particles or effects
            this.createBonusEffect(planet);

            // Play special sound effect if available
            if (this.sounds && this.sounds.bonus) {
                this.sounds.bonus.play();
            } else if (this.sounds && this.sounds.colonize) {
                // Fall back to colonize sound if bonus sound isn't available
                this.sounds.colonize.play();
            }

            // Update the score display
            this.updateScore();
        }
    }

    // Create a visual effect for the bonus
    createBonusEffect(planet) {
        // Create a burst of particles around the planet
        const particleCount = 20;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            const angle = Math.random() * Math.PI * 2;
            const distance = planet.radius * 1.5;
            const size = 2 + Math.random() * 3;

            // Position the particle around the planet
            particle.x = planet.x + Math.cos(angle) * distance;
            particle.y = planet.y + Math.sin(angle) * distance;

            // Draw the particle
            particle.beginFill(0xFFDD33);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            // Set random velocity
            particle.vx = (Math.random() - 0.5) * 3;
            particle.vy = (Math.random() - 0.5) * 3;

            // Add to game container
            this.gameContainer.addChild(particle);
            particles.push(particle);
        }

        // Create ticker to animate particles
        let ticker = 0;
        const maxTicks = 60; // 1 second at 60fps

        const animateParticles = () => {
            ticker++;

            // Move and fade particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha = 1 - (ticker / maxTicks);
            });

            // Remove particles when animation is done
            if (ticker >= maxTicks) {
                particles.forEach(p => {
                    if (p.parent) p.parent.removeChild(p);
                });
                return false; // Stop the animation
            }

            return true; // Continue animation
        };

        // Add animation to the game's update loop
        this.pendingAnimations = this.pendingAnimations || [];
        this.pendingAnimations.push(animateParticles);
    }

    // Create a special celebration effect when all planets are visited
    createCompletionCelebration() {
        // Create particles that radiate from the center of the screen
        const particleCount = 150; // More particles for a grander effect
        const particles = [];
        const colors = [0xFFFF33, 0x33FFFF, 0xFF33FF, 0x33FF33, 0xFF3333]; // Different colors for variety

        // Create particles in multiple bursts from each planet
        this.planets.forEach(planet => {
            const planetParticles = Math.floor(particleCount / this.planets.length);

            for (let i = 0; i < planetParticles; i++) {
                const particle = new PIXI.Graphics();
                const angle = Math.random() * Math.PI * 2;
                const distance = planet.radius * 0.8; // Start closer to the planet
                const size = 2 + Math.random() * 4; // Slightly larger particles
                const colorIndex = Math.floor(Math.random() * colors.length);

                // Position the particle near the planet
                particle.x = planet.x + Math.cos(angle) * distance;
                particle.y = planet.y + Math.sin(angle) * distance;

                // Draw the particle with a random color
                particle.beginFill(colors[colorIndex]);
                particle.drawCircle(0, 0, size);
                particle.endFill();

                // Set random velocity bursting outward from the planet
                const speed = 1 + Math.random() * 3; // Faster particles
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;

                // Add some rotation for extra effect
                particle.rotation = 0;
                particle.rotationSpeed = (Math.random() - 0.5) * 0.2;

                // Add to game container
                this.gameContainer.addChild(particle);
                particles.push(particle);
            }
        });

        // Create animation ticker
        let ticker = 0;
        const maxTicks = 120; // 2 seconds at 60fps - longer animation

        const animateCelebration = () => {
            ticker++;

            // Move and animate particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                // Create a pulsing effect with the alpha
                p.alpha = 1 - (ticker / maxTicks) + Math.sin(ticker * 0.1) * 0.2;

                // Slow down particles over time
                p.vx *= 0.99;
                p.vy *= 0.99;
            });

            // Remove particles when animation is done
            if (ticker >= maxTicks) {
                particles.forEach(p => {
                    if (p.parent) p.parent.removeChild(p);
                });
                return false; // Stop the animation
            }

            return true; // Continue animation
        };

        // Add animation to the game's update loop
        this.pendingAnimations = this.pendingAnimations || [];
        this.pendingAnimations.push(animateCelebration);
    }

    updateScore() {
        // Update the score display
        this.scoreText.text = `SCORE: ${this.score}`;
    }

    gameOver(message, isVictory = false) {
        this.gameState = 'gameover';

        // Prepare the game over text without leaderboard rank initially
        let gameOverText = message + '\n\n';

        // Add special bonus message for victory
        if (isVictory && this.allPlanetsBonus) {
            gameOverText += `COSMIC BONUS: +1000 POINTS!\n`;
        }

        gameOverText += `SCORE: ${this.score}\n`;

        // Check for high score
        const newHighScore = saveHighScore(this.score);
        this.highScore = getHighScore();
        gameOverText += `HIGH SCORE: ${this.highScore}\n`;
        gameOverText += `PLANETS VISITED: ${this.maxPlanetsVisited}/${CONSTANTS.PLANETS.length}\n\n`;

        if (newHighScore) {
            gameOverText += 'NEW HIGH SCORE!\n\n';
        }

        gameOverText += 'Saving to leaderboard...\n';
        gameOverText += 'Click/Tap or Press ESC to Play Again';

        // Use messageText for game over display
        this.messageText.text = gameOverText;
        this.messageText.alpha = 1; // Ensure message is fully visible

        // Play sound effect
        if (isVictory) {
            // this.sounds.victory.play();
        } else {
            this.sounds.explosion.play();
        }

        // Save the score to the leaderboard with username and planets visited
        saveLeaderboardEntry(this.username, this.score, this.maxPlanetsVisited)
            .then(rank => {
                // Update the game over text with the leaderboard rank
                let updatedText = this.messageText.text.replace('Saving to leaderboard...\n', 'Score saved to leaderboard!\n');

                // Add leaderboard rank message based on rank
                const clickTapIndex = updatedText.indexOf('Click/Tap');
                if (clickTapIndex !== -1) {
                    // If rank is 0, it means the score was saved but not in top 10
                    const rankMessage = rank > 0
                        ? `LEADERBOARD RANK: #${rank}\n\n`
                        : `Score not in top 10 yet\n\n`;

                    updatedText = updatedText.slice(0, clickTapIndex) +
                        rankMessage +
                        updatedText.slice(clickTapIndex);
                }

                this.messageText.text = updatedText;

                // Add leaderboard to game over screen
                this.displayLeaderboardAfterGameOver();
            })
            .catch(error => {
                console.error('Error saving to leaderboard:', error);
                // Update text to show error
                this.messageText.text = this.messageText.text.replace(
                    'Saving to leaderboard...\n',
                    'Error saving to leaderboard\n'
                );

                // Still show leaderboard
                this.displayLeaderboardAfterGameOver();
            });

        // Add click/tap listener to restart the game
        this.setupGameOverClickListener();
    }

    // Set up click/tap to restart game after game over
    setupGameOverClickListener() {
        // Make sure we don't add duplicate listeners
        this.stage.eventMode = 'static';
        this.stage.off('pointerdown');

        // Add leaderboard to game over screen
        this.displayLeaderboardAfterGameOver();

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

    // Display leaderboard after game over
    displayLeaderboardAfterGameOver() {
        // Create leaderboard container
        const leaderboardContainer = new PIXI.Container();
        leaderboardContainer.name = 'leaderboard'; // Add a name for easier identification
        leaderboardContainer.x = this.width / 2;
        leaderboardContainer.y = this.height / 2 + 150;
        this.uiContainer.addChild(leaderboardContainer);

        // Create leaderboard title
        const leaderboardTitle = new PIXI.Text('TOP PILOTS', {
            fontFamily: 'Arial',
            fontSize: 18,
            fontWeight: 'bold',
            fill: 0xFFDD33,
            align: 'center'
        });
        leaderboardTitle.anchor.set(0.5, 0);
        leaderboardTitle.x = 0;
        leaderboardTitle.y = 0;
        leaderboardContainer.addChild(leaderboardTitle);

        // Create loading text
        const loadingText = new PIXI.Text('Loading leaderboard...', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xCCCCCC,
            align: 'center'
        });
        loadingText.anchor.set(0.5, 0);
        loadingText.x = 0;
        loadingText.y = 50;
        leaderboardContainer.addChild(loadingText);

        // Store reference for cleanup
        this.gameOverLeaderboard = leaderboardContainer;

        // Get leaderboard data asynchronously
        getLeaderboard()
            .then(leaderboard => {
                // Remove loading text
                leaderboardContainer.removeChild(loadingText);

                const topEntries = leaderboard.slice(0, 3); // Show top 3 entries

                if (topEntries.length > 0) {
                    // Display entries
                    topEntries.forEach((entry, index) => {
                        const color = entry.username === this.username ? 0xFFFF33 : 0xCCCCFF;

                        const scoreRow = new PIXI.Text(
                            `${index + 1}. ${entry.username} - ${entry.score} pts`,
                            {
                                fontFamily: 'Arial',
                                fontSize: 16,
                                fill: color,
                                align: 'center'
                            }
                        );
                        scoreRow.anchor.set(0.5, 0);
                        scoreRow.x = 0;
                        scoreRow.y = 30 + index * 25;
                        leaderboardContainer.addChild(scoreRow);
                    });
                } else {
                    const noScoresText = new PIXI.Text('No scores yet. You could be the first!', {
                        fontFamily: 'Arial',
                        fontSize: 16,
                        fill: 0xCCCCCC,
                        align: 'center'
                    });
                    noScoresText.anchor.set(0.5, 0);
                    noScoresText.x = 0;
                    noScoresText.y = 50;
                    leaderboardContainer.addChild(noScoresText);
                }
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
                loadingText.text = 'Error loading leaderboard';
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
            // Store reference to the planet we're leaving
            const leavingPlanet = this.spaceship.orbiting;

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
        const boundaryRadius = outerPlanetDistance * 1.5;

        // Create a boundary circle
        if (!this.boundary) {
            this.boundary = new PIXI.Graphics();
            this.gameContainer.addChild(this.boundary);
        }

        this.boundary.clear();

        // Store the boundary radius for use in collision detection
        this.boundaryRadius = boundaryRadius;

        // Default boundary appearance
        let boundaryAlpha = 0; //invisible
        let boundaryColor = 0x444466;
        let lineWidth = 2;

        // If spaceship exists and is close to boundary, highlight it
        if (this.spaceship && !this.spaceship.orbiting) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const distanceFromCenter = distance(this.spaceship.x, this.spaceship.y, centerX, centerY);
            const distancePercentage = distanceFromCenter / boundaryRadius;

            if (distancePercentage > 0.9) {
                // Change boundary appearance based on proximity
                boundaryColor = 0xFF9900; // Warning color (orange)
                boundaryAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5; // Pulsing effect
                lineWidth = 3; // Thicker line
            }
        }

        this.boundary.lineStyle(lineWidth, boundaryColor, boundaryAlpha);
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

        // Remove game over leaderboard if exists
        if (this.gameOverLeaderboard && this.gameOverLeaderboard.parent) {
            this.gameOverLeaderboard.parent.removeChild(this.gameOverLeaderboard);
            this.gameOverLeaderboard = null;
        }

        // Hide sun warning text if it exists
        if (this.sunWarningText) {
            this.sunWarningText.visible = false;
        }

        // Hide boundary warning text if it exists
        if (this.boundaryWarningText) {
            this.boundaryWarningText.visible = false;
        }

        // Stop any sound effects that might be playing
        if (this.sounds && this.sounds.burning) {
            this.sounds.burning.stop();
        }
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

    // Update the planet counter - now also updates maxPlanetsVisited
    updatePlanetCounter() {
        // Count visited planets
        const visitedCount = this.planets.filter(planet => planet.visited).length;

        // Update maximum planets visited if current count is higher
        if (visitedCount > this.maxPlanetsVisited) {
            this.maxPlanetsVisited = visitedCount;
        }

        const totalPlanets = CONSTANTS.PLANETS.length;
        this.planetCountText.text = `Visited 🪂: ${visitedCount}/${totalPlanets}`;

        // Check if all planets have been visited
        if (visitedCount === totalPlanets && !this.allPlanetsBonus) {
            this.allPlanetsBonus = true;
            this.score += 1000;
            this.updateScore();
            this.showMessage("COSMIC ACHIEVEMENT! +1000 POINTS!", 3000);

            // Add a celebration effect
            this.createCompletionCelebration();

            // Show a follow-up message with a delay
            setTimeout(() => {
                this.showMessage("Continue exploring the solar system!", 3000);
            }, 3500);

            // No longer ending the game after visiting all planets
        }
    }
} 