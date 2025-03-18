// Game Constants
const CONSTANTS = {
    // Screen settings
    SCREEN_WIDTH: window.innerWidth,
    SCREEN_HEIGHT: window.innerHeight,

    // Physics settings
    GRAVITY: 0.05,
    ORBIT_SPEED: 0.02,
    BOOST_POWER: 0.2,

    // Fuel settings
    MAX_FUEL: 100,
    ORBIT_FUEL_CONSUMPTION: 0.05,
    BOOST_FUEL_CONSUMPTION: 0.5,
    PLANET_REFUEL_AMOUNT: 20,

    // Planet settings
    PLANETS: [
        { name: "Earth", radius: 50, color: 0x0077ff },
        { name: "Mars", radius: 40, color: 0xff4400 },
        { name: "Jupiter", radius: 70, color: 0xffaa22 },
        { name: "Saturn", radius: 60, color: 0xffdd44 },
        { name: "Uranus", radius: 45, color: 0x44aaff },
        { name: "Neptune", radius: 45, color: 0x4444ff },
        { name: "Exoplanet Alpha", radius: 55, color: 0x22ff66 },
        { name: "Exoplanet Beta", radius: 65, color: 0xff66dd }
    ],

    // Game settings
    STARTING_PLANET: 0,
    PLANET_DISTANCE_MULTIPLIER: 2.5
}; 