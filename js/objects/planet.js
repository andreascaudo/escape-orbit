class Planet {
    constructor(config) {
        this.name = config.name;
        this.radius = config.radius;
        this.color = config.color;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.atmosphere = config.radius * 1.2; // Atmosphere radius
        this.gravitationalField = config.radius * 5; // Gravity field radius
        this.colonized = false;

        this.sprite = new PIXI.Graphics();
        this.drawPlanet();
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
            sprite.beginFill(0xFFFFFF);
            sprite.drawStar(0, 0, 5, this.radius * 0.2, this.radius * 0.1);
            sprite.endFill();
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
        this.colonized = true;
        this.needsUpdate = true;
    }
} 