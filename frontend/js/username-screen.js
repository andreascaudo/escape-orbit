// Username screen functionality

class UsernameScreen {
    constructor(app, onComplete) {
        this.app = app;
        this.onComplete = onComplete;
        this.container = new PIXI.Container();
        this.username = getUsername(); // Get existing username if available

        this.init();
    }

    init() {
        // Add container to stage
        this.app.stage.addChild(this.container);

        // Create background
        this.createBackground();

        // Create UI elements
        this.createUI();

        // Handle keyboard input
        this.setupKeyboardInput();
    }

    createBackground() {
        // Create a starfield background
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000022);
        this.background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.background.endFill();
        this.container.addChild(this.background);

        // Add stars
        this.stars = new PIXI.Container();
        this.container.addChild(this.stars);

        // Add 200 stars
        for (let i = 0; i < 200; i++) {
            const star = new PIXI.Graphics();
            const size = Math.random() * 2 + 1;
            const alpha = Math.random() * 0.5 + 0.5;
            star.beginFill(0xFFFFFF, alpha);
            star.drawCircle(0, 0, size);
            star.endFill();
            star.x = Math.random() * this.app.screen.width;
            star.y = Math.random() * this.app.screen.height;
            this.stars.addChild(star);

            // Add twinkling animation
            star.twinkling = Math.random() * 2 * Math.PI;
            star.twinkleSpeed = Math.random() * 0.03 + 0.01;
            star.originalAlpha = alpha;
        }

        // Animate the stars
        this.app.ticker.add(this.animateStars, this);
    }

    animateStars(delta) {
        this.stars.children.forEach(star => {
            star.twinkling += star.twinkleSpeed * delta;
            star.alpha = star.originalAlpha * (0.7 + 0.3 * Math.sin(star.twinkling));
        });
    }

    createUI() {
        // Create title
        const title = new PIXI.Text('ESCAPE ORBIT', {
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 3
        });
        title.anchor.set(0.5, 0);
        title.x = this.app.screen.width / 2;
        title.y = 60;
        this.container.addChild(title);

        // Create subtitle
        const subtitle = new PIXI.Text('What\'s your callsign, pilot?', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xCCCCFF,
            align: 'center'
        });
        subtitle.anchor.set(0.5, 0);
        subtitle.x = this.app.screen.width / 2;
        subtitle.y = 130;
        this.container.addChild(subtitle);

        // Create input box background
        const inputBg = new PIXI.Graphics();
        inputBg.beginFill(0x000033);
        inputBg.lineStyle(2, 0x3355FF);
        inputBg.drawRoundedRect(0, 0, 400, 50, 10);
        inputBg.endFill();
        inputBg.x = this.app.screen.width / 2 - 200;
        inputBg.y = this.app.screen.height / 2 - 170;
        this.container.addChild(inputBg);

        // Create input text
        this.inputText = new PIXI.Text(this.username, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'left'
        });
        this.inputText.x = inputBg.x + 10;
        this.inputText.y = inputBg.y + 10;
        this.container.addChild(this.inputText);

        // Create cursor
        this.cursor = new PIXI.Graphics();
        this.cursor.beginFill(0xFFFFFF);
        this.cursor.drawRect(0, 0, 2, 30);
        this.cursor.endFill();
        this.cursor.x = this.inputText.x + this.inputText.width + 2;
        this.cursor.y = this.inputText.y;
        this.container.addChild(this.cursor);

        // Animate cursor blink
        this.cursorVisible = true;
        setInterval(() => {
            this.cursorVisible = !this.cursorVisible;
            this.cursor.visible = this.cursorVisible;
        }, 500);

        // Create random button
        const randomButton = new PIXI.Graphics();
        randomButton.beginFill(0x225588);
        randomButton.lineStyle(2, 0x3355FF);
        randomButton.drawRoundedRect(0, 0, 200, 40, 10);
        randomButton.endFill();
        randomButton.x = this.app.screen.width / 2 - 210;
        randomButton.y = this.app.screen.height / 2 - 100;
        this.container.addChild(randomButton);

        const randomText = new PIXI.Text('Random Name', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        });
        randomText.anchor.set(0.5, 0.5);
        randomText.x = randomButton.x + 100;
        randomText.y = randomButton.y + 20;
        this.container.addChild(randomText);

        // Make random button interactive
        randomButton.eventMode = 'static';
        randomButton.cursor = 'pointer';
        randomButton.on('pointerdown', () => {
            this.username = generateRandomUsername();
            this.inputText.text = this.username;
            this.updateCursorPosition();
        });

        // Create start button
        const startButton = new PIXI.Graphics();
        startButton.beginFill(0x225588);
        startButton.lineStyle(2, 0x3355FF);
        startButton.drawRoundedRect(0, 0, 200, 40, 10);
        startButton.endFill();
        startButton.x = this.app.screen.width / 2 + 10;
        startButton.y = this.app.screen.height / 2 - 100;
        this.container.addChild(startButton);

        const startText = new PIXI.Text('Start Game', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        });
        startText.anchor.set(0.5, 0.5);
        startText.x = startButton.x + 100;
        startText.y = startButton.y + 20;
        this.container.addChild(startText);

        // Make start button interactive
        startButton.eventMode = 'static';
        startButton.cursor = 'pointer';
        startButton.on('pointerdown', () => this.completeUsernameEntry());

        // Create leaderboard display
        this.createLeaderboardDisplay();
    }

    handleResize(newWidth, newHeight) {
        // Reposition elements based on new screen size
        if (this.background) {
            this.background.clear();
            this.background.beginFill(0x000022);
            this.background.drawRect(0, 0, newWidth, newHeight);
            this.background.endFill();
        }
        // Reposition title, subtitle, input box, buttons etc. based on newWidth/newHeight
        // Example:
        // if (this.title) { this.title.x = newWidth / 2; }
        // if (this.inputBg) { this.inputBg.x = newWidth / 2 - 200; this.inputBg.y = newHeight / 2 - 25; }
        // ... and so on for all UI elements ...
        // Don't forget to update cursor position relative to inputText
        // this.updateCursorPosition();

        // Re-create/reposition leaderboard if it's part of this screen (only for desktop)
        // if (!this.detectMobile() && this.leaderboardContainer) {
        //     // Remove old one
        //     this.container.removeChild(this.leaderboardContainer);
        //     // Recreate or reposition
        //     this.createLeaderboardDisplay(); // Assuming this function correctly uses current app dimensions
        // }
    }

    createLeaderboardDisplay() {
        // Check if on mobile device, and skip creating leaderboard if so
        const isMobile = this.detectMobile();
        if (isMobile) {
            // On mobile, we'll show the leaderboard on the game instructions page instead
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
        const leaderboardContainer = new PIXI.Container();
        // Positioning adjusted slightly to accommodate potential scrollbar later if needed
        leaderboardContainer.x = this.app.screen.width / 2 - LEADERBOARD_WIDTH / 2;
        leaderboardContainer.y = this.app.screen.height / 2 + 100; // Moved up slightly
        this.container.addChild(leaderboardContainer);

        // Create leaderboard title
        const leaderboardTitle = new PIXI.Text('TOP PILOTS', {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFFDD33,
            align: 'center'
        });
        leaderboardTitle.anchor.set(0.5, -0.25);
        leaderboardTitle.x = LEADERBOARD_WIDTH / 2;
        leaderboardTitle.y = 0;
        leaderboardContainer.addChild(leaderboardTitle);

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
        leaderboardContainer.addChild(leaderboardBg);

        // --- Header Row ---
        const headerRow = new PIXI.Container();
        headerRow.y = 40; // Below title
        leaderboardContainer.addChild(headerRow);

        const rankHeader = new PIXI.Text('Rank', { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        rankHeader.x = 20;
        headerRow.addChild(rankHeader);

        const nameHeader = new PIXI.Text('Pilot', { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        nameHeader.x = 70;
        headerRow.addChild(nameHeader);

        const scoreHeader = new PIXI.Text('Score', { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        scoreHeader.x = 250;
        headerRow.addChild(scoreHeader);

        const planetsHeader = new PIXI.Text('Planets', { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: 0xCCCCFF });
        planetsHeader.x = 330;
        headerRow.addChild(planetsHeader);
        // --- End Header Row ---


        // --- Scrollable Content Area ---
        // Container for all entries (will be masked and moved)
        const scrollContentContainer = new PIXI.Container();
        scrollContentContainer.y = CONTENT_START_Y; // Position below header
        leaderboardContainer.addChild(scrollContentContainer);
        this.leaderboardScrollContent = scrollContentContainer; // Store reference for scrolling

        // Create the mask graphic
        const scrollMask = new PIXI.Graphics();
        scrollMask.beginFill(0xff0000, 0.5); // Color/alpha doesn't matter for mask
        scrollMask.drawRect(0, CONTENT_START_Y, LEADERBOARD_WIDTH, SCROLL_AREA_HEIGHT); // Position and size of visible area
        scrollMask.endFill();
        leaderboardContainer.addChild(scrollMask); // Add mask to the main container

        // Apply the mask
        scrollContentContainer.mask = scrollMask;
        // --- End Scrollable Content Area Setup ---


        // Create loading indicator (positioned within the eventual scroll area)
        const loadingText = new PIXI.Text('Loading leaderboard...', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xCCCCCC,
            align: 'center'
        });
        loadingText.anchor.set(0.5);
        loadingText.x = LEADERBOARD_WIDTH / 2;
        loadingText.y = SCROLL_AREA_HEIGHT / 2; // Center vertically in visible area
        scrollContentContainer.addChild(loadingText); // Add to scroll container initially


        // Get leaderboard data asynchronously
        getLeaderboard().then(leaderboard => {
            // Remove loading text
            if (loadingText.parent) {
                scrollContentContainer.removeChild(loadingText);
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
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0xCCCCCC,
                    align: 'center'
                });
                noScoresText.anchor.set(0.5);
                noScoresText.x = LEADERBOARD_WIDTH / 2;
                noScoresText.y = SCROLL_AREA_HEIGHT / 2;
                scrollContentContainer.addChild(noScoresText); // Add to scroll container
            } else {
                // Create and add all entries to the scroll container
                allEntries.forEach((entry, index) => {
                    const row = new PIXI.Container();
                    // Position rows relative to the scrollContentContainer
                    row.y = index * ROW_HEIGHT;
                    scrollContentContainer.addChild(row);

                    const rankText = new PIXI.Text(`${index + 1}`, { fontFamily: 'Arial', fontSize: 16, fill: 0xFFFFFF });
                    rankText.x = 20;
                    row.addChild(rankText);

                    const nameText = new PIXI.Text(entry.username, { fontFamily: 'Arial', fontSize: 16, fill: 0xFFFFFF });
                    nameText.x = 70;
                    // Truncate name if too long
                    if (nameText.width > 170) { // Adjust width check if needed
                        nameText.text = nameText.text.substring(0, 15) + '...'; // Allow slightly more chars
                    }
                    row.addChild(nameText);

                    const scoreText = new PIXI.Text(entry.score.toString(), { fontFamily: 'Arial', fontSize: 16, fill: 0xFFFFFF });
                    scoreText.x = 250;
                    row.addChild(scoreText);

                    const planetsText = new PIXI.Text(entry.planetsVisited.toString(), { fontFamily: 'Arial', fontSize: 16, fill: 0xFFFFFF });
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
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0xFF8888,
                    align: 'center'
                });
                errorText.anchor.set(0.5);
                errorText.x = LEADERBOARD_WIDTH / 2;
                errorText.y = SCROLL_AREA_HEIGHT / 2;
                scrollContentContainer.addChild(errorText);
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
        this.cursor.x = this.inputText.x + this.inputText.width + 2;
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

        // Stop animations
        this.app.ticker.remove(this.animateStars, this);

        // Clean up
        this.app.stage.removeChild(this.container);

        // Call the completion callback with the username
        this.onComplete(this.username);
    }

    destroy() {
        // Remove key event listeners
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));

        // Stop ticker
        this.app.ticker.remove(this.animateStars, this);

        // Remove container from stage
        this.app.stage.removeChild(this.container);

        // Call the onComplete callback with the username
        this.onComplete(this.username);
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