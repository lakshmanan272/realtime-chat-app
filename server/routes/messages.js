const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get room messages
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if user is in the room
    const isInRoom = await Room.isUserInRoom(roomId, req.user.id);
    if (!isInRoom) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const messages = await Message.getRoomMessages(roomId, parseInt(limit), parseInt(offset));
    res.json({ messages });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get private messages between current user and another user
router.get('/private/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.getPrivateMessages(
      req.user.id,
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    );
    res.json({ messages });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      message: 'File uploaded successfully',
      fileUrl: result.secure_url,
      fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'file'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
