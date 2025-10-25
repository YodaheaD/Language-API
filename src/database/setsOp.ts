/**
 * Table-like class to manage language data with SQL integration and caching.
 *
 * Each function will have comment with example of SQL query used.
 */

import Logger from "../utils/logger";
import NodeCache from "node-cache";
import { pool } from "../config/db";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

export class SetsClass {
  constructor(public languageOfSet: string) {
    // this.cacheName = name + "Cache";
  }

  tableSetName = "settable";

  /**
   * Exaple of Current SQL Data:
   * langOfSet,setName,setFolder,description,dateCreated,dateModified
   * japanese,setName1,setFolder1,setDescription1,2023-10-01,2023-10-05
   * spanish,setName2,setFolder2,setDescription2,2023-11-15,2023-10-20
   */

  // Get all sets for a language
  public getAllSetsSQL = async () => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableSetName} WHERE langOfSet = ?`,
        [this.languageOfSet]
      );
      Logger.info(
        `Fetched all sets from SQL for language: ${this.languageOfSet}`
      );
      return rows;
    } catch (err) {
      Logger.error(
        `Database query failed for sets of language ${this.languageOfSet}: ${err}`
      );
      throw err;
    }
  };

  // Given a setName, change the "setFolder" value it belongs to
  // Params: setName, newSetFolder
  public updateSetFolderSQL = async (setName: string, newSetFolder: string) => {
    try {
      const [result] = await pool.query(
        `UPDATE ${this.tableSetName} SET setFolder = ? WHERE setName = ? AND langOfSet = ?`,
        [newSetFolder, setName, this.languageOfSet]
      );
      Logger.info(
        `Updated setFolder for setName ${setName} to ${newSetFolder}`
      );
      return result;
    } catch (err) {
      Logger.error(`Failed to update setFolder for setName ${setName}: ${err}`);
      throw err;
    }
  };
}
