// This file handles the friendship system for the game

class Friendship {
    constructor() {
        // Static methods for managing friendships across all players
    }

    // Send a friend request to another player
    sendFriendRequest(senderId, receiverId, gameState, io) {
        // Check if both players exist
        if (!gameState.players.has(senderId) || !gameState.players.has(receiverId)) {
            return false;
        }

        // Check if they're already friends
        if (gameState.friendships.has(senderId) && 
            gameState.friendships.get(senderId).has(receiverId)) {
            return false;
        }

        // Check if request already exists
        if (gameState.friendRequests.has(receiverId) && 
            gameState.friendRequests.get(receiverId).has(senderId)) {
            return false;
        }

        // Add friend request
        if (!gameState.friendRequests.has(receiverId)) {
            gameState.friendRequests.set(receiverId, new Set());
        }
        gameState.friendRequests.get(receiverId).add(senderId);

        // Notify the receiver
        const senderPlayer = gameState.players.get(senderId);
        io.to(receiverId).emit('friendRequest', {
            senderId: senderId,
            senderName: senderPlayer.name,
            message: `${senderPlayer.name} wants to be your friend!`
        });

        // Notify the sender
        io.to(senderId).emit('friendRequestSent', {
            receiverId: receiverId,
            receiverName: gameState.players.get(receiverId).name
        });

        return true;
    }

    // Respond to a friend request
    respondToFriendRequest(receiverId, senderId, accept, gameState, io) {
        // Check if the request exists
        if (!gameState.friendRequests.has(receiverId) || 
            !gameState.friendRequests.get(receiverId).has(senderId)) {
            return false;
        }

        // Remove the request
        gameState.friendRequests.get(receiverId).delete(senderId);

        if (accept) {
            // Add both players as friends
            if (!gameState.friendships.has(receiverId)) {
                gameState.friendships.set(receiverId, new Set());
            }
            if (!gameState.friendships.has(senderId)) {
                gameState.friendships.set(senderId, new Set());
            }

            gameState.friendships.get(receiverId).add(senderId);
            gameState.friendships.get(senderId).add(receiverId);

            // Notify both players
            const receiverPlayer = gameState.players.get(receiverId);
            const senderPlayer = gameState.players.get(senderId);

            io.to(receiverId).emit('friendshipEstablished', {
                friendId: senderId,
                friendName: senderPlayer.name,
                message: `You are now friends with ${senderPlayer.name}!`
            });

            io.to(senderId).emit('friendshipEstablished', {
                friendId: receiverId,
                friendName: receiverPlayer.name,
                message: `${receiverPlayer.name} accepted your friend request!`
            });
        } else {
            // Notify sender that request was declined
            const receiverPlayer = gameState.players.get(receiverId);
            io.to(senderId).emit('friendRequestDeclined', {
                receiverId: receiverId,
                receiverName: receiverPlayer.name,
                message: `${receiverPlayer.name} declined your friend request.`
            });
        }

        return true;
    }

    // Break friendship between two players
    breakFriendship(playerId, friendId, gameState, io) {
        // Check if friendship exists
        if (!gameState.friendships.has(playerId) || 
            !gameState.friendships.get(playerId).has(friendId)) {
            return false;
        }

        // Remove friendship from both sides
        gameState.friendships.get(playerId).delete(friendId);
        if (gameState.friendships.has(friendId)) {
            gameState.friendships.get(friendId).delete(playerId);
        }

        // Notify both players
        const player = gameState.players.get(playerId);
        const friend = gameState.players.get(friendId);

        if (player && friend) {
            io.to(playerId).emit('friendshipBroken', {
                friendId: friendId,
                friendName: friend.name,
                message: `You are no longer friends with ${friend.name}.`
            });

            io.to(friendId).emit('friendshipBroken', {
                friendId: playerId,
                friendName: player.name,
                message: `${player.name} ended the friendship.`
            });
        }

        return true;
    }

    // Check if two players are friends
    static areFriends(playerId1, playerId2, gameState) {
        return gameState.friendships.has(playerId1) && 
               gameState.friendships.get(playerId1).has(playerId2);
    }

    // Get all friends of a player
    static getFriends(playerId, gameState) {
        if (!gameState.friendships.has(playerId)) {
            return [];
        }
        return Array.from(gameState.friendships.get(playerId));
    }

    // Get all pending friend requests for a player
    static getPendingRequests(playerId, gameState) {
        if (!gameState.friendRequests.has(playerId)) {
            return [];
        }
        return Array.from(gameState.friendRequests.get(playerId));
    }
}

module.exports = Friendship;