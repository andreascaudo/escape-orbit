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
            //if (this.x < -100) this.x = CONSTANTS.SCREEN_WIDTH + 100;
            //if(this.x > CONSTANTS.SCREEN_WIDTH + 100) this.x = -100;
            //if (this.y < -100) this.y = CONSTANTS.SCREEN_HEIGHT + 100;
            //if(this.y > CONSTANTS.SCREEN_HEIGHT + 100) this.y = -100;
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

class FuelBoost {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, 0.5);
        this.radius = 30; // Increased radius even more (was 20)
        this.rotation = 0;
        this.rotationSpeed = random(-0.01, 0.01); // Slower rotation for the satellite
        this.active = true;
        this.collected = false;
        this.collectProgress = 0;
        this.disintegrating = false; // Added disintegration state for planet proximity
        this.disintegrateProgress = 0;
        this.fuelAmount = 30 + Math.floor(Math.random() * 20); // Increased fuel amount (was 20-35)

        // Create sprite container
        this.sprite = new PIXI.Container();

        // Create emoji text
        this.emoji = new PIXI.Text('🛰️', {
            fontSize: 48, // Larger emoji (was 32)
            align: 'center'
        });
        this.emoji.anchor.set(0.5);

        // Create glow effect
        this.glow = new PIXI.Graphics();

        // Add to sprite container
        this.sprite.addChild(this.glow);
        this.sprite.addChild(this.emoji);

        // Create fuel animation text (initially hidden)
        this.fuelText = null;

        this.draw();
    }

    draw() {
        // Don't clear the whole sprite, just update the glow
        this.glow.clear();

        if (this.disintegrating) {
            // Draw disintegration animation
            const fadeAlpha = 1 - (this.disintegrateProgress / 20);
            const particleCount = 8;

            // Draw particles spreading outward
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 / particleCount) * i;
                const distance = this.disintegrateProgress * 2;
                const particleX = Math.cos(angle) * distance;
                const particleY = Math.sin(angle) * distance;
                const particleSize = Math.max(1, this.radius * (1 - this.disintegrateProgress / 20));

                this.glow.beginFill(0x44AAFF, fadeAlpha);
                this.glow.drawCircle(particleX, particleY, particleSize / 2);
                this.glow.endFill();
            }

            // Fade out the emoji during disintegration
            this.emoji.alpha = fadeAlpha;
            return;
        } else if (this.collected) {
            // Draw collection animation
            const fadeAlpha = 1 - (this.collectProgress / 15);
            const particleCount = 8;

            // Draw particles spreading outward
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 / particleCount) * i;
                const distance = this.collectProgress * 2;
                const particleX = Math.cos(angle) * distance;
                const particleY = Math.sin(angle) * distance;
                const particleSize = Math.max(1, this.radius * (1 - this.collectProgress / 15));

                this.glow.beginFill(0x44AAFF, fadeAlpha);
                this.glow.drawCircle(particleX, particleY, particleSize / 2);
                this.glow.endFill();
            }

            // Fade out the emoji during collection
            this.emoji.alpha = fadeAlpha;
        } else {
            // Draw glow effect behind emoji
            this.glow.beginFill(0x44AAFF, 0.3);
            this.glow.drawCircle(0, 0, this.radius * 1.5);
            this.glow.endFill();

            // Pulsating effect
            const pulseScale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            this.emoji.scale.set(pulseScale);
        }

        // Position sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.rotation;
    }

    update() {
        if (!this.active) return;

        if (this.disintegrating) {
            // Update disintegration animation
            this.disintegrateProgress++;
            if (this.disintegrateProgress > 20) {
                this.active = false;
                this.sprite.visible = false;
            }
            this.draw();
            return;
        } else if (this.collected) {
            // Update collection animation
            this.collectProgress++;

            // Update fuel text animation if it exists
            if (this.fuelText) {
                this.fuelText.y -= 1; // Move text upward
                // Don't fade out the text immediately - let the timeout handle removal
            }

            if (this.collectProgress > 15) {
                this.active = false;
                this.sprite.visible = false;

                // Don't remove the fuel text here - let the timeout handle it
            }
            this.draw();
            return;
        }

        // Move fuel boost
        this.x += this.vx;
        this.y += this.vy;

        // Rotate fuel boost
        this.rotation += this.rotationSpeed;

        // Wrap around screen
        if (this.x < -100) this.x = CONSTANTS.SCREEN_WIDTH + 100;
        if (this.x > CONSTANTS.SCREEN_WIDTH + 100) this.x = -100;
        if (this.y < -100) this.y = CONSTANTS.SCREEN_HEIGHT + 100;
        if (this.y > CONSTANTS.SCREEN_HEIGHT + 100) this.y = -100;

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.rotation;

        // Update glow and pulse effect
        this.draw();
    }

    // Check if fuel boost is near a planet
    checkPlanetInteraction(planets) {
        if (!this.active || this.collected || this.disintegrating) return;

        // Check if near any planet's atmosphere
        planets.forEach(planet => {
            // Calculate distance directly instead of using distance function
            const dx = this.x - planet.x;
            const dy = this.y - planet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If fuel boost gets close to planet atmosphere, disintegrate it
            if (dist < planet.atmosphere * 2) {
                this.startDisintegration();
                return;
            }
        });
    }

    // Start disintegration effect
    startDisintegration() {
        if (this.disintegrating) return;
        this.disintegrating = true;
        this.disintegrateProgress = 0;
        // Stop movement
        this.vx = 0;
        this.vy = 0;
    }

    collect() {
        if (this.collected || this.disintegrating) return;
        this.collected = true;
        this.collectProgress = 0;
        // Stop movement
        this.vx = 0;
        this.vy = 0;

        // Create the floating fuel text
        if (window.game) {
            this.fuelText = new PIXI.Text(`Fuel +${this.fuelAmount}`, {
                fontFamily: 'Futura',
                fontSize: 18, // Increased text size (was 16)
                fontWeight: 'bold',
                fill: 0x44AAFF,
                align: 'center',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 1
            });
            this.fuelText.anchor.set(0.5);
            this.fuelText.x = this.x;
            this.fuelText.y = this.y - 40; // Start higher (was -30)

            // Add text to game container
            window.game.gameContainer.addChild(this.fuelText);

            // Set a timeout to remove the text after 2 seconds
            setTimeout(() => {
                if (this.fuelText && this.fuelText.parent) {
                    this.fuelText.parent.removeChild(this.fuelText);
                    this.fuelText = null;
                }
            }, 2000);
        }
    }

    checkCollection(spaceship) {
        if (!spaceship || !this.active || this.collected || this.disintegrating) return false;

        // Calculate distance directly
        const dx = this.x - spaceship.x;
        const dy = this.y - spaceship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Collection radius is larger to make it easier to hit
        if (dist < this.radius + 25) { // Increased collision radius (was this.radius + 15)
            this.collect();
            return this.fuelAmount;
        }

        return false;
    }
} 