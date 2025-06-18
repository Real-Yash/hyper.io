// This file contains collision detection algorithms for players and food. 

class Collision {
    static checkPlayerFoodCollision(player, food) {
        const distance = Math.sqrt(
            Math.pow(player.x - food.x, 2) + Math.pow(player.y - food.y, 2)
        );
        return distance < (player.size + food.size) / 2;
    }

    static checkPlayerPlayerCollision(player1, player2) {
        const distance = Math.sqrt(
            Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2)
        );
        return distance < (player1.size + player2.size) / 2;
    }

    static checkFoodSpawnArea(food, mapWidth, mapHeight) {
        return (
            food.x >= 0 &&
            food.x <= mapWidth &&
            food.y >= 0 &&
            food.y <= mapHeight
        );
    }
}

module.exports = Collision;