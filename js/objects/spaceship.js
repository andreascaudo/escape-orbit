// Helper function to normalize an angle to the range [-PI, PI]
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

// Helper function for smooth interpolation
function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

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
        this.nearbyPlanet = null; // Track the nearest planet in range for orbit
        this.burning = false; // Whether ship is being damaged by the sun

        // Add orbit boost properties
        this.orbitSpeedBoost = 0;
        this.maxOrbitSpeedBoost = 0.02; // Maximum boost to orbit speed

        // Add properties for gravity reduction after leaving orbit
        this.lastOrbitedPlanet = null;
        this.orbitExitTime = 0;
        this.orbitExitGracePeriod = 120; // Frames where gravity is reduced after exit
        this.orbitExitCounter = 0;
        this.exitingOrbit = false;

        // Orbit direction and transition properties
        this.orbitDirection = 1; // 1 for counter-clockwise, -1 for clockwise
        this.inOrbitTransition = false;
        this.orbitTransitionProgress = 0;
        this.currentOrbitSpeed = 0;
        this.targetOrbitSpeed = 0;

        // Initial orbit position for smooth transitions
        this.initialOrbitX = 0;
        this.initialOrbitY = 0;

        // Burning animation properties
        this.burnAnimationTime = 0;

        // Track planets we've passed through to prevent multiple scoring events
        this.recentPassedPlanets = {};

        // Track which planets the ship is currently inside of
        this.currentlyInsidePlanets = {};

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

        // Draw burning effects if being damaged by sun
        if (this.burning) {
            this.burnAnimationTime += 0.2;

            // Draw heat waves around the spaceship
            const waveCount = 5;
            for (let i = 0; i < waveCount; i++) {
                const angleOffset = (i / waveCount) * Math.PI * 2 + this.burnAnimationTime;
                const distScale = 1 + Math.sin(this.burnAnimationTime * 0.5 + i);

                // Red/orange flames with varying opacity
                const flameOpacity = 0.4 + 0.3 * Math.sin(this.burnAnimationTime + i * 0.7);

                sprite.beginFill(0xFF3300, flameOpacity);

                // Draw flame particles
                const flameX = Math.cos(angleOffset) * 6 * distScale;
                const flameY = Math.sin(angleOffset) * 6 * distScale;
                const flameSize = 2 + Math.sin(this.burnAnimationTime + i) * 1.5;

                sprite.drawCircle(flameX, flameY, flameSize);
                sprite.endFill();
            }

            // Draw ship hull with reddish tint to indicate heating
            sprite.beginFill(0xFFDDAA, 0.5);
            sprite.moveTo(10, 0);
            sprite.lineTo(-5, -5);
            sprite.lineTo(-3, 0);
            sprite.lineTo(-5, 5);
            sprite.lineTo(10, 0);
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
        // Use the orbit radius that was set when entering orbit
        const orbitSpeed = Math.sqrt(CONSTANTS.GRAVITY * this.orbiting.radius *
            (this.orbitRadius / this.orbiting.radius)) * (1 + this.orbitSpeedBoost * 10); // Apply orbit speed boost

        // Use the correct tangential direction based on orbit direction
        const tangentialDirection = this.orbitAngle + (this.orbitDirection === 1 ? Math.PI / 2 : -Math.PI / 2);

        const orbitalVX = Math.cos(tangentialDirection) * orbitSpeed;
        const orbitalVY = Math.sin(tangentialDirection) * orbitSpeed;

        // Make boost more powerful for smaller planets (inverse scaling)
        let boostMultiplier;

        // Small planets (radius < 35) get the biggest boost
        if (this.orbiting.radius < 35) {
            boostMultiplier = 16.0; // Doubled from 8.0
        }
        // Medium planets (35-50) get a medium boost
        else if (this.orbiting.radius < 50) {
            boostMultiplier = 13.0; // Doubled from 6.5
        }
        // Large planets get the standard boost
        else {
            boostMultiplier = 10.0; // Doubled from 5.0
        }

        const boostPower = CONSTANTS.BOOST_POWER * boostMultiplier;
        const boostVX = Math.cos(this.rotation) * boostPower;
        const boostVY = Math.sin(this.rotation) * boostPower;

        // Predicted velocity components
        const predVX = orbitalVX + boostVX;
        const predVY = orbitalVY + boostVY;

        // Draw trajectory prediction line
        const line = this.trajectoryLine;
        line.clear();
        line.lineStyle(1, 0xFFFFFF, 0.5);

        // Calculate the starting point with the small position offset (matching exitOrbit)
        const escapeDistance = this.orbiting.radius * 0.3;
        const startX = this.x + Math.cos(this.rotation) * escapeDistance;
        const startY = this.y + Math.sin(this.rotation) * escapeDistance;

        // Start at predicted exit position
        line.moveTo(startX, startY);

        // Simulate trajectory for a number of steps
        let simX = startX;
        let simY = startY;
        let simVX = predVX;
        let simVY = predVY;

        // Store the current planet for reduced gravity simulation
        const exitingPlanet = this.orbiting;

        // Simulate trajectory for 200 steps
        for (let i = 0; i < 200; i++) {
            // Apply gravity from all planets in simulation
            let totalForceX = 0;
            let totalForceY = 0;

            // Simulate reduced gravity effect after exit
            const simulatedExitCounter = i < this.orbitExitGracePeriod ? i : this.orbitExitGracePeriod;
            const gracePeriodActive = simulatedExitCounter < this.orbitExitGracePeriod;

            planets.forEach(planet => {
                const dx = planet.x - simX;
                const dy = planet.y - simY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < planet.gravitationalField) {
                    // Calculate base gravity force with updated planet size scaling
                    const sizeFactor = (planet.radius / 40) * 1.5; // Match the new scaling in applyGravity
                    let force = CONSTANTS.GRAVITY * (1 - dist / planet.gravitationalField) * Math.max(0.6, sizeFactor);

                    // Apply reduced gravity for the exiting planet
                    if (gracePeriodActive && planet === exitingPlanet) {
                        const gravityReduction = 1 - (simulatedExitCounter / this.orbitExitGracePeriod);
                        force *= gravityReduction * 0.3; // Same reduction as in applyGravity
                    }

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

            if (!this.orbiting) {
                // Apply thrust in direction of ship rotation when not orbiting
                this.vx += Math.cos(this.rotation) * CONSTANTS.BOOST_POWER;
                this.vy += Math.sin(this.rotation) * CONSTANTS.BOOST_POWER;
            } else {
                // When orbiting, increase orbit speed
                this.orbitSpeedBoost = Math.min(this.orbitSpeedBoost + 0.001, this.maxOrbitSpeedBoost);
            }
        } else if (!this.orbiting && !this.boosting) {
            // When not boosting and not in orbit, gradually decrease velocity to simulate mild space friction
            const slowdownFactor = 0.98; // Adjust this value to control how quickly the ship slows down
            this.vx *= slowdownFactor;
            this.vy *= slowdownFactor;

            // Maintain a minimum drift speed instead of stopping completely
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const minDriftSpeed = 6; // Keep drift speed at 5, it is a good speed

            if (currentSpeed > 0 && currentSpeed < minDriftSpeed) {
                // Scale velocity to maintain minimum speed
                const scaleFactor = minDriftSpeed / currentSpeed;
                this.vx *= scaleFactor;
                this.vy *= scaleFactor;
            }
        }

        if (this.orbitSpeedBoost > 0) {
            // Gradually decrease orbit speed boost when not boosting
            this.orbitSpeedBoost = Math.max(0, this.orbitSpeedBoost - 0.0005);
        }

        // Cap fuel at 0-100
        this.fuel = Math.max(0, Math.min(CONSTANTS.MAX_FUEL, this.fuel));

        // If we're orbiting a planet
        if (this.orbiting) {
            // Handle orbit transition if needed
            if (this.inOrbitTransition) {
                // Progress the orbit transition
                this.orbitTransitionProgress += 0.05; // Slower transition to prevent sudden movements

                if (this.orbitTransitionProgress >= 1) {
                    // Transition complete
                    this.inOrbitTransition = false;
                    this.orbitTransitionProgress = 1;
                }

                // Smoothly interpolate orbit speed
                const transitionFactor = smoothstep(0, 1, this.orbitTransitionProgress);
                this.currentOrbitSpeed = this.targetOrbitSpeed * transitionFactor +
                    (1 - transitionFactor) * (this.currentOrbitSpeed);

                // Update orbit angle based on direction and speed
                this.orbitAngle += this.orbitDirection * (this.currentOrbitSpeed / this.orbitRadius);

                // Blend position from initial position to orbital position
                const orbitalX = this.orbiting.x + Math.cos(this.orbitAngle) * this.orbitRadius;
                const orbitalY = this.orbiting.y + Math.sin(this.orbitAngle) * this.orbitRadius;

                this.x = this.initialOrbitX * (1 - transitionFactor) + orbitalX * transitionFactor;
                this.y = this.initialOrbitY * (1 - transitionFactor) + orbitalY * transitionFactor;
            } else {
                // Apply orbit speed boost when boosting
                this.currentOrbitSpeed = CONSTANTS.ORBIT_SPEED + this.orbitSpeedBoost;

                // Update orbit angle based on direction and speed
                this.orbitAngle += this.orbitDirection * this.currentOrbitSpeed;

                // Calculate orbital position
                this.x = this.orbiting.x + Math.cos(this.orbitAngle) * this.orbitRadius;
                this.y = this.orbiting.y + Math.sin(this.orbitAngle) * this.orbitRadius;
            }

            // Point ship tangent to orbit, respecting orbit direction
            this.rotation = this.orbitAngle + (this.orbitDirection === 1 ? Math.PI / 2 : -Math.PI / 2);

            // Update trajectory prediction when orbiting
            this.drawTrajectoryPrediction(planets);

            // Reset exiting orbit state when in orbit
            this.exitingOrbit = false;
            this.orbitExitCounter = 0;
        } else {
            // Free movement physics
            this.x += this.vx;
            this.y += this.vy;

            // Update orbit exit counter if we recently left an orbit
            if (this.exitingOrbit) {
                this.orbitExitCounter++;
                if (this.orbitExitCounter >= this.orbitExitGracePeriod) {
                    this.exitingOrbit = false;
                    this.orbitExitCounter = 0;
                    this.lastOrbitedPlanet = null;
                }
            }

            // Apply gravity from all planets (with reduction if recently exited orbit)
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
                // Calculate base force with stronger planet size scaling
                // Make gravity even more proportional to planet size
                const sizeFactor = (planet.radius / 40) * 1.5; // Increased size influence by 50%
                let force = CONSTANTS.GRAVITY * (1 - dist / planet.gravitationalField) * Math.max(0.6, sizeFactor);

                // Reduce gravity when exiting orbit
                if (this.exitingOrbit && planet === this.lastOrbitedPlanet) {
                    // Gradually increase gravity as grace period ends
                    const gravityReduction = 1 - (this.orbitExitCounter / this.orbitExitGracePeriod);
                    force *= gravityReduction * 0.3; // Only 30% at the beginning, increases over time
                }

                const angle = Math.atan2(dy, dx);

                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }
        });
    }

    checkOrbit(planets) {
        this.nearbyPlanet = null;
        let closestDistance = Infinity;

        // Reduce cooldown timers for all recently passed planets
        Object.keys(this.recentPassedPlanets).forEach(planetId => {
            this.recentPassedPlanets[planetId]--;
            if (this.recentPassedPlanets[planetId] <= 0) {
                delete this.recentPassedPlanets[planetId];
            }
        });

        planets.forEach(planet => {
            const dist = distance(this.x, this.y, planet.x, planet.y);
            const planetId = planet.name || planets.indexOf(planet);

            // Check if we're in orbit range of the planet
            if (dist > planet.radius * 1.2 && dist < planet.atmosphere * 6) { // Increased from 3 to 5
                // Track the nearest planet in range
                if (dist < closestDistance) {
                    closestDistance = dist;
                    this.nearbyPlanet = planet;
                }

                // Update the planet's orbit indicator with player's position
                planet.updateOrbitIndicator(true, this.x, this.y);

                // If we were inside this planet before and now we're outside, mark as no longer inside
                if (this.currentlyInsidePlanets[planetId]) {
                    delete this.currentlyInsidePlanets[planetId];
                }
            } else {
                // Turn off orbit indicator if out of range
                planet.updateOrbitIndicator(false);
            }

            // If we're very close to the planet, get fuel regardless of visit status
            if (dist < planet.radius * 1.1) {
                // Add fuel - always get fuel even if planet was visited
                this.fuel += CONSTANTS.PLANET_REFUEL_AMOUNT;

                // Check if we weren't inside this planet before
                if (!this.currentlyInsidePlanets[planetId]) {
                    // Mark that we're now inside this planet
                    this.currentlyInsidePlanets[planetId] = true;

                    // Only proceed if we haven't recently passed through this planet
                    if (!this.recentPassedPlanets[planetId] && window.game) {
                        // Set a cooldown for this planet (120 frames = ~2 seconds)
                        this.recentPassedPlanets[planetId] = 120;

                        // Check if this planet has already been visited by orbit
                        if (!planet.orbitVisited) {
                            // Use the new method to mark the planet as eligible for bonus
                            if (typeof planet.markForDirectPassBonus === 'function') {
                                planet.markForDirectPassBonus();
                            }

                            // Add direct pass score
                            window.game.addScoreForDirectPass(planet);
                        } else {
                            // If planet already visited, just show a message about fuel refill (no points)
                            window.game.showFuelRefillMessage(planet);
                        }
                    }
                }
            }
        });
    }

    // Try to enter orbit around the closest planet
    tryEnterOrbit() {
        if (!this.orbiting && this.nearbyPlanet) {
            const dist = distance(this.x, this.y, this.nearbyPlanet.x, this.nearbyPlanet.y);

            // If we're still in range, enter orbit
            if (dist > this.nearbyPlanet.radius * 1.2 && dist < this.nearbyPlanet.atmosphere * 5) { // Increased from 3 to 5
                // Get ideal orbit radius based on planet size
                const orbitRadius = this.nearbyPlanet.getIdealOrbitRadius();
                this.enterOrbit(this.nearbyPlanet, orbitRadius);
                return true;
            }
        }
        return false;
    }

    enterOrbit(planet, dist) {
        // Calculate the orbit angle based on the current position
        const currentOrbitAngle = angle(planet.x, planet.y, this.x, this.y);

        // Calculate the approaching direction of the ship
        const approachAngle = Math.atan2(this.vy, this.vx);

        // Calculate the proper orbit direction (perpendicular to radius)
        // Tangential direction should be +90° or -90° from radius depending on approach
        const tangentialDirection = currentOrbitAngle + Math.PI / 2;

        // Determine if the spaceship should orbit clockwise or counter-clockwise
        // by checking the angle between approach direction and tangential direction
        let angleDiff = normalizeAngle(approachAngle - tangentialDirection);

        // If the approach is more in the opposite direction, reverse orbit direction
        const clockwise = Math.abs(angleDiff) > Math.PI / 2;

        // Get actual current distance from the planet
        const currentDistance = distance(this.x, this.y, planet.x, planet.y);
        const minOrbitRadius = planet.radius * 3; // Minimum orbit radius
        // Use the larger of the current distance or the minimum orbit radius
        const orbitRadius = Math.max(currentDistance, minOrbitRadius);
        // Cap the maximum orbit radius
        const maxOrbitRadius = planet.radius * 8; // Maximum orbit radius
        const finalOrbitRadius = Math.min(orbitRadius, maxOrbitRadius);

        // Important: Position the ship at the exact distance from the planet
        // to prevent the teleportation effect
        this.x = planet.x + Math.cos(currentOrbitAngle) * finalOrbitRadius;
        this.y = planet.y + Math.sin(currentOrbitAngle) * finalOrbitRadius;

        // Store the initial position to prevent teleporting during transition
        this.initialOrbitX = this.x;
        this.initialOrbitY = this.y;

        // Set orbit properties - do this after positioning to prevent jumps
        this.orbiting = planet;
        this.orbitRadius = finalOrbitRadius;
        this.orbitAngle = currentOrbitAngle;

        // Reset orbit speed boost
        this.orbitSpeedBoost = 0;

        // Store the ship's previous velocity for smooth transition
        const prevSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        // Set orbit direction
        this.orbitDirection = clockwise ? -1 : 1;

        // Calculate ideal orbit speed based on gravity
        const idealOrbitSpeed = Math.sqrt(CONSTANTS.GRAVITY * planet.radius);

        // Blend between current speed and ideal orbit speed for smooth transition
        // This will gradually adjust in the update method
        this.currentOrbitSpeed = prevSpeed;
        this.targetOrbitSpeed = idealOrbitSpeed;
        this.orbitTransitionProgress = 0;
        this.inOrbitTransition = true;

        // Don't set velocity to 0 immediately - we'll transition it
        // This preserves momentum for a more realistic orbit entry

        // Check if this planet was already visited by orbit
        const wasOrbitVisited = planet.orbitVisited;

        // Add score for visit if this is first time (if game reference is available)
        if (!wasOrbitVisited && window.game) {
            window.game.addScoreForPlanetAction(planet, 'orbit');
        }

        // Use the orbit-specific visit method - call this AFTER the score attribution
        planet.visitByOrbit();

        // Check for bonus multiplier if planet is eligible
        // We now check recentlyDirectVisited instead of visited flag 
        if (window.game && typeof planet.isEligibleForBonus === 'function' && planet.isEligibleForBonus()) {
            window.game.addBonusScore(planet);
        }

        console.log(`Entering orbit: approach angle=${approachAngle}, tangential=${tangentialDirection}, clockwise=${clockwise}`);
    }

    exitOrbit() {
        if (this.orbiting && this.fuel > 0) {
            const fuelCost = CONSTANTS.BOOST_FUEL_CONSUMPTION * 0.75;

            // Check if there's enough fuel to exit orbit
            if (this.fuel < fuelCost) {
                console.log("Not enough fuel to exit orbit");
                return false;
            }

            // Start the visit timer for the planet we're leaving (if it has this method)
            if (typeof this.orbiting.startVisitTimer === 'function') {
                this.orbiting.startVisitTimer();
            }

            // Calculate orbital velocity components
            // Tangential velocity is perpendicular to the radius
            const orbitSpeed = Math.sqrt(CONSTANTS.GRAVITY * this.orbiting.radius *
                (this.orbitRadius / this.orbiting.radius)) * (1 + this.orbitSpeedBoost * 10); // Apply boost effect to exit velocity

            // Calculate tangential direction (perpendicular to radius)
            const tangentialDirection = this.orbitAngle + (this.orbitDirection === 1 ? Math.PI / 2 : -Math.PI / 2);

            // Calculate orbital velocity components
            const orbitalVX = Math.cos(tangentialDirection) * orbitSpeed;
            const orbitalVY = Math.sin(tangentialDirection) * orbitSpeed;

            // Calculate boost components in the direction ship is facing
            // Make boost more powerful for smaller planets (inverse scaling)
            const planetSizeFactor = this.orbiting.radius / 40; // Base factor on standard planet size
            let boostMultiplier;

            // Small planets (radius < 35) get the biggest boost
            if (this.orbiting.radius < 35) {
                boostMultiplier = 16.0; // Doubled from 8.0
            }
            // Medium planets (35-50) get a medium boost
            else if (this.orbiting.radius < 50) {
                boostMultiplier = 13.0; // Doubled from 6.5
            }
            // Large planets get the standard boost
            else {
                boostMultiplier = 10.0; // Doubled from 5.0
            }

            const boostPower = CONSTANTS.BOOST_POWER * boostMultiplier;
            const boostVX = Math.cos(this.rotation) * boostPower;
            const boostVY = Math.sin(this.rotation) * boostPower;

            // Set velocity as combination of orbital velocity and boost
            this.vx = orbitalVX + boostVX;
            this.vy = orbitalVY + boostVY;

            // Apply small fuel cost for the exit boost
            this.fuel -= fuelCost;

            // Add a small position offset in the direction of travel to ensure immediate escape
            const escapeDistance = this.orbiting.radius * 0.3;
            this.x += Math.cos(this.rotation) * escapeDistance;
            this.y += Math.sin(this.rotation) * escapeDistance;

            // Store reference to planet we're leaving for gravity reduction
            this.lastOrbitedPlanet = this.orbiting;
            this.exitingOrbit = true;
            this.orbitExitCounter = 0;

            // Reset orbit speed boost
            this.orbitSpeedBoost = 0;

            // Clear orbit reference
            this.orbiting = null;

            console.log("Exiting orbit with velocity:", Math.sqrt(this.vx * this.vx + this.vy * this.vy));
            return true;
        }
        return false;
    }

    startBoosting() {
        this.boosting = true;
    }

    stopBoosting() {
        this.boosting = false;
    }
} 