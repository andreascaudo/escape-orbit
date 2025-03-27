// Leaderboard functionality for Escape Orbit

// Structure for a leaderboard entry
class LeaderboardEntry {
    constructor(username, score, planetsVisited, date = new Date()) {
        this.username = username;
        this.score = score;
        this.planetsVisited = planetsVisited;
        this.date = date;
    }
}

// API URL - adjust this to match your deployment environment
const API_URL = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000/api/leaderboard'
    : 'https://cjo0bfidl9.execute-api.eu-central-1.amazonaws.com/prod/api/leaderboard';

// Get username from localStorage or generate a random one
function getUsername() {
    return localStorage.getItem('escapeOrbitUsername') || generateRandomUsername();
}

// Save username to localStorage
function saveUsername(username) {
    localStorage.setItem('escapeOrbitUsername', username);
}

// Generate a random username if none is provided
function generateRandomUsername() {
    const adjectives = ['Cosmic', 'Solar', 'Stellar', 'Galactic', 'Orbital', 'Lunar', 'Astral', 'Celestial'];
    const nouns = ['Pilot', 'Explorer', 'Voyager', 'Navigator', 'Captain', 'Commander', 'Astronaut', 'Pioneer'];
    const randomNum = Math.floor(Math.random() * 1000);

    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${randomAdj}${randomNoun}${randomNum}`;
}

// Cache for leaderboard data
let leaderboardCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Save a new leaderboard entry
async function saveLeaderboardEntry(username, score, planetsVisited) {
    try {
        console.log('Attempting to save score to API:', { username, score, planetsVisited });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                score,
                planetsVisited
            })
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to save leaderboard entry: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('Successfully saved to API, response:', data);

        // Invalidate cache
        leaderboardCache = null;

        // Return the rank (note: rank might be 0 if not in top 10, but that's valid)
        return data.rank;
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
        console.warn('Falling back to localStorage for score saving');

        // Fallback to local storage if server is unavailable
        return saveLocalLeaderboardEntry(username, score, planetsVisited);
    }
}

// Fallback method that uses localStorage (used when server is unavailable)
function saveLocalLeaderboardEntry(username, score, planetsVisited) {
    const leaderboard = getLocalLeaderboard();
    const newEntry = new LeaderboardEntry(username, score, planetsVisited);

    leaderboard.push(newEntry);

    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top 10 entries
    const topEntries = leaderboard.slice(0, 10);

    localStorage.setItem('escapeOrbitLeaderboard', JSON.stringify(topEntries));

    // Return the rank of the new entry (1-indexed)
    return topEntries.findIndex(entry =>
        entry.username === username &&
        entry.score === score &&
        entry.planetsVisited === planetsVisited
    ) + 1;
}

// Get the current leaderboard
async function getLeaderboard() {
    const now = Date.now();

    // Return cached data if it's still valid
    if (leaderboardCache && (now - lastFetchTime < CACHE_DURATION)) {
        console.log('Returning cached leaderboard data');
        return leaderboardCache;
    }

    try {
        console.log('Fetching leaderboard from API:', API_URL);
        const response = await fetch(API_URL);
        console.log('API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch leaderboard data: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('API leaderboard data received:', data);

        // Update cache
        leaderboardCache = data;
        lastFetchTime = now;

        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        console.warn('Falling back to localStorage for leaderboard data');

        // Fallback to local storage if server is unavailable
        return getLocalLeaderboard();
    }
}

// Get leaderboard from local storage (fallback method)
function getLocalLeaderboard() {
    const leaderboardJson = localStorage.getItem('escapeOrbitLeaderboard');
    if (!leaderboardJson) {
        return [];
    }

    try {
        return JSON.parse(leaderboardJson);
    } catch (e) {
        console.error('Error parsing leaderboard data:', e);
        return [];
    }
}

// Clear the leaderboard (for testing purposes)
function clearLeaderboard() {
    localStorage.removeItem('escapeOrbitLeaderboard');
    leaderboardCache = null;
}

// Format the leaderboard as HTML
function formatLeaderboardHtml() {
    // We'll get the leaderboard asynchronously and update the DOM
    const loadingHtml = '<p>Loading leaderboard data...</p>';

    // Start fetching the data
    getLeaderboard().then(leaderboard => {
        const leaderboardElement = document.querySelector('.leaderboard-container');
        if (!leaderboardElement) return;

        if (leaderboard.length === 0) {
            leaderboardElement.innerHTML = '<p>No scores yet. You could be the first!</p>';
            return;
        }

        let html = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Planets</th>
                    </tr>
                </thead>
                <tbody>
        `;

        leaderboard.forEach((entry, index) => {
            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString();

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.username}</td>
                    <td>${entry.score}</td>
                    <td>${entry.planetsVisited}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        leaderboardElement.innerHTML = html;
    });

    return loadingHtml;
}

// Get the player's personal best
async function getPersonalBest(username) {
    const leaderboard = await getLeaderboard();
    const personalEntries = leaderboard.filter(entry => entry.username === username);

    if (personalEntries.length === 0) {
        return null;
    }

    // Sort by score (descending)
    personalEntries.sort((a, b) => b.score - a.score);

    return personalEntries[0];
} 