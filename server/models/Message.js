const db = require('../config/db');

class Message {
  // Create a new message
  static async create(senderId, content, messageType, roomId = null, receiverId = null, fileUrl = null) {
    const [result] = await db.query(
      'INSERT INTO messages (sender_id, room_id, receiver_id, content, message_type, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [senderId, roomId, receiverId, content, messageType, fileUrl]
    );
    return result.insertId;
  }

  // Get room messages with pagination
  static async getRoomMessages(roomId, limit = 50, offset = 0) {
    const [rows] = await db.query(
      `SELECT m.*, u.username, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.room_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [roomId, limit, offset]
    );
    return rows.reverse();
  }

  // Get private messages between two users
  static async getPrivateMessages(userId1, userId2, limit = 50, offset = 0) {
    const [rows] = await db.query(
      `SELECT m.*, u.username, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
       AND m.room_id IS NULL
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId1, userId2, userId2, userId1, limit, offset]
    );
    return rows.reverse();
  }

  // Get message by ID
  static async findById(messageId) {
    const [rows] = await db.query(
      `SELECT m.*, u.username, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [messageId]
    );
    return rows[0];
  }

  // Delete message
  static async delete(messageId) {
    await db.query('DELETE FROM messages WHERE id = ?', [messageId]);
  }
}

module.exports = Message;
