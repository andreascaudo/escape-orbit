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
        this.colonized = false;
        this.inOrbitRange = false; // If player is within orbit range
        this.visited = false;

        // Score tracking
        this.visitScoreAdded = false;
        this.colonizeScoreAdded = false;

        // Create graphics container for the planet
        this.sprite = new PIXI.Graphics();

        // Create orbit path
        this.orbitPath = new PIXI.Graphics();

        // Create orbit indicator
        this.orbitIndicator = new PIXI.Graphics();

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

        // Add visited indicator if visited but not colonized
        if (this.visited && !this.colonized) {
            // Draw a smaller star for visited planets
            try {
                sprite.beginFill(0xFFFFFF, 0.9);

                // Create points for a star shape (smaller than colonization star)
                const points = [];
                const outerRadius = this.radius * 0.15;
                const innerRadius = this.radius * 0.07;
                const numPoints = 5;
                const startAngle = -Math.PI / 2;

                for (let i = 0; i < numPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = startAngle + (i * Math.PI) / numPoints;
                    points.push(
                        radius * Math.cos(angle),
                        radius * Math.sin(angle)
                    );
                }

                sprite.drawPolygon(points);
                sprite.endFill();

                // Also draw an outline around the planet
                sprite.lineStyle(2, 0xFFFFFF, 0.5);
                sprite.drawCircle(0, 0, this.radius + 3);
                sprite.lineStyle(0);
            } catch (error) {
                console.error('Error drawing visited star:', error);
                // Fallback
                sprite.lineStyle(2, 0xFFFFFF, 0.7);
                sprite.drawCircle(0, 0, this.radius + 3);
                sprite.lineStyle(0);
            }
        }

        // Add colonization marker if colonized
        if (this.colonized) {
            try {
                // Draw a star using drawPolygon (instead of drawStar which might not be available)
                sprite.beginFill(0xFFFFFF);

                // Create points for a star shape
                const points = [];
                const outerRadius = this.radius * 0.2;
                const innerRadius = this.radius * 0.1;
                const numPoints = 5;
                const startAngle = -Math.PI / 2;

                for (let i = 0; i < numPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = startAngle + (i * Math.PI) / numPoints;
                    points.push(
                        radius * Math.cos(angle),
                        radius * Math.sin(angle)
                    );
                }

                sprite.drawPolygon(points);
                sprite.endFill();
                console.log(`Star drawn for ${this.name} using polygon`);
            } catch (error) {
                console.error('Error drawing star polygon:', error);
                // Ultimate fallback to a simple circle
                sprite.beginFill(0xFFFFFF);
                sprite.drawCircle(0, 0, this.radius * 0.2);
                sprite.endFill();
            }
        }

        // Set position
        sprite.x = this.x;
        sprite.y = this.y;

        // Update label style based on visit status
        if (this.visited) {
            this.label.style.fill = this.colonized ? 0xFFDD33 : 0xAAFFFF;
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
    }

    update() {
        // Update orbit angle for animation
        if (this.orbitRadius > 0 && this.orbitSpeed > 0) {
            this.orbitAngle += this.orbitSpeed;
            this.updatePosition();
        }

        // Update visuals if needed
        if (this.needsUpdate) {
            this.drawPlanet();
            this.needsUpdate = false;
        }
    }

    getIdealOrbitRadius() {
        // Return an ideal orbit radius scaled to planet size
        // Make orbits larger for larger planets
        return this.radius * 6; // Increased from 4x to 6x
    }

    visit() {
        if (!this.visited) {
            console.log(`Visited planet: ${this.name}`);
            this.visited = true;
        }
    }

    colonize() {
        console.log(`Colonizing planet: ${this.name}`);
        this.colonized = true;
        this.visited = true; // Also mark as visited
        this.needsUpdate = true;
    }
} 