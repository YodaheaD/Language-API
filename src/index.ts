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

app.set("trust proxy", true);

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

app.use(express.static("public"));
//const PORT = process.env.PORT;
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/** Login Route */

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const pool = await getPool();
  const user = (await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ])) as any[];

  if (!user.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user[0].password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.userId = user[0].id;
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
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
// Test secure route
app.get("/test/secure", requireAuth, (req, res) => {
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
