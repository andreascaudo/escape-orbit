# Escape Orbit

A 2D web-based space game where you control a spaceship orbiting planets. The goal is to escape orbits by burning fuel at the right moment to reach and colonize all planets in the solar system, avoiding hazards like meteors and black holes.

## Game Rules & Objectives

- **Main Goal**: Colonize all planets in the solar system
- **Scoring**: Based on fuel efficiency, time taken, and planets colonized
- **Failure Conditions**: Running out of fuel, colliding with a meteor, or being consumed by a black hole
- **Visual Indicators**: Planets show 🪂 when visited by orbit and 🏴‍☠️ when colonized

## Game Mechanics

- **Orbit**: Your spaceship automatically orbits planets when close enough. Orbit radius adapts to your approach distance!
- **Fuel Management**: Orbiting drains fuel slowly, boosting costs fuel
- **Trajectory Prediction**: See your predicted flight path when leaving orbit
- **Colonization**: Reach planets to colonize them and refuel
- **Hazards**: Avoid meteors and black holes
- **Fuel Pods**: Collect satellite fuel pods (🛰️) to replenish your fuel supply

## Advanced Physics

- **Adaptive Orbits**: Orbit radius matches your distance when you enter orbit, with minimum and maximum limits
- **Gravity Fields**: Planets exert gravitational pull based on their size
- **Momentum-Based Exits**: Exit boost power varies by planet size - smaller planets give bigger boosts!
- **Orbital Mechanics**: Direction of orbit adapts to your approach angle

## Controls

### Mobile
- **Tap**: Short tap to enter/exit orbit
- **Hold**: Long tap to boost

### Desktop
- **Mouse**: Click to enter/exit orbit, hold to boost
- **Space Bar**: Tap to enter/exit orbit, hold to boost
- **+/- Keys**: Zoom in/out (0 to reset zoom)
- **ESC Key**: Restart game after game over

## Technologies Used

- **HTML5 Canvas**: For rendering the game in the browser
- **JavaScript**: Core language for game logic and interactions
- **PixiJS**: Lightweight 2D rendering engine
- **Howler.js**: Audio library for sound effects
- **LocalStorage**: For saving high scores locally

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/escape-orbit.git
   cd escape-orbit
   ```

2. Open `index.html` in a web browser or set up a simple server:
   ```
   python -m http.server
   ```

3. Access the game at `http://localhost:8000`

## Development

This project uses a simple structure with all assets loaded from CDNs for minimal load time.

- `index.html`: Main entry point with canvas element and script links
- `js/main.js`: Initializes the game and handles setup
- `js/game.js`: Core game logic and state management
- `js/controls.js`: Handles player input (keyboard and touch)
- `js/objects/`: Contains game object classes (planet, spaceship, hazard)
- `PROGRESS.md`: Documents current development status and next steps

## License

MIT 