const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database file path
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the root directory
app.use(express.static('./'));

// Initialize leaderboard file if it doesn't exist
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

// Start server
initLeaderboard().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize leaderboard:', err);
}); 