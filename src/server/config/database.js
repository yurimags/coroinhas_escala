const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'external_user',      // Ajuste para seu usuário
  password: 'yuMAGsou2109@',      // Ajuste para sua senha
  database: 'coroinhas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool; 