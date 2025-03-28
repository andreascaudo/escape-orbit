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
- **AWS Cloud**: Deployment and hosting infrastructure
  - **S3**: Static website hosting for frontend
  - **CloudFront**: CDN for global content delivery
  - **Lambda**: Serverless functions for backend API
  - **API Gateway**: API management
  - **DynamoDB**: NoSQL database for leaderboard storage

## Local Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/escape-orbit.git
   cd escape-orbit
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the local server:
   ```
   npm start
   ```

4. Access the game at `http://localhost:3000`

## Online Leaderboard System

The game includes an online leaderboard system that allows players' scores to be shared across different devices. Only scores greater than zero are submitted to the online leaderboard.

### Local Development
- The leaderboard server can run locally on Node.js with Express
- For local testing, scores are stored in a JSON file on the server
- If the server is unavailable, the game falls back to localStorage for score tracking

### AWS Production Deployment
- The production version uses AWS serverless architecture:
  - Frontend static files hosted on S3 and served through CloudFront
  - Backend API powered by Lambda functions and API Gateway
  - Leaderboard data stored in DynamoDB
  - For detailed AWS deployment instructions, see [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

## Project Structure

- `frontend/`: Contains all client-side code
  - `js/`: JavaScript game files
  - `css/`: Stylesheets
  - `index.html`: Main game page
- `backend/`: Contains all server-side code
  - `lambda-dynamodb.js`: Lambda function handler for DynamoDB
  - `serverless.yml`: Configuration for serverless deployment
- `server.js`: Express server for local development
- `FRONTEND_DEPLOYMENT_GUIDE.md`: Instructions for updating the frontend
- `AWS_DEPLOYMENT_GUIDE.md`: Comprehensive AWS deployment guide

## License

MIT 