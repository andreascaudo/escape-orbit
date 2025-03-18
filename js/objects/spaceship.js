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

        // Create trajectory prediction line
        this.trajectoryLine = new PIXI.Graphics();

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

    // Draw a prediction line showing the trajectory when exiting orbit
    drawTrajectoryPrediction(planets) {
        if (!this.orbiting || this.fuel <= 0) {
            // Clear trajectory line if not orbiting or out of fuel
            this.trajectoryLine.clear();
            return;
        }

        // Calculate predicted velocity after exit
        const orbitSpeed = Math.sqrt(CONSTANTS.GRAVITY * this.orbitRadius);
        const tangentialDirection = this.orbitAngle + Math.PI / 2;
        const orbitalVX = Math.cos(tangentialDirection) * orbitSpeed;
        const orbitalVY = Math.sin(tangentialDirection) * orbitSpeed;
        const boostPower = CONSTANTS.BOOST_POWER * 2;
        const boostVX = Math.cos(this.rotation) * boostPower;
        const boostVY = Math.sin(this.rotation) * boostPower;

        // Predicted velocity components
        const predVX = orbitalVX + boostVX;
        const predVY = orbitalVY + boostVY;

        // Draw trajectory prediction line
        const line = this.trajectoryLine;
        line.clear();
        line.lineStyle(1, 0xFFFFFF, 0.5);

        // Start at current position
        line.moveTo(this.x, this.y);

        // Simulate trajectory for a number of steps
        let simX = this.x;
        let simY = this.y;
        let simVX = predVX;
        let simVY = predVY;

        // Simulate trajectory for 150 steps
        for (let i = 0; i < 150; i++) {
            // Apply gravity from all planets in simulation
            let totalForceX = 0;
            let totalForceY = 0;

            planets.forEach(planet => {
                const dx = planet.x - simX;
                const dy = planet.y - simY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < planet.gravitationalField) {
                    const force = CONSTANTS.GRAVITY * (1 - dist / planet.gravitationalField);
                    const angle = Math.atan2(dy, dx);

                    totalForceX += Math.cos(angle) * force;
                    totalForceY += Math.sin(angle) * force;
                }
            });

            // Update simulated velocity with gravity
            simVX += totalForceX;
            simVY += totalForceY;

            // Update simulated position
            simX += simVX;
            simY += simVY;

            // Add point to trajectory line
            if (i % 3 === 0) { // Add every 3rd point to reduce line complexity
                line.lineTo(simX, simY);
            }
        }
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

            // Update trajectory prediction when orbiting
            this.drawTrajectoryPrediction(planets);
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

            // Clear trajectory line when not in orbit
            this.trajectoryLine.clear();
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
            // Calculate orbital velocity components
            // Tangential velocity is perpendicular to the radius
            const orbitSpeed = Math.sqrt(CONSTANTS.GRAVITY * this.orbitRadius);

            // Calculate tangential direction (perpendicular to radius)
            const tangentialDirection = this.orbitAngle + Math.PI / 2;

            // Calculate orbital velocity components
            const orbitalVX = Math.cos(tangentialDirection) * orbitSpeed;
            const orbitalVY = Math.sin(tangentialDirection) * orbitSpeed;

            // Calculate boost components in the direction ship is facing
            const boostPower = CONSTANTS.BOOST_POWER * 2;
            const boostVX = Math.cos(this.rotation) * boostPower;
            const boostVY = Math.sin(this.rotation) * boostPower;

            // Set velocity as combination of orbital velocity and boost
            this.vx = orbitalVX + boostVX;
            this.vy = orbitalVY + boostVY;

            // Apply small fuel cost for the exit boost
            this.fuel -= CONSTANTS.BOOST_FUEL_CONSUMPTION * 2;

            // Clear orbit reference
            this.orbiting = null;

            console.log("Exiting orbit with velocity:", Math.sqrt(this.vx * this.vx + this.vy * this.vy));
        }
    }

    startBoosting() {
        this.boosting = true;
    }

    stopBoosting() {
        this.boosting = false;
    }
} 