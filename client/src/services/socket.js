import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✓ Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('✗ Disconnected from socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room events
  joinRoom(roomId) {
    this.socket?.emit('join_room', roomId);
  }

  leaveRoom(roomId) {
    this.socket?.emit('leave_room', roomId);
  }

  sendMessage(data) {
    this.socket?.emit('send_message', data);
  }

  onNewMessage(callback) {
    this.socket?.on('new_message', callback);
  }

  offNewMessage() {
    this.socket?.off('new_message');
  }

  // Private messaging
  sendPrivateMessage(data) {
    this.socket?.emit('private_message', data);
  }

  onPrivateMessage(callback) {
    this.socket?.on('new_private_message', callback);
  }

  offPrivateMessage() {
    this.socket?.off('new_private_message');
  }

  // Typing indicators
  startTyping(data) {
    this.socket?.emit('typing_start', data);
  }

  stopTyping(data) {
    this.socket?.emit('typing_stop', data);
  }

  onTypingUpdate(callback) {
    this.socket?.on('typing_update', callback);
  }

  offTypingUpdate() {
    this.socket?.off('typing_update');
  }

  startTypingPrivate(data) {
    this.socket?.emit('typing_start_private', data);
  }

  stopTypingPrivate(data) {
    this.socket?.emit('typing_stop_private', data);
  }

  onTypingUpdatePrivate(callback) {
    this.socket?.on('typing_update_private', callback);
  }

  offTypingUpdatePrivate() {
    this.socket?.off('typing_update_private');
  }

  // User status
  onUserStatus(callback) {
    this.socket?.on('user_status', callback);
  }

  offUserStatus() {
    this.socket?.off('user_status');
  }

  onOnlineUsers(callback) {
    this.socket?.on('online_users', callback);
  }

  offOnlineUsers() {
    this.socket?.off('online_users');
  }

  // Room join/leave notifications
  onUserJoinedRoom(callback) {
    this.socket?.on('user_joined_room', callback);
  }

  offUserJoinedRoom() {
    this.socket?.off('user_joined_room');
  }

  onUserLeftRoom(callback) {
    this.socket?.on('user_left_room', callback);
  }

  offUserLeftRoom() {
    this.socket?.off('user_left_room');
  }

  // Error handling
  onError(callback) {
    this.socket?.on('error', callback);
  }

  offError() {
    this.socket?.off('error');
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
