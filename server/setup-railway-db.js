const mysql = require('mysql2/promise');

async function setupRailwayDatabase() {
  // This script expects DATABASE_URL to be set as an environment variable
  // Get it from Railway dashboard -> Variables -> DATABASE_URL

  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.log('\nTo run this script:');
    console.log('1. Go to Railway dashboard -> Your MySQL service -> Variables');
    console.log('2. Copy the DATABASE_URL value');
    console.log('3. Run: DATABASE_URL="your-url-here" node setup-railway-db.js');
    process.exit(1);
  }

  let connection;

  try {
    console.log('🔄 Connecting to Railway MySQL database...');
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✓ Connected to Railway MySQL database');

    // Drop existing tables if they exist
    console.log('🔄 Dropping existing tables...');
    await connection.query('DROP TABLE IF EXISTS messages');
    await connection.query('DROP TABLE IF EXISTS user_rooms');
    await connection.query('DROP TABLE IF EXISTS rooms');
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('✓ Existing tables dropped');

    // Create users table
    console.log('🔄 Creating users table...');
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Users table created');

    // Create rooms table
    console.log('🔄 Creating rooms table...');
    await connection.query(`
      CREATE TABLE rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_private BOOLEAN DEFAULT FALSE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Rooms table created');

    // Create user_rooms table
    console.log('🔄 Creating user_rooms table...');
    await connection.query(`
      CREATE TABLE user_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        room_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_room (user_id, room_id),
        INDEX idx_user_id (user_id),
        INDEX idx_room_id (room_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ User_rooms table created');

    // Create messages table
    console.log('🔄 Creating messages table...');
    await connection.query(`
      CREATE TABLE messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        room_id INT,
        receiver_id INT,
        content TEXT,
        message_type ENUM('text', 'image', 'file') DEFAULT 'text',
        file_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_sender_id (sender_id),
        INDEX idx_room_id (room_id),
        INDEX idx_receiver_id (receiver_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Messages table created');

    // Insert default system user
    console.log('🔄 Creating default system user...');
    await connection.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ('system', 'system@chatapp.com', 'system')
    `);
    console.log('✓ System user created');

    // Insert default General room
    console.log('🔄 Creating default General room...');
    await connection.query(`
      INSERT INTO rooms (name, is_private, created_by)
      VALUES ('General', FALSE, 1)
    `);
    console.log('✓ General room created');

    console.log('\n🎉 Railway database initialized successfully!');
    console.log('✅ All tables created and ready to use\n');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

// Run setup
setupRailwayDatabase();
