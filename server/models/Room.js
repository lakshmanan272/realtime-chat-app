const db = require('../config/db');

class Room {
  // Create a new room
  static async create(name, isPrivate, createdBy) {
    const [result] = await db.query(
      'INSERT INTO rooms (name, is_private, created_by) VALUES (?, ?, ?)',
      [name, isPrivate, createdBy]
    );
    return result.insertId;
  }

  // Find room by ID
  static async findById(roomId) {
    const [rows] = await db.query(
      `SELECT r.*, u.username as creator_name
       FROM rooms r
       JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [roomId]
    );
    return rows[0];
  }

  // Get all rooms a user belongs to
  static async getUserRooms(userId) {
    const [rows] = await db.query(
      `SELECT r.*, u.username as creator_name,
       (SELECT COUNT(*) FROM user_rooms WHERE room_id = r.id) as member_count
       FROM rooms r
       JOIN users u ON r.created_by = u.id
       JOIN user_rooms ur ON r.id = ur.room_id
       WHERE ur.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return rows;
  }

  // Get all public rooms
  static async getPublicRooms() {
    const [rows] = await db.query(
      `SELECT r.*, u.username as creator_name,
       (SELECT COUNT(*) FROM user_rooms WHERE room_id = r.id) as member_count
       FROM rooms r
       JOIN users u ON r.created_by = u.id
       WHERE r.is_private = FALSE
       ORDER BY r.created_at DESC`
    );
    return rows;
  }

  // Add user to room
  static async addUser(roomId, userId) {
    try {
      await db.query(
        'INSERT INTO user_rooms (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return false; // User already in room
      }
      throw error;
    }
  }

  // Remove user from room
  static async removeUser(roomId, userId) {
    const [result] = await db.query(
      'DELETE FROM user_rooms WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    return result.affectedRows > 0;
  }

  // Get room members
  static async getMembers(roomId) {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.avatar_url, u.is_online
       FROM users u
       JOIN user_rooms ur ON u.id = ur.user_id
       WHERE ur.room_id = ?
       ORDER BY u.username`,
      [roomId]
    );
    return rows;
  }

  // Check if user is in room
  static async isUserInRoom(roomId, userId) {
    const [rows] = await db.query(
      'SELECT 1 FROM user_rooms WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    return rows.length > 0;
  }

  // Delete room
  static async delete(roomId) {
    await db.query('DELETE FROM rooms WHERE id = ?', [roomId]);
  }
}

module.exports = Room;
