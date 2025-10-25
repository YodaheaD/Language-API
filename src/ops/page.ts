import express, { Express, Request, Response, Router } from "express";
import { spanishClass } from "../database/dataSources/lang-spanish";

export const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Hello from Ops Router");
});

// POST - insert multiple entries in spanish
router.post("/addData/spanish", async (req: Request, res: Response) => {
  const entries = req.body;
  console.log(entries);
  // Check if entries array is provided
  if (!entries || !Array.isArray(entries)) {
    return res.status(400).json({ message: "Entries array is required" });
  }

  // Validate each entry has word and definition
  for (const entry of entries) {
    if (!entry.word || !entry.definition) {
      return res
        .status(400)
        .json({ message: "Each entry must have word and definition" });
    }
    if (
      typeof entry.word !== "string" ||
      typeof entry.definition !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Word and definition must be strings" });
    }
  }

  try {
    const affectedRows = await spanishClass.addMultipleEntriesToTable(entries);
    res.status(201).json({
      message: "Entries added successfully",
      count: affectedRows,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add entries" });
  }
});

// DELETE - remove entry in spanish by word
// Example: "/ops/removeData/spanish?word=testWord1"
router.delete("/removeData/spanish", async (req: Request, res: Response) => {
  const { word } = req.query;
  if (!word) {
    return res.status(400).json({ message: "Need a word to delete" });
  }
  try {
    if (typeof word !== "string") {
      return res.status(400).json({ message: "Invalid input type" });
    }
    await spanishClass.removeEntryFromTable(word);
    res.status(200).json({ message: "Entry removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove entry" });
  }
});
