class Sun {
    constructor(config) {
        console.log('Creating the Sun');
        this.name = config.name;
        this.radius = config.radius;
        this.color = config.color;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.coronaRadius = this.radius * 1.5;

        // Create graphics container for the sun
        this.sprite = new PIXI.Graphics();

        try {
            this.drawSun();
            console.log('Sun drawn successfully');
        } catch (error) {
            console.error('Error drawing the Sun:', error);
        }
    }

    drawSun() {
        const sprite = this.sprite;
        sprite.clear();

        // Draw outer glow (corona)
        const gradientSteps = 8;
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            const alpha = 0.3 - ratio * 0.3;
            sprite.beginFill(this.color, alpha);
            sprite.drawCircle(0, 0, this.coronaRadius * (1 - ratio * 0.5));
            sprite.endFill();
        }

        // Draw sun core
        sprite.beginFill(this.color);
        sprite.drawCircle(0, 0, this.radius);
        sprite.endFill();

        // Set position
        sprite.x = this.x;
        sprite.y = this.y;
    }

    update() {
        // Animate the Sun (could add rotation or pulsating effects)
    }
} 