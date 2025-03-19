class Sun {
    constructor(config) {
        console.log('Creating the Sun');
        this.name = config.name;
        this.radius = config.radius;
        this.color = config.color;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.coronaRadius = this.radius * 1.5;
        this.dangerZoneRadius = this.radius * 2.8; // Reduced from 3 to avoid visual overlap
        this.deathZoneRadius = this.radius * 1.8; // Death zone where spaceship is instantly destroyed

        // Animation properties
        this.animationTime = 0;
        this.flareIntensity = 0;

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

        // Draw danger zone (very faint red/orange with further reduced opacity)
        sprite.beginFill(0xFF5500, 0.04); // Reduced from 0.06 to 0.04
        sprite.drawCircle(0, 0, this.dangerZoneRadius);
        sprite.endFill();

        // Draw death zone (slightly more visible orange/yellow with reduced opacity)
        sprite.beginFill(0xFF8800, 0.07); // Reduced from 0.1 to 0.07
        sprite.drawCircle(0, 0, this.deathZoneRadius);
        sprite.endFill();

        // Draw outer glow (corona) with animation effect
        const gradientSteps = 10;
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            const pulseFactor = 1 + 0.1 * Math.sin(this.animationTime * 2 + i * 0.3) * (1 - ratio);
            const alpha = (0.4 - ratio * 0.38) * (1 + this.flareIntensity * 0.3);

            sprite.beginFill(this.color, alpha);
            sprite.drawCircle(0, 0, this.coronaRadius * pulseFactor * (1 - ratio * 0.5));
            sprite.endFill();
        }

        // Draw sun core with subtle pulsing
        const corePulse = 1 + 0.05 * Math.sin(this.animationTime * 3);
        sprite.beginFill(this.color);
        sprite.drawCircle(0, 0, this.radius * corePulse);
        sprite.endFill();

        // Add random solar flares
        if (Math.random() < 0.05) {
            this.drawSolarFlare(sprite);
        }

        // Set position
        sprite.x = this.x;
        sprite.y = this.y;
    }

    drawSolarFlare(sprite) {
        // Add a random solar flare
        const flareAngle = Math.random() * Math.PI * 2;
        const flareLength = this.radius * (0.5 + Math.random() * 0.3);
        const flareWidth = this.radius * (0.1 + Math.random() * 0.2);

        // Draw flare as a triangle
        sprite.beginFill(0xFFFF00, 0.7);
        sprite.moveTo(
            Math.cos(flareAngle) * this.radius,
            Math.sin(flareAngle) * this.radius
        );
        sprite.lineTo(
            Math.cos(flareAngle + flareWidth) * this.radius,
            Math.sin(flareAngle + flareWidth) * this.radius
        );
        sprite.lineTo(
            Math.cos(flareAngle + flareWidth / 2) * (this.radius + flareLength),
            Math.sin(flareAngle + flareWidth / 2) * (this.radius + flareLength)
        );
        sprite.endFill();

        // Increase flare intensity for animation
        this.flareIntensity = Math.min(1, this.flareIntensity + 0.3);
    }

    update() {
        // Animate the Sun with pulsating and occasional flares
        this.animationTime += 0.05;

        // Gradually reduce flare intensity
        this.flareIntensity = Math.max(0, this.flareIntensity - 0.02);

        // Redraw the sun with animation
        this.drawSun();
    }

    // Check if the spaceship is in the sun's danger zone
    checkSpaceshipProximity(spaceship) {
        if (!spaceship) return null;

        const dist = distance(this.x, this.y, spaceship.x, spaceship.y);

        // If in the death zone, instantly destroy the spaceship
        if (dist < this.deathZoneRadius) {
            return 'destroyed';
        }

        // If in the danger zone, damage the spaceship (reduce fuel)
        if (dist < this.dangerZoneRadius) {
            const heatIntensity = 1 - ((dist - this.radius) / (this.dangerZoneRadius - this.radius));
            const fuelDrain = 0.2 * heatIntensity; // 0.2% fuel per frame at maximum heat

            // Apply heat damage
            spaceship.fuel = Math.max(0, spaceship.fuel - fuelDrain);

            return 'burning';
        }

        return null;
    }
} 