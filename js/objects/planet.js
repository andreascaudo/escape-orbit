class Planet {
    constructor(config) {
        console.log('Creating planet:', config.name);
        this.name = config.name;
        this.radius = config.radius;
        this.color = config.color;

        // Initial position (will be updated if orbiting)
        this.x = config.x || 0;
        this.y = config.y || 0;

        // Orbital properties
        this.orbitRadius = config.orbitRadius || 0;
        this.orbitSpeed = config.orbitSpeed || 0;
        this.orbitAngle = config.orbitAngle || 0;
        this.sunX = 0; // Will be set when positioning in the solar system
        this.sunY = 0; // Will be set when positioning in the solar system

        this.atmosphere = config.radius * 1.2; // Atmosphere radius
        this.gravitationalField = config.radius * 6; // Reduced from 8 to 6 for smaller field
        this.orbitRange = config.radius * 3; // Range where player can enter orbit
        this.inOrbitRange = false; // If player is within orbit range
        this.visited = false;
        this.orbitVisited = false; // New flag to track if visited by orbit
        this.isStartingPlanet = false; // Flag to identify Earth (the starting planet)

        // Bonus multiplier tracking
        this.recentlyDirectVisited = false; // Flag to track if planet was recently directly visited
        this.directVisitTime = 0; // Timer to track how long ago the direct visit happened
        this.directVisitWindow = 60 * 5; // 5 seconds window (at 60fps) to get bonus

        // Timer for visited status (in frames, 60fps = 180 seconds or 3 minutes)
        this.visitTimer = 0;
        this.visitDuration = 60 * 180; // 3 minutes at 60fps
        this.visitTimerActive = false;

        // Score tracking
        this.bonusScoreAdded = false; // Track if bonus score was already added

        // Create graphics container for the planet
        this.sprite = new PIXI.Graphics();

        // Create orbit path
        this.orbitPath = new PIXI.Graphics();

        // Create orbit indicator
        this.orbitIndicator = new PIXI.Graphics();

        // Create timer indicator
        this.timerIndicator = new PIXI.Graphics();

        // Create label for the planet
        this.label = new PIXI.Text(this.name, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.label.anchor.set(0.5);

        try {
            this.drawPlanet();
            this.drawOrbitPath();
            console.log(`Planet ${this.name} drawn successfully`);
        } catch (error) {
            console.error(`Error drawing planet ${this.name}:`, error);
        }
    }

    // Set the Sun's position
    setSunPosition(x, y) {
        this.sunX = x;
        this.sunY = y;
        this.drawOrbitPath();
        this.updatePosition(); // Initially position the planet on its orbit
    }

    drawPlanet() {
        const sprite = this.sprite;

        // Clear the old graphics
        sprite.clear();

        // Draw gravitational field with a more gradual fade and reduced opacity
        const gradientSteps = 6;
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            const fieldRadius = this.gravitationalField * (1 - ratio * 0.3);
            // Further reduced alpha values for gravitational field
            const fieldAlpha = 0.07 * (1 - ratio * 0.9); // Reduced from 0.1 to 0.07

            sprite.beginFill(this.color, fieldAlpha);
            sprite.drawCircle(0, 0, fieldRadius);
            sprite.endFill();
        }

        // Draw atmosphere
        sprite.beginFill(this.color, 0.2);
        sprite.drawCircle(0, 0, this.atmosphere);
        sprite.endFill();

        // Draw planet
        sprite.beginFill(this.color);
        sprite.drawCircle(0, 0, this.radius);
        sprite.endFill();

        // If this planet was visited by orbit, show parachute emoji
        if (this.visited) {
            try {
                // Create a text object with parachute emoji
                if (!this.parachuteEmoji) {
                    this.parachuteEmoji = new PIXI.Text('🏡', {
                        fontFamily: 'Arial',
                        fontSize: this.radius * 0.5,
                        align: 'center'
                    });
                    this.parachuteEmoji.anchor.set(0.5);
                    // Add the emoji to the sprite
                    sprite.addChild(this.parachuteEmoji);
                } else {
                    // Update size if planet size changes
                    this.parachuteEmoji.style.fontSize = this.radius * 0.5;
                }
                console.log(`Parachute emoji shown for ${this.name}`);
            } catch (error) {
                console.error('Error adding parachute emoji:', error);
                // Fallback to a simple shape
                sprite.beginFill(0xFFFFFF);
                sprite.drawCircle(0, 0, this.radius * 0.2);
                sprite.endFill();
            }
        }

        // Clean up emojis if they shouldn't be displayed
        if (!this.orbitVisited && this.parachuteEmoji && sprite.children.includes(this.parachuteEmoji)) {
            sprite.removeChild(this.parachuteEmoji);
            this.parachuteEmoji = null;
        }

        // Set position
        sprite.x = this.x;
        sprite.y = this.y;

        // Update label style based on visit status
        if (this.visited) {
            this.label.style.fill = 0xAAFFFF;
        } else {
            this.label.style.fill = 0xFFFFFF;
        }

        // Position label
        this.label.x = this.x;
        this.label.y = this.y + this.radius + 15;
    }

    drawOrbitPath() {
        if (this.orbitRadius <= 0 || !this.sunX || !this.sunY) return;

        const path = this.orbitPath;
        path.clear();

        // Draw orbit path as dashed line
        path.lineStyle(1, this.color, 0.3);
        path.drawCircle(0, 0, this.orbitRadius);

        // Position the orbit path at the sun
        path.x = this.sunX;
        path.y = this.sunY;
    }

    // Draw the orbit range indicator when player is in range
    updateOrbitIndicator(inRange, playerX, playerY) {
        this.inOrbitRange = inRange;
        this.orbitIndicator.clear();

        if (inRange) {
            // Calculate actual distance from player to planet
            const actualDistance = playerX && playerY ?
                distance(this.x, this.y, playerX, playerY) :
                this.radius * 4; // Fallback if player position not provided

            // Draw orbit indicator using planet's color
            this.orbitIndicator.lineStyle(3, this.color, 0.8);

            // Draw dashed circle around the planet to indicate orbit range
            const dashLength = 12; // Slightly longer dashes
            const gapLength = 6;  // Slightly longer gaps

            // Use actual player distance instead of fixed radius
            const radius = actualDistance;

            const circumference = 2 * Math.PI * radius;
            const steps = Math.floor(circumference / (dashLength + gapLength));

            for (let i = 0; i < steps; i++) {
                const startAngle = (i * (dashLength + gapLength)) / circumference * 2 * Math.PI;
                const endAngle = startAngle + (dashLength / circumference) * 2 * Math.PI;

                this.orbitIndicator.arc(0, 0, radius, startAngle, endAngle);
            }

            // Clear any previous elements from the indicator
            while (this.orbitIndicator.children.length > 0) {
                this.orbitIndicator.removeChildAt(0);
            }
        }

        // Position the orbit indicator at the planet
        this.orbitIndicator.x = this.x;
        this.orbitIndicator.y = this.y;
    }

    update() {
        if (this.needsUpdate) {
            this.drawPlanet();
            this.needsUpdate = false;
        }

        // Update position based on orbit around sun
        if (this.orbitRadius > 0 && this.orbitSpeed > 0) {
            this.orbitAngle += this.orbitSpeed;
            this.updatePosition();
        }

        // Update direct visit window timer
        if (this.recentlyDirectVisited) {
            this.directVisitTime++;

            // If the time window has expired, reset the flag
            if (this.directVisitTime >= this.directVisitWindow) {
                this.recentlyDirectVisited = false;
                this.directVisitTime = 0;
            }
        }

        // Handle visit timer if active and not the starting planet
        if (this.visitTimerActive && !this.isStartingPlanet) {
            this.visitTimer--;

            // Update the timer indicator
            this.updateTimerIndicator();

            // Reset visited status when timer reaches zero
            if (this.visitTimer <= 0) {
                this.resetVisitedStatus();
            }
        }
    }

    // Update position based on orbit angle
    updatePosition() {
        if (this.orbitRadius <= 0 || !this.sunX || !this.sunY) return;

        // Calculate new position based on orbit angle
        this.x = this.sunX + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.sunY + Math.sin(this.orbitAngle) * this.orbitRadius;

        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // Update label position
        this.label.x = this.x;
        this.label.y = this.y + this.radius + 15;

        // Update orbit indicator position if it exists
        if (this.orbitIndicator) {
            this.orbitIndicator.x = this.x;
            this.orbitIndicator.y = this.y;
        }

        // Update timer indicator position
        if (this.timerIndicator) {
            this.timerIndicator.x = this.x;
            this.timerIndicator.y = this.y;
        }
    }

    getIdealOrbitRadius() {
        // Return an ideal orbit radius scaled to planet size
        // Make orbits larger for larger planets
        return this.radius * 6; // Increased from 4x to 6x
    }

    // Mark as visited (generic)
    visit() {
        if (!this.visited) {
            console.log(`Visited planet: ${this.name}`);
            this.visited = true;
            this.needsUpdate = true;
        }
    }

    // Mark as visited by directly passing through the planet
    visitDirect() {
        if (!this.visited) {
            console.log(`Directly visited planet: ${this.name}`);
            this.visited = true;
            this.needsUpdate = true;

            // Set the flag for the bonus multiplier
            this.recentlyDirectVisited = true;
            this.directVisitTime = 0;
        }
    }

    // Mark planet as eligible for bonus without setting it as visited
    markForDirectPassBonus() {
        console.log(`Marking ${this.name} as eligible for bonus (direct pass)`);

        // Set the flag for the bonus multiplier
        this.recentlyDirectVisited = true;
        this.directVisitTime = 0;
    }

    // Mark as visited by orbiting
    visitByOrbit() {
        if (!this.orbitVisited) {
            console.log(`Visited planet by orbit: ${this.name}`);
            this.orbitVisited = true;
            this.visited = true; // Also mark as generally visited
            this.needsUpdate = true;

            // Don't start the timer here - it will be started when exiting orbit
        }
    }

    // Clean up resources when the planet is removed
    destroy() {
        if (this.parachuteEmoji) {
            if (this.sprite && this.sprite.children.includes(this.parachuteEmoji)) {
                this.sprite.removeChild(this.parachuteEmoji);
            }
            this.parachuteEmoji = null;
        }

        // Clean up other PIXI objects if needed
        if (this.orbitIndicator) {
            this.orbitIndicator.clear();
        }

        if (this.orbitPath) {
            this.orbitPath.clear();
        }

        if (this.sprite) {
            this.sprite.clear();
        }
    }

    // Create a gradient texture for glow effects
    createGradientTexture(radius, color, backgroundColor, alpha, backgroundAlpha) {
        // Create a canvas for the gradient
        const quality = 256;
        const canvas = document.createElement('canvas');
        canvas.width = quality;
        canvas.height = quality;

        const ctx = canvas.getContext('2d');

        // Create a radial gradient
        const gradient = ctx.createRadialGradient(
            quality / 2,
            quality / 2,
            0,
            quality / 2,
            quality / 2,
            quality / 2
        );

        // Add color stops
        gradient.addColorStop(0, PIXI.utils.hex2string(color) + (alpha !== undefined ? Math.round(alpha * 255).toString(16) : 'FF'));
        gradient.addColorStop(1, PIXI.utils.hex2string(backgroundColor || 0x000000) + (backgroundAlpha !== undefined ? Math.round(backgroundAlpha * 255).toString(16) : '00'));

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, quality, quality);

        // Create PIXI texture from canvas
        const texture = PIXI.Texture.from(canvas);

        return texture;
    }

    // Method to update the timer indicator
    updateTimerIndicator() {
        this.timerIndicator.clear();

        if (this.visitTimerActive && this.visitTimer > 0) {
            // Calculate timer percentage
            const percentage = this.visitTimer / this.visitDuration;

            // Draw timer arc
            this.timerIndicator.lineStyle(3, this.color, 1);
            this.timerIndicator.arc(
                0, 0, // Center of the circle
                this.radius + 8, // Radius of the timer circle
                0, // Start angle (0 radians is at 3 o'clock)
                Math.PI * 2 * percentage, // End angle based on percentage remaining
                false // counterclockwise
            );

            // Position the timer indicator
            this.timerIndicator.x = this.x;
            this.timerIndicator.y = this.y;
        }
    }

    // Method to reset visited status when timer expires
    resetVisitedStatus() {
        this.visited = false;
        this.orbitVisited = false;
        this.visitTimerActive = false;
        this.visitTimer = 0;
        this.bonusScoreAdded = false; // Allow planet to give bonus again
        this.recentlyDirectVisited = false;
        this.directVisitTime = 0;
        this.drawPlanet(); // Update visual state to remove indicators
        console.log(`Visit timer expired for ${this.name}. Planet is no longer marked as visited.`);
    }

    // Method to start the visit timer
    startVisitTimer() {
        // Don't start timer for starting planet (Earth)
        if (this.isStartingPlanet) return;

        this.visitTimer = this.visitDuration;
        this.visitTimerActive = true;
        this.updateTimerIndicator();
    }

    // Mark as Earth (the starting planet)
    markAsStartingPlanet() {
        this.isStartingPlanet = true;
    }

    // Check if eligible for bonus multiplier (called when entering orbit)
    isEligibleForBonus() {
        return this.recentlyDirectVisited && !this.bonusScoreAdded;
    }

    // Mark that the bonus score has been added
    markBonusAdded() {
        this.bonusScoreAdded = true;
    }

    // Set the visited state of the planet
    setVisited(value) {
        this.visited = value;
        this.drawPlanet(); // Update visual state
    }
} 