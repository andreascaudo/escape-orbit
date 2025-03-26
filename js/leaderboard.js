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

// Save a new leaderboard entry
function saveLeaderboardEntry(username, score, planetsVisited) {
    const leaderboard = getLeaderboard();
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
function getLeaderboard() {
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
}

// Format the leaderboard as HTML
function formatLeaderboardHtml() {
    const leaderboard = getLeaderboard();

    if (leaderboard.length === 0) {
        return '<p>No scores yet. You could be the first!</p>';
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

    return html;
}

// Get the player's personal best
function getPersonalBest(username) {
    const leaderboard = getLeaderboard();
    const personalEntries = leaderboard.filter(entry => entry.username === username);

    if (personalEntries.length === 0) {
        return null;
    }

    // Sort by score (descending)
    personalEntries.sort((a, b) => b.score - a.score);

    return personalEntries[0];
} 