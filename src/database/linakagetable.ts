/**
 * This script defines the LinakageTable class for managing the 'setlinkagetable' in the database.
 *
 * DB Table Structure:
 * - primaryid (INT, PRIMARY KEY, AUTO_INCREMENT)
 * - word_id (int)
 * - set_id (int)
 *
 * // this script will also have a function called "getSet" , that takes performs the join between the setlinkagetable and the words table to get all words for a specific set.
 */

import { pool } from "../config/db";

export class LinakageTableClass {
  constructor() {}
    
  /**
   * Route:
   * router.post("/add-terms", async (req: Request, res: Response) => {

  const { setId, termIds } = req.body;

  console.log( ` Adding terms: ${termIds} to setId: ${setId} `);

  res.status(200).json({ message: "Terms added to set successfully"});


});
    console repsonse:
    [1]  Adding terms: 1,2,3 to setId: 8 


   * */
  tableLinkageName = "setlinkagetable";
  public addTermsToSetSQL = async (setId: number, termIds: number[]) => {
    try {
      const values = termIds.map((termId) => [termId, setId]);
      console.log(`*** In total terms to addTermsToSetSQL: ${values}`);
      const query = `INSERT INTO ${this.tableLinkageName} (word_id, set_id) VALUES ?`;
      await pool.query(query, [values]);
      return true;
    } catch (error) {
      console.error("Error adding terms to set:", error);
      //   throw error;
      return false;
    }
  }; 

  // --> Get all terms for a specific set
  // Params: set_id
    public getTermsForSetSQL = async (setId: number,language: string) => {
        // For Japanese table is: japanesetable
        // For Spanish table is: spanishtable
        // If neither then return empty array
        const wordTableName = language === "japanese" ? "japanesetable" : language === "spanish" ? "spanishtable" : null;
        if (!wordTableName) {
            console.error(`Invalid language: ${language}`);
            return [];
        }
        try {
            const query = `
            SELECT w.*, l.primaryid as primaryIDLinkage FROM ${wordTableName} w
            JOIN ${this.tableLinkageName} l ON w.primaryid = l.word_id
            WHERE l.set_id = ?
            ORDER BY l.primaryid`;
            const [rows] = await pool.query(query, [setId]);
            
            return rows;
        }
        catch (error) {
            console.error("Error fetching terms for set:", error);
            return [];
        }
    };
        
}
