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

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('✓ MySQL database connected successfully');
  connection.release();
});

module.exports = promisePool;
