class Hazard {
    constructor(type, x, y) {
        this.type = type; // 'meteor' or 'blackhole'
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.active = true; // Flag to track if the hazard is active
        this.disintegrating = false; // Flag to track if meteor is disintegrating
        this.disintegrateProgress = 0; // Progress of disintegration animation

        // Create sprite
        this.sprite = new PIXI.Graphics();

        // Set properties based on type
        if (this.type === 'meteor') {
            this.radius = 10 + Math.random() * 10;
            this.vx = random(-1, 1);
            this.vy = random(-1, 1);
            this.rotationSpeed = random(-0.05, 0.05);
        } else if (this.type === 'blackhole') {
            this.radius = 20 + Math.random() * 20;
            this.gravitationalField = this.radius * 8;
        }

        this.draw();
    }

    draw() {
        const sprite = this.sprite;
        sprite.clear();

        if (this.type === 'meteor') {
            if (this.disintegrating) {
                // Draw disintegrating meteor
                const fadeAlpha = 1 - (this.disintegrateProgress / 20);
                const particleCount = 5 + Math.floor(this.disintegrateProgress / 2);

                // Draw particles spreading outward
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 / particleCount) * i;
                    const distance = this.disintegrateProgress * 1.5;
                    const particleX = Math.cos(angle) * distance;
                    const particleY = Math.sin(angle) * distance;
                    const particleSize = Math.max(1, this.radius * (1 - this.disintegrateProgress / 20));

                    sprite.beginFill(0xAA8866, fadeAlpha);
                    sprite.drawCircle(particleX, particleY, particleSize / 2);
                    sprite.endFill();
                }
            } else {
                // Draw regular meteor
                sprite.beginFill(0xAA8866);

                // Create irregular shape
                const numPoints = 7;
                const angleStep = (Math.PI * 2) / numPoints;
                sprite.moveTo(this.radius, 0);

                for (let i = 1; i <= numPoints; i++) {
                    const angle = i * angleStep;
                    const radius = this.radius * (0.8 + Math.random() * 0.4);
                    sprite.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }

                sprite.endFill();
            }
        } else if (this.type === 'blackhole') {
            // Draw gravitational field
            sprite.beginFill(0x000022, 0.1);
            sprite.drawCircle(0, 0, this.gravitationalField);
            sprite.endFill();

            // Draw event horizon (outer part)
            const gradientSteps = 8;
            for (let i = 0; i < gradientSteps; i++) {
                const ratio = i / gradientSteps;
                const alpha = 0.8 - ratio * 0.7;
                sprite.beginFill(0x4400AA, alpha);
                sprite.drawCircle(0, 0, this.radius * (1 - ratio * 0.7));
                sprite.endFill();
            }

            // Black center
            sprite.beginFill(0x000000);
            sprite.drawCircle(0, 0, this.radius * 0.3);
            sprite.endFill();
        }

        // Position sprite
        sprite.x = this.x;
        sprite.y = this.y;
        sprite.rotation = this.rotation;
    }

    update() {
        if (!this.active) return;

        if (this.type === 'meteor') {
            if (this.disintegrating) {
                // Update disintegration animation
                this.disintegrateProgress++;
                if (this.disintegrateProgress > 20) {
                    this.active = false;
                    this.sprite.visible = false;
                }
                this.draw();
                return;
            }

            // Move meteor
            this.x += this.vx;
            this.y += this.vy;

            // Rotate meteor
            this.rotation += this.rotationSpeed;

            // Wrap around screen
            if (this.x < -100) this.x = CONSTANTS.SCREEN_WIDTH + 100;
            if (this.x > CONSTANTS.SCREEN_WIDTH + 100) this.x = -100;
            if (this.y < -100) this.y = CONSTANTS.SCREEN_HEIGHT + 100;
            if (this.y > CONSTANTS.SCREEN_HEIGHT + 100) this.y = -100;
        } else if (this.type === 'blackhole') {
            // Black holes don't move, but could pulsate or rotate visually
            this.rotation += 0.01;
        }

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.rotation;
    }

    // Check if meteor is near a planet or if a spaceship in orbit would be hit
    checkPlanetInteraction(planets, spaceship) {
        if (!this.active || this.type !== 'meteor') return;

        // Check if near any planet's atmosphere or spaceship orbit
        planets.forEach(planet => {
            const dist = distance(this.x, this.y, planet.x, planet.y);

            // If meteor gets close to planet atmosphere, disintegrate it
            if (dist < planet.atmosphere * 1.5) {
                this.startDisintegration();
                return;
            }

            // If meteor might hit an orbiting spaceship, disintegrate it
            if (spaceship && spaceship.orbiting === planet) {
                const meteorToShipDist = distance(this.x, this.y, spaceship.x, spaceship.y);
                if (meteorToShipDist < spaceship.orbitRadius * 1.2) {
                    // Meteor is approaching orbit path, disintegrate it
                    this.startDisintegration();
                    return;
                }
            }
        });
    }

    startDisintegration() {
        if (this.disintegrating) return;
        this.disintegrating = true;
        this.disintegrateProgress = 0;
        // Stop movement
        this.vx = 0;
        this.vy = 0;
    }

    applyEffect(spaceship) {
        if (!spaceship || !this.active || this.disintegrating) return;

        // Calculate distance to spaceship
        const dist = distance(this.x, this.y, spaceship.x, spaceship.y);

        if (this.type === 'meteor') {
            // Collision detection with meteor
            if (dist < this.radius + 10) { // 10 is approximate ship radius
                return 'collision';
            }
        } else if (this.type === 'blackhole') {
            // Apply gravitational pull from black hole
            if (dist < this.gravitationalField) {
                const force = 0.2 * (1 - dist / this.gravitationalField);
                const ang = angle(spaceship.x, spaceship.y, this.x, this.y);

                // Apply force to spaceship
                if (!spaceship.orbiting) {
                    spaceship.vx += Math.cos(ang) * force;
                    spaceship.vy += Math.sin(ang) * force;
                }

                // If too close, spaceship gets consumed
                if (dist < this.radius * 0.7) {
                    return 'consumed';
                }
            }
        }

        return null;
    }
} 