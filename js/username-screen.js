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
        inputBg.y = this.app.screen.height / 2 - 25;
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
        randomButton.y = this.app.screen.height / 2 + 50;
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
        startButton.y = this.app.screen.height / 2 + 50;
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

    createLeaderboardDisplay() {
        // Create leaderboard container
        const leaderboardContainer = new PIXI.Container();
        leaderboardContainer.x = this.app.screen.width / 2 - 200;
        leaderboardContainer.y = this.app.screen.height / 2 + 120;
        this.container.addChild(leaderboardContainer);

        // Create leaderboard title
        const leaderboardTitle = new PIXI.Text('TOP PILOTS', {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFFDD33,
            align: 'center'
        });
        leaderboardTitle.anchor.set(0.5, 0);
        leaderboardTitle.x = 200;
        leaderboardTitle.y = 0;
        leaderboardContainer.addChild(leaderboardTitle);

        // Create leaderboard background
        const leaderboardBg = new PIXI.Graphics();
        leaderboardBg.beginFill(0x000033, 0.5);
        leaderboardBg.lineStyle(2, 0x3355FF);
        leaderboardBg.drawRoundedRect(0, 40, 400, 180, 10);
        leaderboardBg.endFill();
        leaderboardContainer.addChild(leaderboardBg);

        // Get leaderboard data
        const leaderboard = getLeaderboard();

        // Display top 5 entries
        const topEntries = leaderboard.slice(0, 5);

        if (topEntries.length === 0) {
            const noScoresText = new PIXI.Text('No scores yet. You could be the first!', {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xCCCCCC,
                align: 'center'
            });
            noScoresText.anchor.set(0.5, 0);
            noScoresText.x = 200;
            noScoresText.y = 100;
            leaderboardContainer.addChild(noScoresText);
        } else {
            // Create header row
            const headerRow = new PIXI.Container();
            headerRow.y = 50;
            leaderboardContainer.addChild(headerRow);

            const rankHeader = new PIXI.Text('Rank', {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xCCCCFF
            });
            rankHeader.x = 20;
            headerRow.addChild(rankHeader);

            const nameHeader = new PIXI.Text('Pilot', {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xCCCCFF
            });
            nameHeader.x = 70;
            headerRow.addChild(nameHeader);

            const scoreHeader = new PIXI.Text('Score', {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xCCCCFF
            });
            scoreHeader.x = 250;
            headerRow.addChild(scoreHeader);

            const planetsHeader = new PIXI.Text('Planets', {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xCCCCFF
            });
            planetsHeader.x = 330;
            headerRow.addChild(planetsHeader);

            // Create entries
            topEntries.forEach((entry, index) => {
                const row = new PIXI.Container();
                row.y = 80 + index * 30;
                leaderboardContainer.addChild(row);

                const rankText = new PIXI.Text(`${index + 1}`, {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xFFFFFF
                });
                rankText.x = 20;
                row.addChild(rankText);

                const nameText = new PIXI.Text(entry.username, {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xFFFFFF
                });
                nameText.x = 70;
                // Truncate name if too long
                if (nameText.width > 170) {
                    nameText.text = nameText.text.substring(0, 12) + '...';
                }
                row.addChild(nameText);

                const scoreText = new PIXI.Text(entry.score.toString(), {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xFFFFFF
                });
                scoreText.x = 250;
                row.addChild(scoreText);

                const planetsText = new PIXI.Text(entry.planetsVisited.toString(), {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xFFFFFF
                });
                planetsText.x = 330;
                row.addChild(planetsText);
            });
        }
    }

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
        // Remove from stage if still attached
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }

        // Remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));

        // Stop animations
        this.app.ticker.remove(this.animateStars, this);
    }
} 