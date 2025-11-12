import express, { Express, Request, Response, Router } from "express";

export const router: Router = Router();
import { japClass, spanishClass } from "../database/dataSources/lang-spanish";

// Language mapping to avoid if/else chains
const languageMap = {
  spanish: spanishClass,
  japanese: japClass,
} as const;

// Helper function to get language class
const getLanguageClass = (lang: string) => {
  const languageClass = languageMap[lang as keyof typeof languageMap];
  if (!languageClass) {
    throw new Error(`Invalid language: ${lang}`);
  }
  return languageClass;
};

router.get("/", (req: Request, res: Response) => {
  res.send("Hello from Page Router");
});

// - GET - Get all Spanish language data from SQL
router.get("/all/:lang", async (req, res) => {
  const { lang } = req.params;
  try {
    const languageClass = getLanguageClass(lang);
    const rows = await languageClass.getAllDataSQL();
    res.json(rows);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid language")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Database query failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET - Get paginated Spanish language data from SQL
// Params: page, limit
router.get("/fetch/:lang", async (req, res) => {
  const { lang } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const languageClass = getLanguageClass(lang);
    const rows = await languageClass.getPaginatedDataSQL(page, limit);
    res.json(rows);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid language")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Database query failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET - Get the size of the language table
router.get("/fetchSize/:lang", async (req, res) => {
  const { lang } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const languageClass = getLanguageClass(lang);
    const size = await languageClass.getTableSizeSQL();
    res.json({ size });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid language")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Database query failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET - Get random set of language data from SQL
// Params: numOfItems, lang
router.get("/random/:lang", async (req, res) => {
  const { lang } = req.params;
  const numOfItems = parseInt(req.query.numOfItems as string) || 5;
  try {
    const languageClass = getLanguageClass(lang);
    const rows = await languageClass.getRandomDataSQL(numOfItems);
    res.json(rows);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid language")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Database query failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
