# Escape Orbit

A 2D web-based space game where you control a spaceship orbiting planets. The goal is to visit all planets in the solar system by entering orbit around them, while managing your fuel and avoiding hazards like meteors, black holes, and getting too close to the sun.

## Game Rules & Objectives

- **Main Goal**: Visit all planets in the solar system by entering orbit around them
- **Scoring System**:
  - 20 points for entering orbit around a planet
  - 50 points for flying directly through a planet
  - 50 BONUS points for entering orbit within 5 seconds after flying through a planet
  - 1000 COSMIC ACHIEVEMENT points for visiting all planets
- **Failure Conditions**: Running out of fuel, colliding with a meteor, being consumed by a black hole, or getting incinerated by the sun
- **Visual Indicators**: Planets show 🪂 when visited by orbit

## Game Mechanics

- **Orbit**: Your spaceship automatically orbits planets when close enough. Orbit radius adapts to your approach distance!
- **Fuel Management**: Orbiting drains fuel slowly, boosting costs fuel
- **Trajectory Prediction**: See your predicted flight path when leaving orbit
- **Planet Visits**: Fly through planets for points and fuel, or enter orbit for strategic advantages
- **Hazards**: Avoid meteors, black holes, and the sun's intense radiation
- **Fuel Pods**: Collect satellite fuel pods (🛰️) to replenish your fuel supply
- **Bonus Scoring**: Get extra points with strategic maneuvers like direct visits followed by orbit
- **Leaderboard**: Compete for high scores with other players, tracking your score and planets visited
- **Custom Username**: Enter your pilot callsign before starting the game

## Advanced Physics

- **Adaptive Orbits**: Orbit radius matches your distance when you enter orbit, with minimum and maximum limits
- **Gravity Fields**: Planets exert gravitational pull based on their size
- **Momentum-Based Exits**: Exit boost power varies by planet size - smaller planets give bigger boosts!
- **Orbital Mechanics**: Direction of orbit adapts to your approach angle
- **Solar Radiation**: Getting too close to the sun will damage your ship and eventually destroy it

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
- **LocalStorage**: For saving high scores and leaderboard data

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
- `js/leaderboard.js`: Manages the leaderboard functionality
- `js/username-screen.js`: Handles the username input screen
- `js/objects/`: Contains game object classes (planet, spaceship, hazard)
- `PROGRESS.md`: Documents current development status and next steps

## License

MIT 