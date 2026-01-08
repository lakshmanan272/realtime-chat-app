const db = require('../config/db');

class User {
  // Create a new user
  static async create(username, email, passwordHash) {
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, username, email, avatar_url, is_online, last_seen, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get all users
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, username, email, avatar_url, is_online, last_seen FROM users WHERE id != 1 ORDER BY username'
    );
    return rows;
  }

  // Update user online status
  static async updateOnlineStatus(userId, isOnline) {
    await db.query(
      'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [isOnline, userId]
    );
  }

  // Update user profile
  static async updateProfile(userId, updates) {
    const { username, email, avatar_url } = updates;
    await db.query(
      'UPDATE users SET username = ?, email = ?, avatar_url = ? WHERE id = ?',
      [username, email, avatar_url, userId]
    );
  }
}

module.exports = User;
