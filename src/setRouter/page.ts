import express, { Express, Request, Response, Router } from "express";
import { JapSet, SpanSet } from "../database/dataSources/setSources";

export const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Hello from Set Router");
});

router.get("/getSet/:setLang", async (req: Request, res: Response) => {
  const { setLang } = req.params;
  if (setLang === "japanese") {
    const setInfo = await JapSet.getAllSetsSQL();
    return res.status(200).json(setInfo);
  } else if (setLang === "spanish") {
    const setInfo = await SpanSet.getAllSetsSQL();
    return res.status(200).json(setInfo);
  } else {
    return res.status(400).json({ message: "Invalid set language" });
  }
});

// Change the folder of a set
router.put("/updateSetFolder", async (req: Request, res: Response) => {
  const { setLang, setName, newSetFolder } = req.body;

  if (setLang === "japanese") {
    try {
      const result = await JapSet.updateSetFolderSQL(setName, newSetFolder);
      return res.status(200).json({ message: responseFunction(result), result });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error updating set folder", error: err });
    }
  } else if (setLang === "spanish") {
    try {
      const result = await SpanSet.updateSetFolderSQL(setName, newSetFolder);
      return res.status(200).json({ message: responseFunction(result), result });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error updating set folder", error: err });
    }
  } else {
    return res.status(400).json({ message: "Invalid set language" });
  }
});


const responseFunction = (result:any)=>{
    // check the affectedRows value
    // If greater than 0, then return "Change Successful"
    // If 0, then return "No Changes Made"
    if(result.affectedRows > 0){
        return "Change Successful";
    } else {
        return "No Changes Made";
    }
}