# Escape Orbit

A 2D web-based space game where you control a spaceship orbiting planets. The goal is to escape orbits by burning fuel at the right moment to reach and colonize the next planet, avoiding hazards like meteors and black holes.

## Game Mechanics

- **Orbit**: Your spaceship automatically orbits planets when close enough
- **Fuel Management**: Orbiting drains fuel slowly, boosting costs fuel
- **Colonization**: Reach planets to colonize them and refuel
- **Hazards**: Avoid meteors and black holes
- **High Score**: Try to colonize all planets with the highest score

## Controls

### Mobile
- **Virtual Joystick**: Control ship direction when not in orbit
- **Boost Button**: Burn fuel to propel the ship
- **Double Tap**: Exit orbit and launch away from a planet

### Desktop
- **Arrow Keys/WASD**: Rotate ship when not in orbit
- **Up Arrow/W**: Burn fuel to propel the ship
- **Space Bar**: Exit orbit and launch away from a planet

## Technologies Used

- **HTML5 Canvas**: For rendering the game in the browser
- **JavaScript**: Core language for game logic and interactions
- **PixiJS**: Lightweight 2D rendering engine
- **NippleJS**: Virtual joystick library for mobile controls
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

## License

MIT 