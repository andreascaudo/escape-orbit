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
        this.gravitationalField = config.radius * 5; // Gravity field radius
        this.colonized = false;

        // Create graphics container for the planet
        this.sprite = new PIXI.Graphics();

        // Create orbit path
        this.orbitPath = new PIXI.Graphics();

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

        // Draw gravitational field (very faint)
        sprite.beginFill(this.color, 0.05);
        sprite.drawCircle(0, 0, this.gravitationalField);
        sprite.endFill();

        // Draw atmosphere
        sprite.beginFill(this.color, 0.2);
        sprite.drawCircle(0, 0, this.atmosphere);
        sprite.endFill();

        // Draw planet
        sprite.beginFill(this.color);
        sprite.drawCircle(0, 0, this.radius);
        sprite.endFill();

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

    updatePosition() {
        if (this.orbitRadius <= 0 || !this.sunX || !this.sunY) return;

        // Calculate new position based on orbit angle
        this.x = this.sunX + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.sunY + Math.sin(this.orbitAngle) * this.orbitRadius;

        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;
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

    colonize() {
        console.log(`Colonizing planet: ${this.name}`);
        this.colonized = true;
        this.needsUpdate = true;
    }
} 