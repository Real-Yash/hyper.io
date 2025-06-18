// leaderboard.js

class Leaderboard {
    constructor() {
        this.scores = [];
    }

    updateScore(playerId, newScore) {
        const playerIndex = this.scores.findIndex(score => score.id === playerId);
        if (playerIndex !== -1) {
            this.scores[playerIndex].score = newScore;
        } else {
            this.scores.push({ id: playerId, score: newScore });
        }
        this.sortScores();
        this.render();
    }

    sortScores() {
        this.scores.sort((a, b) => b.score - a.score);
    }

    render() {
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        this.scores.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.textContent = `Player ${player.id}: ${player.score}`;
            leaderboardElement.appendChild(playerElement);
        });
    }
}

// Example usage
const leaderboard = new Leaderboard();
leaderboard.updateScore('player1', 100);
leaderboard.updateScore('player2', 150);