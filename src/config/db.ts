import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',     // Your MySQL host
  user: 'root',          // Your MySQL username
  password: 'Wardell3030!', // Your MySQL password
  database: 'sys', // The database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
