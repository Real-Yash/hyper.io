// This file handles the UI for managing friendships, including sending and receiving friend requests.

class FriendshipUI {
    constructor(socketClient) {
        this.socket = socketClient;
        this.friendRequests = new Map(); // senderId -> {senderId, senderName}
        this.friendsList = new Map(); // friendId -> {friendId, friendName}
        
        this.initUI();
        this.setupSocketEvents();
    }

    initUI() {
        // Initialize friendship UI elements
        this.renderFriendRequests();
        this.renderFriendsList();
    }

    setupSocketEvents() {
        this.socket.on('friendRequest', (data) => {
            this.friendRequests.set(data.senderId, data);
            this.renderFriendRequests();
            this.showNotification(data.message, 'info');
        });

        this.socket.on('friendRequestSent', (data) => {
            this.showNotification(`Friend request sent to ${data.receiverName}`, 'success');
        });

        this.socket.on('friendshipEstablished', (data) => {
            this.friendsList.set(data.friendId, data);
            this.friendRequests.delete(data.friendId); // Remove any pending request
            this.renderFriendsList();
            this.renderFriendRequests();
            this.showNotification(data.message, 'success');
        });

        this.socket.on('friendRequestDeclined', (data) => {
            this.showNotification(data.message, 'error');
        });

        this.socket.on('friendshipBroken', (data) => {
            this.friendsList.delete(data.friendId);
            this.renderFriendsList();
            this.showNotification(data.message, 'info');
        });
    }

    renderFriendRequests() {
        const requestContainer = document.getElementById('friend-requests');
        if (!requestContainer) return;
        
        requestContainer.innerHTML = '';

        if (this.friendRequests.size === 0) {
            return;
        }

        const header = document.createElement('h4');
        header.textContent = 'Friend Requests';
        header.style.color = '#667eea';
        header.style.marginBottom = '10px';
        requestContainer.appendChild(header);

        this.friendRequests.forEach((request, senderId) => {
            const requestElement = document.createElement('div');
            requestElement.className = 'friend-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'friend-name';
            nameSpan.textContent = request.senderName;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'friend-actions';
            
            const acceptButton = document.createElement('button');
            acceptButton.className = 'friend-button accept-btn';
            acceptButton.textContent = '✓';
            acceptButton.title = 'Accept';
            acceptButton.onclick = () => this.acceptFriendRequest(senderId);
            
            const declineButton = document.createElement('button');
            declineButton.className = 'friend-button decline-btn';
            declineButton.textContent = '✗';
            declineButton.title = 'Decline';
            declineButton.onclick = () => this.declineFriendRequest(senderId);
            
            actionsDiv.appendChild(acceptButton);
            actionsDiv.appendChild(declineButton);
            
            requestElement.appendChild(nameSpan);
            requestElement.appendChild(actionsDiv);
            requestContainer.appendChild(requestElement);
        });
    }

    renderFriendsList() {
        const friendsContainer = document.getElementById('friends-list');
        if (!friendsContainer) return;
        
        friendsContainer.innerHTML = '';

        if (this.friendsList.size === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No friends yet';
            emptyMessage.style.color = '#666';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '10px';
            friendsContainer.appendChild(emptyMessage);
            return;
        }

        this.friendsList.forEach((friend, friendId) => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'friend-name';
            nameSpan.textContent = friend.friendName;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'friend-actions';
            
            const breakButton = document.createElement('button');
            breakButton.className = 'friend-button break-btn';
            breakButton.textContent = '💔';
            breakButton.title = 'Break Friendship';
            breakButton.onclick = () => this.breakFriendship(friendId);
            
            actionsDiv.appendChild(breakButton);
            
            friendElement.appendChild(nameSpan);
            friendElement.appendChild(actionsDiv);
            friendsContainer.appendChild(friendElement);
        });
    }

    acceptFriendRequest(senderId) {
        this.socket.respondToFriendRequest(senderId, true);
        this.friendRequests.delete(senderId);
        this.renderFriendRequests();
    }

    declineFriendRequest(senderId) {
        this.socket.respondToFriendRequest(senderId, false);
        this.friendRequests.delete(senderId);
        this.renderFriendRequests();
    }

    breakFriendship(friendId) {
        if (confirm(`Are you sure you want to break friendship with ${this.friendsList.get(friendId).friendName}?`)) {
            this.socket.breakFriendship(friendId);
        }
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notifications.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

export default FriendshipUI;