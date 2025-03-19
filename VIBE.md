# Escape Orbit - Input Tracking

This file tracks all input prompts used during the development of the Escape Orbit game.

## Initial Project Setup

```
Initializing a Git repository for a web-based game called "Escape Orbit". The game must be accessible on the web without login/signup, and work on mobile browsers (e.g., iPhone) with no loading screens or heavy downloads.

### Project Overview
"Escape Orbit" is a 2D game where the player controls a spaceship orbiting Earth. The goal is to escape orbits by burning fuel at the right moment to reach and colonize the next planet, avoiding hazards like meteors and black holes. Fuel management is key: orbiting drains fuel slowly, escaping costs fuel, and colonizing planets refuels slightly. The game progresses through planets in a solar system and beyond, with a high-score system.

### Technologies
- **HTML5 Canvas**: For rendering the game in the browser.
- **JavaScript**: Core language for game logic and interactions.
- **PixiJS**: Lightweight 2D rendering engine for sprites, graphics, and animations.
- **NippleJS**: Virtual joystick library for mobile controls.
- **Howler.js**: Audio library for sound effects.
- **LocalStorage**: For saving high scores locally.
- **GitHub**: Hosting the code.

### Task
Initialize a Git repository with the basic structure and files needed to start development. Include:
1. A project folder structure with necessary files.
2. An `index.html` file with a canvas element and script links to the technologies (use CDNs for simplicity).
3. A `main.js` file with initial PixiJS setup (create an application, stage, and a test circle for Earth).
4. A `README.md` file with a brief project description and setup instructions.
5. A `.gitignore` file to exclude unnecessary files (e.g., node_modules).
6. A `VIBE.md` where you keep track of all my imput prompt. 

### Instructions
- Use CDNs for PixiJS, NippleJS, and Howler.js to avoid npm dependencies and ensure instant loading.
- Keep the setup lightweight and minimal to meet the "no loading screens" requirement.
- Comment the code to explain key sections for future development.
- Create a conda enviroment called escape-orbit and activate it
- Initialize the repo as if it's ready for GitHub Pages deployment (e.g., all files in the root).
```

## Gameplay Enhancement Tasks

### Trajectory Line Implementation

```
Update the Game class to add the trajectory line of the spaceship to the game container
```

### Orbit Exit Help Text

```
Add a helpful UI element to show instructions for exiting orbit
```

### Visual Improvements and Physics Tuning

```
Reduce the opacity of the faded region and make the planet orbit over the sun larger, the fade region should not overlap. Do not modify the orbit of the spaceshift around the planet
```

```
Reduce the orbit of the spacehift around the planet
```

```
- Increas the radius of the planet orbit over the sun
- reduce the opacity of the faded area
```

```
Can you match the spaceshift orbit radius around the planet with the radius the spaceshift is when I enter the orbit (when I press space)
```

```
Increase the push when leaving orbit
```

```
- Increase the speed bust when living the orbit planet by x2
```

```
Make the bust of speed when leaving a planet proportional to the size of the planet
```

```
Can you increase this bump in speed especially for small and medium size planet?
```

```
Increase the boot multiplier by a factor of 2
```

```
Set the default spaceship orbit on the planet larger then it is know, also set a limit there is higher then now
```

## Future Development Tasks

```
We are done for today:
- Write a file that summarize what we have done and the next step, put enough information for the next LLM agest to pick up from there
- Update VIBE.md
- Update README.md
```

## Session - Further Improvements

```
Update all the READMEs, and for the next step to implement add:
- removing the space text
- add game info and rules at the begenning 
- black hole spawn randomly but not on planets orbit
- Improve the communication about the goal of the game, like number of planets to visit left and think on how this can also evolve in multiple levels

at the end commit to github
``` 