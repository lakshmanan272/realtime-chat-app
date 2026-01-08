const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const authenticateToken = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all public rooms
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.getPublicRooms();
    res.json({ rooms });
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's rooms
router.get('/my-rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.getUserRooms(req.user.id);
    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific room by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is in the room (for private rooms)
    if (room.is_private) {
      const isInRoom = await Room.isUserInRoom(req.params.id, req.user.id);
      if (!isInRoom) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const members = await Room.getMembers(req.params.id);
    res.json({ room, members });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new room
router.post('/', [
  authenticateToken,
  body('name').trim().notEmpty().withMessage('Room name is required'),
  body('isPrivate').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, isPrivate = false } = req.body;
    const roomId = await Room.create(name, isPrivate, req.user.id);

    // Automatically add creator to the room
    await Room.addUser(roomId, req.user.id);

    const room = await Room.findById(roomId);
    res.status(201).json({ message: 'Room created', room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a room
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is private
    if (room.is_private) {
      return res.status(403).json({ error: 'Cannot join private room' });
    }

    const added = await Room.addUser(req.params.id, req.user.id);
    if (!added) {
      return res.status(400).json({ error: 'Already in room' });
    }

    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a room
router.delete('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const removed = await Room.removeUser(req.params.id, req.user.id);
    if (!removed) {
      return res.status(400).json({ error: 'Not in room' });
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room members
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const members = await Room.getMembers(req.params.id);
    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
