import express, { Express, Request, Response, Router } from "express";
import { JapSet, SpanSet } from "../database/dataSources/setSources";
import { validLanguages } from "../utils/types";
import { LinakageTable } from "../database/dataSources/linktable";

export const router: Router = Router();

// Language mapping to avoid if/else chains
const languageMap = {
  spanish: SpanSet,
  japanese: JapSet,
} as const;

// Helper function to get language class
const getLanguageClass = (lang: string) => {
  const languageClass = languageMap[lang as keyof typeof languageMap];
  if (!languageClass) {
    throw new Error(`Invalid language: ${lang}`);
  }
  return languageClass;
};

//->  Returns all sets, in hierarchical format

router.get("/", async (req: Request, res: Response) => {
  try {
    const hierarchicalData = await SpanSet.returnHeirchicalSetData();
    res.json(hierarchicalData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching hierarchical data", error: err });
  }
});

// ->  Returns all sets for a specific language

router.get("/getSet/:setLang", async (req: Request, res: Response) => {
  const { setLang } = req.params;

  try {
    const LanguageClass = getLanguageClass(setLang);
    const setInfo = await LanguageClass.getAllSetofLang();
    return res.status(200).json(setInfo);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Invalid language:")) {
      return res.status(400).json({ message: err.message });
    }
    return res
      .status(500)
      .json({ message: "Error fetching set data", error: err });
  }
});

// ->  Change the folder of a set
router.put("/updateSetFolder", async (req: Request, res: Response) => {
  const { setLang, setName, newSetFolder } = req.body;

  try {
    const LanguageClass = getLanguageClass(setLang);
    const result = await LanguageClass.updateSetFolderSQL(
      setName,
      newSetFolder
    );
    return res.status(200).json({ message: responseFunction(result), result });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Invalid language:")) {
      return res.status(400).json({ message: err.message });
    }
    return res
      .status(500)
      .json({ message: "Error updating set folder", error: err });
  }
});

// ->  Returns all setFolders, regardless of language
router.delete("/delete/:setIdentifier", async (req: Request, res: Response) => {
  // Incoming Request:   /sets/delete/setName1-japanese
  const { setIdentifier } = req.params;
  const [setName, langOfSet] = setIdentifier.split("-");

  // in our types.ts we have validLanguages array, use that to validate langOfSet
  if (!validLanguages.includes(langOfSet as any)) {
    return res
      .status(400)
      .json({
        message: `Invalid language: ${langOfSet} not part of ${validLanguages.join(
          ", "
        )}`,
      });
  }
  console.log(
    ` Received request to delete set: ${setName} for language: ${langOfSet}`
  );

  try {
    // This function is class independent, it uses the language passed to search the table so I don't need to instantiate different classes
    // By default we will use SpanSet
    const result = await SpanSet.deleteSet(setName, langOfSet);
    return res.status(200).json({ message: responseFunction(result), result });
  } catch (err) {
    return res.status(500).json({ message: "Error deleting set", error: err });
  }
});

router.post("/createSet", async (req: Request, res: Response) => {
  /**
   * {"langOfSet":"spanish","setName":"SetName 24","setFolder":"newFolder","description":"the latest description"}
   */
  const { langOfSet, setName, setFolder, description } = req.body;

  try {
    const LanguageClass = getLanguageClass(langOfSet);
    const result = await LanguageClass.createNewSetSQL(
      setName,
      setFolder,
      description
    );
    return res.status(201).json({ message: responseFunction(result), result });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Invalid language:")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Error creating set", error: err });
  }
});

  // --> Add terms to Set
  // Params: setId, termIds[]
router.post("/add-terms", async (req: Request, res: Response) => {

  const { setId, termIds } = req.body;

  console.log( ` Adding terms: ${termIds} to setId: ${setId} `);
 
  try {
    const linkResponse=  await LinakageTable.addTermsToSetSQL(setId, termIds);
    if (linkResponse) {
      res.status(200).json({ message: "Terms added to set successfully"});
    } else {
      res.status(500).json({ message: "Failed to add terms to set"});
    }
  } catch (error) {
    res.status(500).json({ message: "Error adding terms to set", error });
  }
});

//-> Get all terms for a specific set
router.get("/get-terms/:setId/:language", async (req: Request, res: Response) => {
  const { setId, language } = req.params;

  try {
    const terms = await LinakageTable.getTermsForSetSQL(Number(setId), language);
    res.status(200).json(terms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching terms for set", error });
  }
});

/** Helper Functions */

const responseFunction = (result: any) => {
  // check the affectedRows value
  // If greater than 0, then return "Change Successful"
  // If 0, then return "No Changes Made"
  if (result.affectedRows > 0) {
    return "Change Successful";
  } else {
    return "No Changes Made";
  }
};
