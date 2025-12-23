// // db.ts
// import mysql from "mysql2/promise";
// type DBConfig = {
//   host: string;
//   user: string;
//   password: string;
//   database: string;
//   port?: string;
//   connectionLimit?: number;
// };

// // Use current environment to select appropriate database configuration
// const currentEnv = process.env.CURRENT_ENV || "dev";

// const dbConfig: Record<string, DBConfig> = {
//   dev: {
//     host: process.env.LOCAL_DB_HOST || "localhost",
//     user: process.env.LOCAL_DB_USER || "root",
//     password: process.env.LOCAL_DB_PASSWORD || "",
//     database: process.env.LOCAL_DB_DATABASE || "langappdb",
//   },
//   prod: {
//     host: process.env.DB_HOST || "localhost",
//     user: process.env.DB_USER || "root",
//     password: process.env.DB_PASSWORD || "",
//     database: process.env.DB_DATABASE || "langappdb",
//     port: process.env.DB_PORT || "3306",
//     connectionLimit:5,
//   },
// };

// export const pool: mysql.Pool = mysql.createPool({
//   host: dbConfig[currentEnv].host,
//   user: dbConfig[currentEnv].user,
//   password: dbConfig[currentEnv].password,
//   database: dbConfig[currentEnv].database,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });
// db.ts

// db.ts
import mysql from "mysql2/promise";

type DBConfig = {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectionLimit: number;
};

let pool: mysql.Pool | null = null;

/**
 * Create MySQL pool (lazy + safe)
 */
export async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  const config: DBConfig = {
    host: process.env.DB_HOST || "127.0.0.1",   // VM can access itself or cloud DB host
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE || "langappdb",
    connectionLimit: 5,
  };

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000, // 10s
  });

  console.log("🗄️ MySQL pool created without SSH tunnel");
  return pool;
}

