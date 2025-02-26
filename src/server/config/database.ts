import mysql from 'mysql2/promise';
import 'dotenv/config';

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/coroinhas');

// Pool de conexões MySQL
const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.substring(1), // Remove a barra inicial
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export { pool }; 