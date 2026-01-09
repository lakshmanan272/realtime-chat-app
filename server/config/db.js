const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
// Support both Railway DATABASE_URL and individual credentials
let poolConfig;

if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL for Railway
  poolConfig = process.env.DATABASE_URL;
} else {
  // Use individual credentials
  poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

const pool = mysql.createPool(poolConfig);

// Get promise-based connection
const promisePool = pool.promise();

// Test database connection and auto-initialize tables
pool.getConnection(async (err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('✓ MySQL database connected successfully');

  try {
    // Check if tables exist, create if not
    const [tables] = await connection.promise().query("SHOW TABLES LIKE 'users'");

    if (tables.length === 0) {
      console.log('📋 Database tables not found, creating...');

      // Create tables
      await connection.promise().query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(50) UNIQUE NOT NULL,email VARCHAR(100) UNIQUE NOT NULL,password_hash VARCHAR(255) NOT NULL,avatar_url VARCHAR(500),is_online BOOLEAN DEFAULT FALSE,last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX idx_username (username),INDEX idx_email (email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      await connection.promise().query(`CREATE TABLE IF NOT EXISTS rooms (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,is_private BOOLEAN DEFAULT FALSE,created_by INT NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,INDEX idx_created_by (created_by)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      await connection.promise().query(`CREATE TABLE IF NOT EXISTS user_rooms (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,room_id INT NOT NULL,joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,UNIQUE KEY unique_user_room (user_id, room_id),INDEX idx_user_id (user_id),INDEX idx_room_id (room_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      await connection.promise().query(`CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY,sender_id INT NOT NULL,room_id INT,receiver_id INT,content TEXT,message_type ENUM('text','image','file') DEFAULT 'text',file_url VARCHAR(500),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,INDEX idx_sender_id (sender_id),INDEX idx_room_id (room_id),INDEX idx_receiver_id (receiver_id),INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      await connection.promise().query(`INSERT INTO users (username, email, password_hash) VALUES ('system', 'system@chatapp.com', 'system')`);

      await connection.promise().query(`INSERT INTO rooms (name, is_private, created_by) VALUES ('General', FALSE, 1)`);

      console.log('✅ Database tables created successfully!');
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }

  connection.release();
});

module.exports = promisePool;
