class Spaceship {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.orbitAngle = 0;
        this.orbitRadius = 0;
        this.orbiting = null; // Reference to planet being orbited
        this.fuel = CONSTANTS.MAX_FUEL;
        this.boosting = false;

        // Create sprite
        this.sprite = new PIXI.Graphics();
        this.drawSpaceship();
    }

    drawSpaceship() {
        const sprite = this.sprite;
        sprite.clear();

        // Draw ship body
        sprite.beginFill(0xFFFFFF);
        sprite.moveTo(10, 0);
        sprite.lineTo(-5, -5);
        sprite.lineTo(-3, 0);
        sprite.lineTo(-5, 5);
        sprite.lineTo(10, 0);
        sprite.endFill();

        // Draw engine flame if boosting
        if (this.boosting && this.fuel > 0) {
            sprite.beginFill(0xFF4400);
            sprite.moveTo(-3, 0);
            sprite.lineTo(-10, -3);
            sprite.lineTo(-15, 0);
            sprite.lineTo(-10, 3);
            sprite.lineTo(-3, 0);
            sprite.endFill();
        }

        // Set position and rotation
        sprite.x = this.x;
        sprite.y = this.y;
        sprite.rotation = this.rotation;
    }

    update(planets) {
        // Handle fuel consumption
        if (this.orbiting) {
            this.fuel -= CONSTANTS.ORBIT_FUEL_CONSUMPTION;
        }

        if (this.boosting && this.fuel > 0) {
            this.fuel -= CONSTANTS.BOOST_FUEL_CONSUMPTION;

            // Apply thrust in direction of ship rotation
            this.vx += Math.cos(this.rotation) * CONSTANTS.BOOST_POWER;
            this.vy += Math.sin(this.rotation) * CONSTANTS.BOOST_POWER;
        }

        // Cap fuel at 0-100
        this.fuel = Math.max(0, Math.min(CONSTANTS.MAX_FUEL, this.fuel));

        // If we're orbiting a planet
        if (this.orbiting) {
            // Calculate orbital position
            this.orbitAngle += CONSTANTS.ORBIT_SPEED;
            this.x = this.orbiting.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            this.y = this.orbiting.y + Math.sin(this.orbitAngle) * this.orbitRadius;

            // Point ship tangent to orbit
            this.rotation = this.orbitAngle + Math.PI / 2;
        } else {
            // Free movement physics
            this.x += this.vx;
            this.y += this.vy;

            // Apply gravity from all planets
            this.applyGravity(planets);

            // Point ship in direction of movement
            if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
                this.rotation = Math.atan2(this.vy, this.vx);
            }

            // Check if we've entered orbit of a planet
            this.checkOrbit(planets);
        }

        // Update visual representation
        this.drawSpaceship();
    }

    applyGravity(planets) {
        planets.forEach(planet => {
            const dx = planet.x - this.x;
            const dy = planet.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only apply gravity if within the gravitational field
            if (dist < planet.gravitationalField) {
                const force = CONSTANTS.GRAVITY * (1 - dist / planet.gravitationalField);
                const angle = Math.atan2(dy, dx);

                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }
        });
    }

    checkOrbit(planets) {
        planets.forEach(planet => {
            const dist = distance(this.x, this.y, planet.x, planet.y);

            // If we're close to the planet but not too close (not crashed)
            if (dist > planet.radius * 1.2 && dist < planet.atmosphere) {
                // Enter orbit
                this.enterOrbit(planet, dist);
            }

            // If we're very close to the planet and it's not colonized yet
            if (dist < planet.radius * 1.1 && !planet.colonized) {
                // Colonize the planet and get fuel
                planet.colonize();
                this.fuel += CONSTANTS.PLANET_REFUEL_AMOUNT;
            }
        });
    }

    enterOrbit(planet, dist) {
        this.orbiting = planet;
        this.orbitRadius = dist;
        this.orbitAngle = angle(planet.x, planet.y, this.x, this.y);
        this.vx = 0;
        this.vy = 0;
    }

    exitOrbit() {
        if (this.orbiting && this.fuel > 0) {
            this.orbiting = null;

            // Give initial velocity in direction ship is facing
            this.vx = Math.cos(this.rotation) * CONSTANTS.BOOST_POWER * 2;
            this.vy = Math.sin(this.rotation) * CONSTANTS.BOOST_POWER * 2;
        }
    }

    startBoosting() {
        this.boosting = true;
    }

    stopBoosting() {
        this.boosting = false;
    }
} 