// friendship.js

class Friendship {
    constructor() {
        this.friendRequests = [];
        this.friends = [];
    }

    sendFriendRequest(playerId) {
        if (!this.friends.includes(playerId) && !this.friendRequests.includes(playerId)) {
            this.friendRequests.push(playerId);
            // Notify the player that a friend request has been sent
        }
    }

    acceptFriendRequest(playerId) {
        const requestIndex = this.friendRequests.indexOf(playerId);
        if (requestIndex !== -1) {
            this.friendRequests.splice(requestIndex, 1);
            this.friends.push(playerId);
            // Notify both players about the friendship
        }
    }

    declineFriendRequest(playerId) {
        const requestIndex = this.friendRequests.indexOf(playerId);
        if (requestIndex !== -1) {
            this.friendRequests.splice(requestIndex, 1);
            // Notify the player that the request has been declined
        }
    }

    breakFriendship(playerId) {
        const friendIndex = this.friends.indexOf(playerId);
        if (friendIndex !== -1) {
            this.friends.splice(friendIndex, 1);
            // Notify both players about the broken friendship
        }
    }

    isFriend(playerId) {
        return this.friends.includes(playerId);
    }

    getFriendRequests() {
        return this.friendRequests;
    }

    getFriends() {
        return this.friends;
    }
}