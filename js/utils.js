// Utility functions

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Calculate angle between two points (in radians)
function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// Get a random number between min and max
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Save high score to local storage
function saveHighScore(score) {
    const currentHighScore = localStorage.getItem('escapeOrbitHighScore') || 0;
    if (score > currentHighScore) {
        localStorage.setItem('escapeOrbitHighScore', score);
        return true;
    }
    return false;
}

// Get high score from local storage
function getHighScore() {
    return localStorage.getItem('escapeOrbitHighScore') || 0;
} 