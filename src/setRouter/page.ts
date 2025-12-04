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

// ->   Delete set given Identifier (setName-language)
router.delete("/delete/:setIdentifier", async (req: Request, res: Response) => {
  // Incoming Request:   /sets/delete/setName1-japanese
  let { setIdentifier } = req.params;
  let splitby = "-";
  // if word Mistakes is present splitby "-PM-" instead
  if (setIdentifier.includes("-PM-")) {
    splitby = "-PM-";
  }
   const [setName, langOfSet] = setIdentifier.split(splitby);
console.log(` Deleting setName: ${setName} for langOfSet: ${langOfSet}`);
  // in our types.ts we have validLanguages array, use that to validate langOfSet
  if (!validLanguages.includes(langOfSet as any)) {
    return res.status(400).json({
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

  // reject is setName has special characters other than space, hyphen, underscore
  const specialCharRegex = /[^a-zA-Z0-9 _-]/;
  if (specialCharRegex.test(setName)) {
    return res.status(400).json({
      message:
        "Invalid setName: Special characters other than space, hyphen, and underscore are not allowed.",
    });
  }
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
router.post("/add-terms", async (req: Request, res: Response) => {
  const { setId, termIds } = req.body;

  console.log(`Adding terms: ${termIds} to setId: ${setId}`);

  try {
    const linkResponse = await LinakageTable.addTermsToSetSQL(setId, termIds);

    if (!linkResponse) {
      return res.status(500).json({
        message: "Unexpected failure from addTermsToSetSQL.",
      });
    }

    // CASE 1: Duplicate terms found → nothing inserted
    if (linkResponse.success === false && linkResponse.duplicates) {
      return res.status(409).json({
        message: "Duplicate terms found. No terms were inserted.",
        duplicates: linkResponse.duplicates,
      });
    }

    // CASE 2: Insert successful
    if (linkResponse.success === true) {
      return res.status(200).json({
        message: "Terms added to set successfully.",
        inserted: linkResponse.inserted,
      });
    }

    // Fallback if response is weird
    return res.status(500).json({
      message: "Unexpected response structure from addTermsToSetSQL.",
    });
  } catch (error) {
    console.error("Error in /add-terms route:", error);
    return res.status(500).json({
      message: "Server error adding terms to set.",
      error,
    });
  }
});

//-> Remove terms from Set
router.post("/remove-terms", async (req: Request, res: Response) => {
  const { setId, termIds } = req.body;

  console.log(`Removing terms: ${termIds} from setId: ${setId}`);

  try {
    const response = await LinakageTable.removeTermsFromSetSQL(setId, termIds);

    if (!response) {
      return res.status(500).json({
        message: "Unexpected failure from removeTermsFromSetSQL."
      });
    }

    // CASE 1: Missing terms (cannot delete)
    if (response.success === false && response.missing) {
      return res.status(404).json({
        message: "Some terms were not found in the set. No deletions performed.",
        missing: response.missing
      });
    }

    // CASE 2: Successful delete
    if (response.success === true) {
      return res.status(200).json({
        message: "Terms removed from set successfully.",
        deleted: response.deleted
      });
    }

    // Fallback for unexpected response shape
    return res.status(500).json({
      message: "Unexpected response structure from removeTermsFromSetSQL."
    });

  } catch (error) {
    console.error("Error in /remove-terms route:", error);
    return res.status(500).json({
      message: "Server error removing terms from set.",
      error
    });
  }
});


//-> Get all terms for a specific set
router.get(
  "/get-terms/:setId/:language",
  async (req: Request, res: Response) => {
    const { setId, language } = req.params;

    try {
      const terms = await LinakageTable.getTermsForSetSQL(
        Number(setId),
        language
      );
      res.status(200).json(terms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching terms for set", error });
    }
  }
);


// -> Create a set With Terms included
router.post("/createSetWithTerms", async (req: Request, res: Response) => {
  const { langOfSet, setName, setFolder, description, termIds = [] } = req.body;

  try {
    const LanguageClass = getLanguageClass(langOfSet);

    // STEP 1 → Create new set
    const createResult = await LanguageClass.createNewSetSQL(
      setName,
      setFolder,
      description
    );

    const newSetId = createResult.insertId;

    if (!newSetId) {
      return res.status(500).json({
        message: "Failed to create new set.",
        result: createResult,
      });
    }

    let linkReport = null;

    // STEP 2 → If terms provided, attempt to insert them
    if (Array.isArray(termIds) && termIds.length > 0) {
      linkReport = await LinakageTable.addTermsToSetSQL(newSetId, termIds);
    }

    // Build the final combined report
    const finalReport = {
      createdSet: {
        id: newSetId,
        name: setName,
        folder: setFolder,
        description,
      },
      termInsertReport: linkReport,
    };

    // Determine the appropriate status code
    if (linkReport && linkReport.success === false) {
      // Set created, but term insertion failed due to duplicates
      return res.status(207).json({
        message: "Set created, but some terms could not be added.",
        report: finalReport,
      });
    }

    return res.status(201).json({
      message: "Set created successfully.",
      report: finalReport,
    });

  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Invalid language:")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({
      message: "Server error creating set with terms.",
      error: err,
    });
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
