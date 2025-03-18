class Planet {
    constructor(config) {
        console.log('Creating planet:', config.name);
        this.name = config.name;
        this.radius = config.radius;
        this.color = config.color;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.atmosphere = config.radius * 1.2; // Atmosphere radius
        this.gravitationalField = config.radius * 5; // Gravity field radius
        this.colonized = false;

        this.sprite = new PIXI.Graphics();
        try {
            this.drawPlanet();
            console.log(`Planet ${this.name} drawn successfully`);
        } catch (error) {
            console.error(`Error drawing planet ${this.name}:`, error);
        }
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

    update() {
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