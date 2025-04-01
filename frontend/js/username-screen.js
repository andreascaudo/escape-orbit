// Username screen functionality

class UsernameScreen {
    constructor(app, onComplete) {
        this.app = app;
        this.onComplete = onComplete;
        this.container = new PIXI.Container();
        this.username = ""; // Get existing username if available
        this.planets = []; // Array to hold planet sprites

        this.init();
    }

    init() {
        // Add container to stage
        this.app.stage.addChild(this.container);

        // Create background sprite
        this.backgroundSprite = null; // Initialize
        this.createBackground();

        // Create random planets on the background
        this.createRandomPlanets(); // Load the 6 unique planets

        // Create UI elements
        // Store references to elements for resizing
        this.title = null;
        this.subtitle = null;
        this.inputBg = null;
        this.inputText = null;
        this.cursor = null;
        this.randomButton = null;
        this.randomText = null;
        this.startButton = null;
        this.startText = null;
        this.leaderboardContainer = null;
        this.leaderboardScrollContent = null;
        this.cursorInterval = null;

        this.createUI();

        // Handle keyboard input
        this.setupKeyboardInput();
    }

    createBackground() {
        // Create a sprite for the background image
        const texture = PIXI.Texture.from('../images/image.png'); // CORRECTED PATH
        this.backgroundSprite = new PIXI.Sprite(texture);
        this.backgroundSprite.width = this.app.screen.width;
        this.backgroundSprite.height = this.app.screen.height;
        this.backgroundSprite.anchor.set(0.5); // Anchor to center for easier positioning/scaling
        this.backgroundSprite.x = this.app.screen.width / 2;
        this.backgroundSprite.y = this.app.screen.height / 2;
        this.container.addChildAt(this.backgroundSprite, 0); // Add to bottom
    }

    createRandomPlanets() {
        const planetImagePaths = [
            '../images/planet_0.png',
            '../images/planet_1.png',
            '../images/planet_2.png',
            '../images/planet_3.png',
            '../images/planet_4.png',
            '../images/planet_5.png',
            '../images/spaceship2.png'
        ];
        const minDistance = 100; // Minimum distance between planet centers
        const maxAttempts = 20; // Max attempts to find a suitable position

        // --- Define Central Exclusion Zone --- (Recalculated each time for resize)
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;
        const zoneWidth = Math.min(screenWidth * 0.6, 500); // Max 500px or 60%
        const zoneHeight = Math.min(screenHeight * 0.6, 400); // Max 400px or 60%
        const zoneLeft = (screenWidth - zoneWidth) / 2;
        const zoneRight = zoneLeft + zoneWidth;
        const zoneTop = (screenHeight - zoneHeight) / 2;
        const zoneBottom = zoneTop + zoneHeight;
        // --- End Define Zone ---

        // Clear existing planets if any
        this.planets.forEach(p => {
            if (p.parent) {
                p.parent.removeChild(p);
            }
        });
        this.planets = [];

        // Make sure background exists before adding planets
        if (!this.backgroundSprite || !this.backgroundSprite.parent) {
            this.createBackground();
        }

        // Load and place each unique planet
        planetImagePaths.forEach(path => {
            const texture = PIXI.Texture.from(path);
            const planet = new PIXI.Sprite(texture);

            planet.anchor.set(0.5);
            planet.scale.set(Math.random() * 0.15 + 0.15); // Scale (15% - 30%)
            planet.rotation = Math.random() * Math.PI * 2;
            planet.alpha = Math.random() * 0.3 + 0.6;

            // --- Updated Position Finding Logic ---
            let attempts = 0;
            let positionFound = false;
            while (attempts < maxAttempts && !positionFound) {
                // Generate potential position
                const padding = 50;
                const potentialX = Math.random() * (screenWidth - padding * 2) + padding;
                const potentialY = Math.random() * (screenHeight - padding * 2) + padding;

                // Check 1: Is it inside the exclusion zone?
                const isInExclusionZone = (
                    potentialX > zoneLeft && potentialX < zoneRight &&
                    potentialY > zoneTop && potentialY < zoneBottom
                );

                let collisionWithOtherPlanet = false;
                // Check 2: Is it too close to other planets? (Only if not in exclusion zone)
                if (!isInExclusionZone) {
                    for (const existingPlanet of this.planets) {
                        const dx = potentialX - existingPlanet.x;
                        const dy = potentialY - existingPlanet.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < minDistance) {
                            collisionWithOtherPlanet = true;
                            break;
                        }
                    }
                }

                // If valid (outside zone AND not colliding), place it
                if (!isInExclusionZone && !collisionWithOtherPlanet) {
                    planet.x = potentialX;
                    planet.y = potentialY;
                    positionFound = true;
                }
                attempts++;
            }

            // If no position found after max attempts, place it randomly OUTSIDE the exclusion zone if possible
            if (!positionFound) {
                console.warn(`Could not find ideal position for planet ${path} after ${maxAttempts} attempts. Placing semi-randomly.`);
                // Try placing randomly again, forcing it outside the exclusion zone boundaries
                let finalX, finalY;
                let placeAttempts = 0;
                do {
                    const padding = 10; // Use smaller padding for fallback
                    finalX = Math.random() * (screenWidth - padding * 2) + padding;
                    finalY = Math.random() * (screenHeight - padding * 2) + padding;
                    placeAttempts++;
                } while (
                    (finalX > zoneLeft && finalX < zoneRight && finalY > zoneTop && finalY < zoneBottom) && placeAttempts < 10
                );
                planet.x = finalX;
                planet.y = finalY;
                // It might still collide with others in this fallback scenario
            }
            // --- End Updated Position Finding Logic ---

            // Add planet to the container with a check
            if (this.container.children.length > 0) {
                // Add above background (index 0), but below other UI
                this.container.addChildAt(planet, Math.min(1, this.container.children.length));
            } else {
                // Just add to container if no children yet
                this.container.addChild(planet);
            }

            this.planets.push(planet); // Add to list *after* setting position
        });
    }

    createUI() {
        // Remove previous UI elements (title, input, buttons, leaderboard)
        // These elements are added *after* the background (index 0) and planets (indices 1 to 1+N-1)
        const startIndexToRemove = 1 + this.planets.length;
        while (this.container.children.length > startIndexToRemove) {
            this.container.removeChildAt(startIndexToRemove);
        }

        // Clear potentially lingering UI references (keep planet references)
        this.title = null;
        this.subtitle = null;
        this.inputBg = null;
        this.inputText = null;
        this.cursor = null;
        this.randomButton = null;
        this.randomText = null;
        this.startButton = null;
        this.startText = null;
        this.leaderboardContainer = null;
        this.leaderboardScrollContent = null;
        if (this.cursorInterval) clearInterval(this.cursorInterval); // Clear existing interval early
        this.cursorInterval = null;

        const isMobileLandscape = this.detectMobile() && this.app.screen.width > this.app.screen.height;
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;

        // --- Title ---
        const titleTexture = PIXI.Texture.from('../images/title.png');
        this.title = new PIXI.Sprite(titleTexture);
        this.title.anchor.set(0.5); // Center anchor
        // Optional: Scale the title image if needed
        const titleScale = 0.5;// Scale down if too wide, allow some padding
        this.title.scale.set(titleScale);

        this.title.x = screenWidth / 2;
        // Adjust Y: Lower on desktop (more space), higher on mobile landscape
        const titleYPosition = isMobileLandscape ? screenHeight * 0.15 : 80;
        this.title.y = titleYPosition;
        this.container.addChild(this.title);

        // --- Subtitle (Desktop only) ---
        if (!isMobileLandscape) {
            // Replace Text with Sprite
            const subtitleTexture = PIXI.Texture.from('../images/subtitle.png');
            this.subtitle = new PIXI.Sprite(subtitleTexture);
            this.subtitle.anchor.set(0.5, 0); // Anchor top-center for positioning below title

            // Optional: Scale subtitle based on screen width (similar to title)
            const subtitleScale = 0.3; // Scale down if wide, add padding
            this.subtitle.scale.set(subtitleScale);

            this.subtitle.x = screenWidth / 2;
            // Position below title sprite, considering title's height/scale and subtitle's height/scale
            const spacing = 100; // Pixels between title bottom and subtitle top
            this.subtitle.y = this.title.y * 2 + spacing; //+ (this.title.height * this.title.scale.y / 2) + spacing;
            this.container.addChild(this.subtitle);
        } else {
            this.subtitle = null; // Ensure it's null on mobile landscape
        }

        // --- Input Area ---
        const inputWidth = Math.min(screenWidth * 0.8, 400); // Responsive width
        const inputHeight = 50;
        // Adjust Y: Center vertically between title and buttons on mobile landscape, fixed position on desktop
        const inputY = isMobileLandscape ? screenHeight / 2 - inputHeight / 2 - 30 : this.subtitle.y + 50;

        this.inputBg = new PIXI.Graphics();
        this.inputBg.beginFill(0x000033);
        this.inputBg.lineStyle(2, 0x3355FF);
        this.inputBg.drawRoundedRect(0, 0, inputWidth, inputHeight, 10);
        this.inputBg.endFill();
        this.inputBg.x = screenWidth / 2 - inputWidth / 2;
        this.inputBg.y = inputY;
        this.container.addChild(this.inputBg);

        this.inputText = new PIXI.Text(this.username, {
            fontFamily: 'Futura',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'left'
        });
        // Adjust position slightly for centering
        this.inputText.x = this.inputBg.x + 15;
        this.inputText.y = this.inputBg.y + (inputHeight - this.inputText.height) / 2;
        this.container.addChild(this.inputText);

        this.cursor = new PIXI.Graphics();
        this.cursor.beginFill(0xFFFFFF);
        const cursorHeight = 30;
        this.cursor.drawRect(0, 0, 2, cursorHeight);
        this.cursor.endFill();
        this.cursor.y = this.inputBg.y + (inputHeight - cursorHeight) / 2; // Vertically center cursor
        this.container.addChild(this.cursor);
        this.updateCursorPosition(); // Initial position

        // Clear previous interval if exists
        if (this.cursorInterval) clearInterval(this.cursorInterval);
        // Animate cursor blink
        this.cursorVisible = true;
        this.cursorInterval = setInterval(() => {
            this.cursorVisible = !this.cursorVisible;
            if (this.cursor) this.cursor.visible = this.cursorVisible;
        }, 500);

        // --- Buttons ---
        const buttonWidth = Math.min(inputWidth / 2 - 10, 200); // Make buttons fit input width
        const buttonHeight = 40;
        const buttonY = inputY + inputHeight + 20; // Position below input box
        const buttonSpacing = 10;

        // Random Button
        this.randomButton = new PIXI.Graphics();
        this.randomButton.beginFill(0x225588);
        this.randomButton.lineStyle(2, 0x3355FF);
        this.randomButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
        this.randomButton.endFill();
        this.randomButton.x = screenWidth / 2 - buttonWidth - buttonSpacing / 2; // Place left
        this.randomButton.y = buttonY;
        this.container.addChild(this.randomButton);

        this.randomText = new PIXI.Text('Random Name', { // Shorter text for smaller buttons
            fontFamily: 'Futura',
            fontSize: buttonWidth < 150 ? 16 : 20, // Adjust font size
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.randomText.anchor.set(0.5, 0.5);
        this.randomText.x = this.randomButton.x + buttonWidth / 2;
        this.randomText.y = this.randomButton.y + buttonHeight / 2;
        this.container.addChild(this.randomText);

        this.randomButton.eventMode = 'static';
        this.randomButton.cursor = 'pointer';
        this.randomButton.on('pointerdown', () => {
            this.username = generateRandomUsername();
            this.inputText.text = this.username;
            this.updateCursorPosition();
        });

        // Start Button
        this.startButton = new PIXI.Graphics();
        this.startButton.beginFill(0x225588);
        this.startButton.lineStyle(2, 0x3355FF);
        this.startButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
        this.startButton.endFill();
        this.startButton.x = screenWidth / 2 + buttonSpacing / 2; // Place right
        this.startButton.y = buttonY;
        this.container.addChild(this.startButton);

        this.startText = new PIXI.Text('Start Game', { // Shorter text
            fontFamily: 'Futura',
            fontSize: buttonWidth < 150 ? 16 : 20, // Adjust font size
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.startText.anchor.set(0.5, 0.5);
        this.startText.x = this.startButton.x + buttonWidth / 2;
        this.startText.y = this.startButton.y + buttonHeight / 2;
        this.container.addChild(this.startText);

        this.startButton.eventMode = 'static';
        this.startButton.cursor = 'pointer';
        this.startButton.on('pointerdown', () => this.completeUsernameEntry());

        // --- Leaderboard (Desktop only) ---
        if (!isMobileLandscape) {
            this.createLeaderboardDisplay(); // This function should store container in this.leaderboardContainer
        } else {
            this.leaderboardContainer = null; // Ensure null on mobile landscape
            this.leaderboardScrollContent = null; // Ensure null
        }
    }

    handleResize(newWidth, newHeight) {
        // Resize the background sprite
        if (this.backgroundSprite) {
            this.backgroundSprite.width = newWidth;
            this.backgroundSprite.height = newHeight;
            this.backgroundSprite.x = newWidth / 2;
            this.backgroundSprite.y = newHeight / 2;
        }
        // Note: Star positions aren't updated here, might need adjustment if crucial

        // --- Recreate planets with collision detection for new size ---
        this.createRandomPlanets();
        // --- End Recreate Planets ---

        // --- Re-calculate layout based on new dimensions ---
        const isMobileLandscape = this.detectMobile() && newWidth > newHeight;

        // --- Title ---
        if (this.title) {
            this.title.x = newWidth / 2;
            this.title.y = isMobileLandscape ? newHeight * 0.20 : 80;
            // Optional: Recalculate scale on resize if desired
            const titleScale = Math.min(1, newWidth / (this.title.texture.width * 1.2)); // Use texture width for original size
            this.title.scale.set(titleScale);
        }

        // --- Subtitle ---
        if (isMobileLandscape) {
            // Remove subtitle sprite if it exists (transition to mobile landscape)
            if (this.subtitle) {
                // Ensure it has a parent before removing (safer)
                if (this.subtitle.parent) {
                    this.container.removeChild(this.subtitle);
                }
                // Optional: Destroy sprite if needed: this.subtitle.destroy();
                this.subtitle = null;
            }
        }

        // --- Input Area ---
        const inputWidth = Math.min(newWidth * 0.8, 400);
        const inputHeight = 50;
        const inputY = isMobileLandscape ? newHeight / 2 - inputHeight / 2 - 30 : newHeight / 2 - 170;

        if (this.inputBg) {
            this.inputBg.clear(); // Required before redrawing
            this.inputBg.beginFill(0x000033);
            this.inputBg.lineStyle(2, 0x3355FF);
            this.inputBg.drawRoundedRect(0, 0, inputWidth, inputHeight, 10);
            this.inputBg.endFill();
            this.inputBg.x = newWidth / 2 - inputWidth / 2;
            this.inputBg.y = inputY;
        }
        if (this.inputText) {
            this.inputText.x = this.inputBg.x + 15;
            this.inputText.y = this.inputBg.y + (inputHeight - this.inputText.height) / 2;
        }
        if (this.cursor) {
            const cursorHeight = 30;
            this.cursor.y = this.inputBg.y + (inputHeight - cursorHeight) / 2;
            this.updateCursorPosition(); // Recalculate X based on text
        }

        // --- Buttons ---
        const buttonWidth = Math.min(inputWidth / 2 - 10, 200);
        const buttonHeight = 40;
        const buttonY = inputY + inputHeight + 20;
        const buttonSpacing = 10;
        const buttonFontSize = buttonWidth < 150 ? 16 : 20;

        if (this.randomButton) {
            this.randomButton.clear(); // Redraw for new size/position
            this.randomButton.beginFill(0x225588);
            this.randomButton.lineStyle(2, 0x3355FF);
            this.randomButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
            this.randomButton.endFill();
            this.randomButton.x = newWidth / 2 - buttonWidth - buttonSpacing / 2;
            this.randomButton.y = buttonY;
        }
        if (this.randomText) {
            this.randomText.style.fontSize = buttonFontSize; // Update font size
            this.randomText.x = this.randomButton.x + buttonWidth / 2;
            this.randomText.y = this.randomButton.y + buttonHeight / 2;
        }
        if (this.startButton) {
            this.startButton.clear(); // Redraw for new size/position
            this.startButton.beginFill(0x225588);
            this.startButton.lineStyle(2, 0x3355FF);
            this.startButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
            this.startButton.endFill();
            this.startButton.x = newWidth / 2 + buttonSpacing / 2;
            this.startButton.y = buttonY;
        }
        if (this.startText) {
            this.startText.style.fontSize = buttonFontSize; // Update font size
            this.startText.x = this.startButton.x + buttonWidth / 2;
            this.startText.y = this.startButton.y + buttonHeight / 2;
        }

        // --- Leaderboard ---
        // Remove leaderboard if we are now mobile landscape
        if (isMobileLandscape && this.leaderboardContainer) {
            if (this.leaderboardScrollContent && this.leaderboardScrollContent.mask) {
                this.leaderboardContainer.removeChild(this.leaderboardScrollContent.mask); // Remove mask first
            }
            this.container.removeChild(this.leaderboardContainer);
            this.leaderboardContainer = null;
            this.leaderboardScrollContent = null;
            // Detach scroll listener if needed - find where it's attached
            // Assuming it's attached to leaderboardBg within createLeaderboardDisplay, need cleanup there or store reference to bg
        }
        // Recreate leaderboard if we are now desktop AND it doesn't exist
        else if (!isMobileLandscape && !this.leaderboardContainer) {
            this.createLeaderboardDisplay(); // Recreate it for desktop view
        }
        // Reposition leaderboard if it exists and we are on desktop
        else if (!isMobileLandscape && this.leaderboardContainer) {
            const LEADERBOARD_WIDTH = 400; // Consider making this a class constant
            this.leaderboardContainer.x = newWidth / 2 - LEADERBOARD_WIDTH / 2;
            this.leaderboardContainer.y = newHeight / 2 + 100; // Adjust Y pos if needed

            // Re-applying/updating mask might be necessary if its position/size depends on screenHeight
            if (this.leaderboardScrollContent && this.leaderboardScrollContent.mask) {
                const mask = this.leaderboardScrollContent.mask;
                const ROW_HEIGHT = 30; // Class constant?
                const VISIBLE_ROWS = 5; // Class constant?
                const SCROLL_AREA_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT;
                const HEADER_HEIGHT = 30; // Class constant?
                const CONTENT_START_Y = 40 + HEADER_HEIGHT; // Relative to leaderboardContainer
                mask.clear().beginFill(0xff0000, 0.5).drawRect(0, CONTENT_START_Y, LEADERBOARD_WIDTH, SCROLL_AREA_HEIGHT).endFill();
                // Ensure mask is still child of leaderboardContainer - it should be
            }
            // Re-calculate scroll bounds if content height changes (unlikely on resize alone)
            // this.calculateScrollBounds();
        }
    }

    createLeaderboardDisplay() {
        // Check if on mobile device (including landscape), and skip creating leaderboard if so
        // Mobile leaderboard is shown in portrait HTML view
        if (this.detectMobile()) {
            // console.log("Skipping PIXI leaderboard creation on mobile device.");
            this.leaderboardContainer = null;
            this.leaderboardScrollContent = null;
            return;
        }

        // --- Constants for scrolling ---
        const ROW_HEIGHT = 30;
        const VISIBLE_ROWS = 5;
        const SCROLL_AREA_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT;
        const LEADERBOARD_WIDTH = 400;
        const HEADER_HEIGHT = 30; // Approx height for the header row
        const CONTENT_START_Y = 40 + HEADER_HEIGHT; // Y position where scrollable content starts (below title + header)
        // --- End Constants ---

        // Create main leaderboard container
        this.leaderboardContainer = new PIXI.Container(); // Assign to instance variable
        // Positioning adjusted slightly to accommodate potential scrollbar later if needed
        this.leaderboardContainer.x = this.app.screen.width / 2 - LEADERBOARD_WIDTH / 2;
        this.leaderboardContainer.y = this.inputBg.y * 1.5; // Moved up slightly
        this.container.addChild(this.leaderboardContainer);

        // Create leaderboard background (acts as scroll trigger area)
        // Adjusted height to include title and scroll area
        const totalBgHeight = CONTENT_START_Y + SCROLL_AREA_HEIGHT + 10; // Added padding
        const leaderboardBg = new PIXI.Graphics();
        leaderboardBg.beginFill(0x000033, 0.5);
        leaderboardBg.lineStyle(2, 0x3355FF);
        leaderboardBg.drawRoundedRect(0, 0, LEADERBOARD_WIDTH, totalBgHeight, 10); // y=0 relative to leaderboardContainer
        leaderboardBg.endFill();
        leaderboardBg.eventMode = 'static'; // Make it interactive for scroll events
        leaderboardBg.cursor = 'default'; // Keep default cursor
        this.leaderboardContainer.addChild(leaderboardBg);

        // Create leaderboard title
        const leaderboardTitle = new PIXI.Text('TOP PILOTS', {
            fontFamily: 'Futura',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFFDD33,
            align: 'center'
        });
        leaderboardTitle.anchor.set(0.5, -0.25);
        leaderboardTitle.x = LEADERBOARD_WIDTH / 2;
        leaderboardTitle.y = 0;
        this.leaderboardContainer.addChild(leaderboardTitle);

        // --- Header Row ---
        const headerRow = new PIXI.Container();
        headerRow.y = 40; // Below title
        this.leaderboardContainer.addChild(headerRow);

        const rankHeader = new PIXI.Text('Rank', { fontFamily: 'Futura', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        rankHeader.x = 20;
        headerRow.addChild(rankHeader);

        const nameHeader = new PIXI.Text('Pilot', { fontFamily: 'Futura', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        nameHeader.x = 70;
        headerRow.addChild(nameHeader);

        const scoreHeader = new PIXI.Text('Score', { fontFamily: 'Futura', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        scoreHeader.x = 250;
        headerRow.addChild(scoreHeader);

        const planetsHeader = new PIXI.Text('Planets', { fontFamily: 'Futura', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        planetsHeader.x = 330;
        headerRow.addChild(planetsHeader);
        // --- End Header Row ---


        // --- Scrollable Content Area ---
        // Container for all entries (will be masked and moved)
        this.scrollContentContainer = new PIXI.Container(); // Assign to instance var THIS LINE CHANGED
        this.scrollContentContainer.y = CONTENT_START_Y; // Position below header
        this.leaderboardContainer.addChild(this.scrollContentContainer); // Add to correct container
        this.leaderboardScrollContent = this.scrollContentContainer; // Store reference for scrolling (keep compatibility)

        // Create the mask graphic
        const scrollMask = new PIXI.Graphics();
        scrollMask.beginFill(0xff0000, 0.5); // Color/alpha doesn't matter for mask
        scrollMask.drawRect(0, CONTENT_START_Y, LEADERBOARD_WIDTH, SCROLL_AREA_HEIGHT); // Position and size of visible area
        scrollMask.endFill();
        this.leaderboardContainer.addChild(scrollMask); // Add mask to the main container

        // Apply the mask
        this.scrollContentContainer.mask = scrollMask;
        // --- End Scrollable Content Area Setup ---


        // Create loading indicator (positioned within the eventual scroll area)
        const loadingText = new PIXI.Text('Loading leaderboard...', {
            fontFamily: 'Futura',
            fontSize: 18,
            fill: 0xCCCCCC,
            align: 'center'
        });
        loadingText.anchor.set(0.5);
        loadingText.x = LEADERBOARD_WIDTH / 2;
        loadingText.y = SCROLL_AREA_HEIGHT / 2; // Center vertically in visible area
        this.scrollContentContainer.addChild(loadingText); // Add to scroll container initially


        // Get leaderboard data asynchronously
        getLeaderboard().then(leaderboard => {
            // Remove loading text
            if (loadingText.parent) {
                this.scrollContentContainer.removeChild(loadingText);
            }

            const allEntries = leaderboard; // Use all entries
            // Calculate min/max container position Y
            const totalContentHeight = allEntries.length * ROW_HEIGHT;
            const minY = CONTENT_START_Y + SCROLL_AREA_HEIGHT - totalContentHeight;
            const maxY = CONTENT_START_Y;
            this.minScrollContainerY = Math.min(maxY, minY); // If content shorter than view, min is just the start Y
            this.maxScrollContainerY = maxY;
            // console.log(`Leaderboard scroll bounds: minY=${this.minScrollContainerY.toFixed(2)}, maxY=${this.maxScrollContainerY.toFixed(2)}, totalContentHeight=${totalContentHeight.toFixed(2)}`);

            if (allEntries.length === 0) {
                const noScoresText = new PIXI.Text('No scores yet!', {
                    fontFamily: 'Futura',
                    fontSize: 18,
                    fill: 0xCCCCCC,
                    align: 'center'
                });
                noScoresText.anchor.set(0.5);
                noScoresText.x = LEADERBOARD_WIDTH / 2;
                noScoresText.y = SCROLL_AREA_HEIGHT / 2;
                this.scrollContentContainer.addChild(noScoresText); // Add to scroll container
            } else {
                // Create and add all entries to the scroll container
                allEntries.forEach((entry, index) => {
                    const row = new PIXI.Container();
                    // Position rows relative to the scrollContentContainer
                    row.y = index * ROW_HEIGHT;
                    this.scrollContentContainer.addChild(row);

                    const rankText = new PIXI.Text(`${index + 1}`, { fontFamily: 'Futura', fontSize: 16, fill: 0xFFFFFF });
                    rankText.x = 20;
                    row.addChild(rankText);

                    const nameText = new PIXI.Text(entry.username, { fontFamily: 'Futura', fontSize: 16, fill: 0xFFFFFF });
                    nameText.x = 70;
                    // Truncate name if too long
                    if (nameText.width > 170) { // Adjust width check if needed
                        nameText.text = nameText.text.substring(0, 15) + '...'; // Allow slightly more chars
                    }
                    row.addChild(nameText);

                    const scoreText = new PIXI.Text(entry.score.toString(), { fontFamily: 'Futura', fontSize: 16, fill: 0xFFFFFF });
                    scoreText.x = 250;
                    row.addChild(scoreText);

                    const planetsText = new PIXI.Text(entry.planetsVisited.toString(), { fontFamily: 'Futura', fontSize: 16, fill: 0xFFFFFF });
                    planetsText.x = 330;
                    row.addChild(planetsText);
                });
            }
        }).catch(error => {
            console.error('Error loading leaderboard:', error);
            if (loadingText.parent) {
                loadingText.text = 'Error loading leaderboard';
                loadingText.style.fill = 0xFF8888; // Make error red
            } else {
                // If loading text was already removed, add a new error text
                const errorText = new PIXI.Text('Error loading', {
                    fontFamily: 'Futura',
                    fontSize: 18,
                    fill: 0xFF8888,
                    align: 'center'
                });
                errorText.anchor.set(0.5);
                errorText.x = LEADERBOARD_WIDTH / 2;
                errorText.y = SCROLL_AREA_HEIGHT / 2;
                this.scrollContentContainer.addChild(errorText);
            }
        });

        // Add scroll listener to the background graphic
        leaderboardBg.addEventListener('wheel', this.handleLeaderboardScroll.bind(this));
    }

    // --- Add scroll handler method ---
    handleLeaderboardScroll(event) {
        // Check if ready for scrolling
        if (!this.leaderboardScrollContent || typeof this.minScrollContainerY !== 'number' || typeof this.maxScrollContainerY !== 'number') {
            // console.log('Leaderboard not ready for scrolling or bounds not set.');
            return;
        }

        // Determine scroll amount
        const scrollAmount = event.deltaY;
        const currentY = this.leaderboardScrollContent.position.y;

        // Calculate the potential new Y position
        let newY = currentY - scrollAmount;

        // Log values before clamping
        // console.log(`Scroll: deltaY=${scrollAmount.toFixed(2)}, currentY=${currentY.toFixed(2)}, potential newY=${newY.toFixed(2)}, minContainerY=${this.minScrollContainerY.toFixed(2)}, maxContainerY=${this.maxScrollContainerY.toFixed(2)}`);

        // Clamp the position within calculated bounds
        const clampedY = Math.max(this.minScrollContainerY, Math.min(this.maxScrollContainerY, newY));

        // Log clamped value
        // console.log(`Clamped Y: ${clampedY.toFixed(2)}`);

        // Apply the new position only if it changed
        if (clampedY !== currentY) {
            this.leaderboardScrollContent.position.y = clampedY;
        }
    }
    // --- End scroll handler ---

    setupKeyboardInput() {
        // Add key event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        // Ignore if input is already handled or container doesn't exist
        if (!this.container || !this.container.visible) return;

        if (event.key === 'Enter') {
            // Complete username entry on Enter
            this.completeUsernameEntry();
        } else if (event.key === 'Backspace') {
            // Remove last character on Backspace
            this.username = this.username.slice(0, -1);
            this.inputText.text = this.username;
            this.updateCursorPosition();
        } else if (event.key.length === 1) {
            // Add character if it's a single printable character and length is under 15
            if (this.username.length < 15) {
                this.username += event.key;
                this.inputText.text = this.username;
                this.updateCursorPosition();
            }
        }
    }

    updateCursorPosition() {
        if (this.cursor && this.inputText) { // Check if elements exist
            this.cursor.x = this.inputText.x + this.inputText.width + 2;
        }
    }

    completeUsernameEntry() {
        // Validate username (non-empty)
        if (this.username.trim() === '') {
            this.username = generateRandomUsername();
            this.inputText.text = this.username;
            this.updateCursorPosition();
            return;
        }

        // Save username
        saveUsername(this.username);

        // Remove event listener
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));

        // Stop animations and intervals
        if (this.cursorInterval) clearInterval(this.cursorInterval); // Clear interval

        // Clean up PIXI elements (optional but good practice)
        this.container.removeChildren(); // Remove all children managed by this screen
        // Maybe destroy individual complex elements like background/stars if needed

        // Remove main container from stage
        if (this.container.parent) { // Check if it's still on stage
            this.container.parent.removeChild(this.container);
        }

        // Call the completion callback with the username
        this.onComplete(this.username);
    }

    destroy() {
        // Remove key event listeners
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));

        // Clear cursor interval
        if (this.cursorInterval) clearInterval(this.cursorInterval);

        // Remove planet sprites
        this.planets.forEach(p => {
            if (p.parent) {
                p.parent.removeChild(p);
            }
            // Optional: p.destroy(); if needed
        });
        this.planets = []; // Clear the array

        // Remove container from stage if it exists and has a parent
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }

        // Optional: Explicitly destroy PIXI objects if needed
        // this.container.destroy({ children: true, texture: true, baseTexture: true });

        // Call the onComplete callback if it hasn't been called (e.g., screen replaced unexpectedly)
        // Might not be needed depending on game flow
        // if (this.onComplete) {
        //     this.onComplete(this.username); // Or maybe null/undefined?
        //     this.onComplete = null; // Prevent double calls
        // }
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
} 