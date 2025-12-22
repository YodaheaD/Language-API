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
import { createTunnel } from "tunnel-ssh";
import fs from "fs";
import path from "path";

type DBConfig = {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectionLimit: number;
};

const CURRENT_ENV = process.env.CURRENT_ENV || "dev";

/**
 * LOCAL PORT for SSH tunnel
 * Must be >1024 and NOT 3306
 */
const LOCAL_TUNNEL_PORT = 3307;

let pool: mysql.Pool | null = null;
let tunnelReady = false;

/**
 * Create SSH tunnel (ONLY in prod)
 */
async function ensureSSHTunnel(): Promise<void> {
  if (CURRENT_ENV !== "prod" || tunnelReady) return;

  console.log("🔐 Establishing SSH tunnel...");

  await createTunnel(
    {
      autoClose: true,
      reconnectOnError: true,
    },
    {
      host: "127.0.0.1",
      port: LOCAL_TUNNEL_PORT,
    },
    {
      host: process.env.VM_HOST!, // VM public IP
      port: 22,
      username: process.env.VM_SSH_USER!, // e.g. yodahead
      privateKey:
        // For Prod use env variable or secure vault
        process.env.VM_SSH_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    },
    { 
      srcAddr: "127.0.0.1",
      srcPort: LOCAL_TUNNEL_PORT,
      dstAddr: "127.0.0.1", // MySQL runs locally on VM
      dstPort: 3306,
    }
  );

  tunnelReady = true;
  console.log("✅ SSH tunnel established");
}

/**
 * Create MySQL pool (lazy + safe)
 */
export async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  if (CURRENT_ENV === "prod") {
    await ensureSSHTunnel();
  }

  const config: DBConfig =
    CURRENT_ENV === "prod"
      ? {
          host: "127.0.0.1",
          port: LOCAL_TUNNEL_PORT,
          user: process.env.DB_USER!,
          password: process.env.DB_PASSWORD!,
          database: process.env.DB_DATABASE || "langappdb",
          connectionLimit: 5,
        }
      : {
          host: process.env.LOCAL_DB_HOST || "localhost",
          port: Number(process.env.LOCAL_DB_PORT) || 3306,
          user: process.env.LOCAL_DB_USER || "root",
          password: process.env.LOCAL_DB_PASSWORD || "",
          database: process.env.LOCAL_DB_DATABASE || "langappdb",
          connectionLimit: 10,
        };

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000, // 10s (important for tunnels)
  });

  console.log("🗄️ MySQL pool created");
  return pool;
}
