const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database file path - for Lambda, use /tmp directory for writable access
const LEADERBOARD_FILE = path.join('/tmp', 'leaderboard.json');

// Initialize leaderboard file
async function initLeaderboard() {
    try {
        await fs.access(LEADERBOARD_FILE);
    } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]), 'utf8');
        console.log('Created new leaderboard file');
    }
}

// API Endpoints

// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Initialize the leaderboard file if it doesn't exist
        await initLeaderboard();

        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        res.status(500).json({ error: 'Failed to read leaderboard data' });
    }
});

// Add a new entry to the leaderboard
app.post('/api/leaderboard', async (req, res) => {
    try {
        // Initialize the leaderboard file if it doesn't exist
        await initLeaderboard();

        const { username, score, planetsVisited } = req.body;

        if (!username || typeof score !== 'number' || typeof planetsVisited !== 'number') {
            return res.status(400).json({ error: 'Invalid entry data' });
        }

        // Read current leaderboard
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        const leaderboard = JSON.parse(data);

        // Add new entry
        const newEntry = {
            username,
            score,
            planetsVisited,
            date: new Date().toISOString()
        };

        leaderboard.push(newEntry);

        // Sort by score (descending)
        leaderboard.sort((a, b) => b.score - a.score);

        // Keep only top 10 entries
        const topEntries = leaderboard.slice(0, 10);

        // Save back to file
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(topEntries), 'utf8');

        // Return rank
        const rank = topEntries.findIndex(entry =>
            entry.username === username &&
            entry.score === score &&
            entry.planetsVisited === planetsVisited
        ) + 1;

        res.json({ rank });
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
        res.status(500).json({ error: 'Failed to save leaderboard entry' });
    }
});

// Export the app for serverless
module.exports.handler = serverless(app); 