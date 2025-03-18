// Game Constants
const CONSTANTS = {
    // Screen settings
    SCREEN_WIDTH: window.innerWidth,
    SCREEN_HEIGHT: window.innerHeight,

    // Physics settings
    GRAVITY: 0.08,          // Increased gravity strength
    ORBIT_SPEED: 0.015,     // Slightly slower orbit for more control
    BOOST_POWER: 0.15,      // Reduced boost power for more strategic gameplay

    // Fuel settings
    MAX_FUEL: 100,
    ORBIT_FUEL_CONSUMPTION: 0.03,  // Reduced to allow longer orbiting
    BOOST_FUEL_CONSUMPTION: 0.4,   // Slightly reduced but still significant
    PLANET_REFUEL_AMOUNT: 25,      // Increased refuel amount for better progression

    // Solar System settings
    SUN: {
        name: "Sun",
        radius: 100,
        color: 0xFFDD00
    },

    // Planet settings
    PLANETS: [
        {
            name: "Mercury",
            radius: 20,
            color: 0xAA8866,
            orbitRadius: 300,
            orbitSpeed: 0.01,
            orbitAngle: 0
        },
        {
            name: "Venus",
            radius: 35,
            color: 0xDDAA77,
            orbitRadius: 450,
            orbitSpeed: 0.008,
            orbitAngle: 1.2
        },
        {
            name: "Earth",
            radius: 40,
            color: 0x0077ff,
            orbitRadius: 600,
            orbitSpeed: 0.005,
            orbitAngle: 2.1
        },
        {
            name: "Mars",
            radius: 30,
            color: 0xff4400,
            orbitRadius: 750,
            orbitSpeed: 0.004,
            orbitAngle: 0.7
        },
        {
            name: "Jupiter",
            radius: 70,
            color: 0xffaa22,
            orbitRadius: 975,
            orbitSpeed: 0.002,
            orbitAngle: 3.5
        },
        {
            name: "Saturn",
            radius: 60,
            color: 0xffdd44,
            orbitRadius: 1200,
            orbitSpeed: 0.0015,
            orbitAngle: 4.2
        },
        {
            name: "Uranus",
            radius: 45,
            color: 0x44aaff,
            orbitRadius: 1350,
            orbitSpeed: 0.001,
            orbitAngle: 5.6
        },
        {
            name: "Neptune",
            radius: 45,
            color: 0x4444ff,
            orbitRadius: 1500,
            orbitSpeed: 0.0008,
            orbitAngle: 0.3
        }
    ],

    // Game settings
    STARTING_PLANET: 2, // Earth
    PLANET_DISTANCE_MULTIPLIER: 1.5
}; 