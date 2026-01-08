const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');

// Store active connections: userId -> socketId
const activeUsers = new Map();

// Store typing status: roomId/userId -> Set of userIds
const typingUsers = new Map();

const setupSocketHandlers = (io) => {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✓ User connected: ${socket.username} (${socket.userId})`);

    // Store active user
    activeUsers.set(socket.userId, socket.id);

    // Update user online status
    await User.updateOnlineStatus(socket.userId, true);

    // Notify all users that this user is online
    io.emit('user_status', {
      userId: socket.userId,
      username: socket.username,
      isOnline: true
    });

    // Send list of online users to the connected client
    const onlineUserIds = Array.from(activeUsers.keys());
    socket.emit('online_users', onlineUserIds);

    // Join user's rooms
    const userRooms = await Room.getUserRooms(socket.userId);
    userRooms.forEach(room => {
      socket.join(`room_${room.id}`);
    });

    // Handle joining a room
    socket.on('join_room', async (roomId) => {
      try {
        const isInRoom = await Room.isUserInRoom(roomId, socket.userId);
        if (isInRoom) {
          socket.join(`room_${roomId}`);
          socket.to(`room_${roomId}`).emit('user_joined_room', {
            roomId,
            userId: socket.userId,
            username: socket.username
          });
        }
      } catch (error) {
        console.error('Join room error:', error);
      }
    });

    // Handle leaving a room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      socket.to(`room_${roomId}`).emit('user_left_room', {
        roomId,
        userId: socket.userId,
        username: socket.username
      });
    });

    // Handle sending message to room
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, messageType = 'text', fileUrl = null } = data;

        // Verify user is in room
        const isInRoom = await Room.isUserInRoom(roomId, socket.userId);
        if (!isInRoom) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }

        // Save message to database
        const messageId = await Message.create(
          socket.userId,
          content,
          messageType,
          roomId,
          null,
          fileUrl
        );

        // Get full message with user info
        const message = await Message.findById(messageId);

        // Broadcast to room
        io.to(`room_${roomId}`).emit('new_message', {
          ...message,
          roomId
        });

        // Clear typing indicator
        const typingKey = `room_${roomId}`;
        if (typingUsers.has(typingKey)) {
          typingUsers.get(typingKey).delete(socket.userId);
          io.to(`room_${roomId}`).emit('typing_update', {
            roomId,
            users: Array.from(typingUsers.get(typingKey))
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle private message
    socket.on('private_message', async (data) => {
      try {
        const { receiverId, content, messageType = 'text', fileUrl = null } = data;

        // Save message to database
        const messageId = await Message.create(
          socket.userId,
          content,
          messageType,
          null,
          receiverId,
          fileUrl
        );

        // Get full message with user info
        const message = await Message.findById(messageId);

        // Send to receiver if online
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_private_message', message);
        }

        // Send confirmation to sender
        socket.emit('new_private_message', message);

        // Clear typing indicator
        const typingKey = `private_${socket.userId}_${receiverId}`;
        if (typingUsers.has(typingKey)) {
          typingUsers.get(typingKey).delete(socket.userId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('typing_update', {
              userId: socket.userId,
              isTyping: false
            });
          }
        }
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    // Handle typing indicator for room
    socket.on('typing_start', async (data) => {
      const { roomId } = data;
      const typingKey = `room_${roomId}`;

      if (!typingUsers.has(typingKey)) {
        typingUsers.set(typingKey, new Set());
      }
      typingUsers.get(typingKey).add(socket.userId);

      socket.to(`room_${roomId}`).emit('typing_update', {
        roomId,
        userId: socket.userId,
        username: socket.username,
        isTyping: true
      });
    });

    socket.on('typing_stop', async (data) => {
      const { roomId } = data;
      const typingKey = `room_${roomId}`;

      if (typingUsers.has(typingKey)) {
        typingUsers.get(typingKey).delete(socket.userId);
        socket.to(`room_${roomId}`).emit('typing_update', {
          roomId,
          userId: socket.userId,
          username: socket.username,
          isTyping: false
        });
      }
    });

    // Handle typing indicator for private chat
    socket.on('typing_start_private', (data) => {
      const { receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing_update_private', {
          userId: socket.userId,
          username: socket.username,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop_private', (data) => {
      const { receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing_update_private', {
          userId: socket.userId,
          username: socket.username,
          isTyping: false
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`✗ User disconnected: ${socket.username} (${socket.userId})`);

      // Remove from active users
      activeUsers.delete(socket.userId);

      // Update user online status
      await User.updateOnlineStatus(socket.userId, false);

      // Notify all users that this user is offline
      io.emit('user_status', {
        userId: socket.userId,
        username: socket.username,
        isOnline: false
      });

      // Clear all typing indicators for this user
      typingUsers.forEach((users, key) => {
        users.delete(socket.userId);
      });
    });
  });
};

module.exports = setupSocketHandlers;
