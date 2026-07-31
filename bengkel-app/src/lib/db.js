import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Default user mysql di Laragon
  password: '',      // Default password di Laragon biasanya kosong
  database: 'bengkel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;