import express, { Express, Request, Response } from "express";
import cors from "cors";
import Logger from "./utils/logger";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
const app: Express = express();

const PORT = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET || "default_secret";
import { router as pageRouter } from "./data";
import { router as utilsRouter } from "./utilRouter/page";
//src\ops\page.ts
import { router as opsRouter } from "./ops/page";
// src\setRouter\page.ts
import { router as setRouter } from "./setRouter/page";
import session from "express-session";
import bcrypt from "bcrypt";
import { getPool } from "./config/db";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// 1️⃣ Trust proxy first (needed for secure cookies behind NGINX)
app.set("trust proxy", 1); // or true

// 2️⃣ CORS must come before routes so preflight requests work
app.use(
  cors({
    origin: "https://www.yodaslanguageapp.com",
    credentials: true, // allow cookies
  })
);

// 3️⃣ Parse cookies before session middleware
app.use(cookieParser());

// 4️⃣ Session middleware comes next
app.use(
  session({
    name: "yodas-session",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true, // JS can't read it
      sameSite: "lax",
    },
  })
);

// 5️⃣ Body parsers for JSON and URL-encoded forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6️⃣ Serve static files last (optional, after parsing and sessions)
app.use(express.static("public"));

/** Login Route */

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  console.log("Login attempt for user:", username);
  const pool = await getPool();
  const result = (await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ])) as any[];

  if (!result.length)
    return res.status(401).json({ error: "Invalid credentials" });

  const user = result[0];

  if (!user[0].password_hash)
    return res.status(500).json({ error: "User password not set" });

  console.log("Full user is :", user);
  try {
    const valid = await bcrypt.compare(password, user[0].password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error("Bcrypt compare error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }

  req.session.userId = user.id;
  console.log("User authenticated, session set:", req.session);
  res.json({ success: true });
});

/** Logout Route */
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("yodas-session");
    res.json({ success: true });
  });
});

/** Middleware Routes */

// Middleware to protect routes
function requireAuth(req: Request, res: Response, next: Function) {
  console.log(` Requesting info: ${req.session}`);
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
// Test secure route
app.get("/test/secure", requireAuth, (req, res) => {
  // console log th request information
  console.log("Secure route accessed by userId:", req);
  res.json({ secret: "You are logged in" });
});
/**
 * await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password })
});
 */

/* Non-Auth Routes */
app.use("/data", pageRouter);
app.use("/utils", utilsRouter);
app.use("/ops", opsRouter);
app.use("/sets", setRouter);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express Api");
});

app.listen(PORT, () => {
  Logger.info(
    ` Server running on port ${PORT} in Environment: ${process.env.CURRENT_ENV} with user: ${process.env.DB_USER}`
  );
});
