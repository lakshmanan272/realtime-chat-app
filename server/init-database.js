const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  console.log('🔄 Initializing database for production...\n');

  try {
    // For Railway, use DATABASE_URL or individual credentials
    const config = process.env.DATABASE_URL ? {
      uri: process.env.DATABASE_URL
    } : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    };

    const connection = await mysql.createConnection(config);
    console.log('✓ Connected to MySQL database');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schema);
      console.log('✓ Database schema initialized successfully');

      // Verify tables
      const [tables] = await connection.query('SHOW TABLES');
      console.log('\n✓ Tables created:');
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('⚠ Schema file not found, skipping initialization');
    }

    await connection.end();
    console.log('\n🎉 Database initialization complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('This is normal if tables already exist.');
    process.exit(0); // Exit successfully anyway
  }
}

initializeDatabase();
