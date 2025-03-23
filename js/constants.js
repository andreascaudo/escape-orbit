// Game Constants
const CONSTANTS = {
    // Screen settings
    SCREEN_WIDTH: window.innerWidth,
    SCREEN_HEIGHT: window.innerHeight,

    // Physics settings
    GRAVITY: 0.05,          // Moderate base gravity - will be multiplied by planet size factor
    ORBIT_SPEED: 0.012,     // Kept the same
    BOOST_POWER: 0.18,      // Kept the same

    // Fuel settings
    MAX_FUEL: 10000,
    ORBIT_FUEL_CONSUMPTION: 0.015,  // Reduced by 50% (from 0.03)
    BOOST_FUEL_CONSUMPTION: 0.2,    // Reduced by 50% (from 0.4)
    PLANET_REFUEL_AMOUNT: 30,       // Kept the same to maintain game balance

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
            orbitRadius: 450,
            orbitSpeed: 0.005,
            orbitAngle: 0
        },
        {
            name: "Venus",
            radius: 35,
            color: 0xDDAA77,
            orbitRadius: 675,
            orbitSpeed: 0.008,
            orbitAngle: 1.2
        },
        {
            name: "Earth",
            radius: 40,
            color: 0x5a8b5d,
            orbitRadius: 900,
            orbitSpeed: 0.005,
            orbitAngle: 2.1
        },
        {
            name: "Mars",
            radius: 30,
            color: 0xff4400,
            orbitRadius: 1125,
            orbitSpeed: 0.004,
            orbitAngle: 0.7
        },
        {
            name: "Jupiter",
            radius: 70,
            color: 0xffaa22,
            orbitRadius: 1400,
            orbitSpeed: 0.003,
            orbitAngle: 3.5
        },
        {
            name: "Saturn",
            radius: 60,
            color: 0xffdd44,
            orbitRadius: 1700,
            orbitSpeed: 0.002,
            orbitAngle: 4.2
        },
        {
            name: "Uranus",
            radius: 45,
            color: 0x44aaff,
            orbitRadius: 1925,
            orbitSpeed: 0.002,
            orbitAngle: 5.6
        },
        {
            name: "Neptune",
            radius: 45,
            color: 0x4444ff,
            orbitRadius: 2150,
            orbitSpeed: 0.002,
            orbitAngle: 0.3
        }
    ],

    // Game settings
    STARTING_PLANET: 2, // Earth
    PLANET_DISTANCE_MULTIPLIER: 1.5
}; 