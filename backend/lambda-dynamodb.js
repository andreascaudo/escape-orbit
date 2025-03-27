const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

// Explicitly set the AWS region
AWS.config.update({ region: 'eu-central-1' });

const app = express();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'EscapeOrbitLeaderboard';

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.path}`, {
        query: req.query,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Add an OPTIONS handler for preflight requests
app.options('*', cors());

// API Endpoints

// Simple health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Leaderboard API is running' });
});

// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
    try {
        console.log('Fetching leaderboard data from DynamoDB...');
        const params = {
            TableName: TABLE_NAME
        };

        console.log('DynamoDB Scan params:', params);
        const data = await dynamoDB.scan(params).promise();
        console.log('DynamoDB Scan response:', JSON.stringify(data));

        // Sort by score (descending)
        const leaderboard = data.Items ? data.Items.sort((a, b) => b.score - a.score) : [];
        console.log('Returning leaderboard with entries:', leaderboard.length);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        res.status(500).json({ error: 'Failed to read leaderboard data', details: error.message });
    }
});

// Add a new entry to the leaderboard
app.post('/api/leaderboard', async (req, res) => {
    try {
        console.log('Received leaderboard entry:', req.body);
        const { username, score, planetsVisited } = req.body;

        if (!username) {
            console.error('Missing username');
            return res.status(400).json({ error: 'Username is required' });
        }

        // Ensure score and planetsVisited are numbers
        const numScore = Number(score);
        const numPlanetsVisited = Number(planetsVisited);

        if (isNaN(numScore) || isNaN(numPlanetsVisited)) {
            console.error('Invalid score or planetsVisited', { score, planetsVisited });
            return res.status(400).json({
                error: 'Invalid entry data - score and planetsVisited must be numbers',
                received: { score, planetsVisited }
            });
        }

        // Create a unique ID
        const id = `${username}-${Date.now()}`;
        console.log('Generated ID for entry:', id);

        // Add new entry
        const newEntry = {
            id,
            username,
            score: numScore,
            planetsVisited: numPlanetsVisited,
            date: new Date().toISOString()
        };
        console.log('New entry to save:', newEntry);

        const params = {
            TableName: TABLE_NAME,
            Item: newEntry
        };

        console.log('DynamoDB Put params:', params);
        await dynamoDB.put(params).promise();
        console.log('Successfully saved entry to DynamoDB');

        // Get all entries to determine rank
        const allParams = {
            TableName: TABLE_NAME
        };

        console.log('Fetching all entries to determine rank');
        const allData = await dynamoDB.scan(allParams).promise();
        console.log('Found entries:', allData.Items ? allData.Items.length : 0);

        // Sort by score (descending)
        const leaderboard = allData.Items ? allData.Items.sort((a, b) => b.score - a.score) : [];

        // Keep only top 10 entries and determine rank
        const topEntries = leaderboard.slice(0, 10);
        const rank = topEntries.findIndex(entry => entry.id === id) + 1;
        console.log('Entry rank:', rank);

        res.json({ rank, message: 'Score saved successfully' });
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
        res.status(500).json({ error: 'Failed to save leaderboard entry', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the app for serverless
module.exports.handler = serverless(app); 