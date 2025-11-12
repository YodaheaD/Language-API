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
  public getAllSetofLang = async () => {
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

  // Simply returns all the 'setFolder' values , regardless of language
  // No Params
  /**
   * Example SQL: `SELECT DISTINCT setFolder from settable WHERE langOfSet=spanish`
   */
  public returnAllSetFolders = async () => {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT setFolder FROM ${this.tableSetName}`
      );
      Logger.info(
        `Fetched all setFolders from SQL for language: ${this.languageOfSet}`
      );
      return rows;
    } catch (err) {
      Logger.error(
        `Database query failed for setFolders of language ${this.languageOfSet}: ${err}`
      );
      throw err;
    }
  };


// Function will create a new set in the settable
// Params: setName, setFolder, description
// The two missing fields: dateCreated, dateModified will be auto set to current date in this API

  public createNewSetSQL = async (setName: string, setFolder: string, description: string) => {
    try {
      const MM_DD_YYYY = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      // Use MM_DD_YYYY for dateCreated and dateModified and dont use CURDATE() in SQL
      
      const [result] = await pool.query(
        `INSERT INTO ${this.tableSetName} (langOfSet, setName, setFolder, description, dateCreated, dateModified) VALUES (?, ?, ?, ?, ?, ?)`,
        [this.languageOfSet, setName, setFolder, description, MM_DD_YYYY, MM_DD_YYYY]
      );
      Logger.info(`Created new set ${setName} in folder ${setFolder}`);
      return result;
    } catch (err) {
      Logger.error(`Failed to create new set ${setName}: ${err}`);
      throw err;
    }
  };

  // -> This function deletes a set based on setName and langOfSet
  // Params: setName, langOfSet
  /**
   * SQL Example: Delete set named SetName1 in japanese
   * DELETE FROM settable WHERE setName = 'SetName1' AND langOfSet = 'japanese';
   */
  public deleteSet = async (setName: string, langOfSet: string) => {
    try {
      const [result] = await pool.query(
        `DELETE FROM ${this.tableSetName} WHERE setName = ? AND langOfSet = ?`,
        [setName, langOfSet]
      );
      Logger.info(`Deleted set ${setName} for language ${langOfSet}`);
      return result;
    } catch (err) {
      Logger.error(`Failed to delete set ${setName} for language ${langOfSet}: ${err}`);
      throw err;
    }
  };

  /**
   * Helper Functions
   */

  public returnHeirchicalSetData = async () => {
  /* 
  Example of Heirchy:
  [
    {
        "folder": "newFolder3",
        "langOfSet": "japanese",
        "sets": [
            {
                "setName": "setName1",
                "description": "setDescription1",
                "dateCreated": "2023-10-01",
                "dateModified": "2023-10-05"
            }
        ]
    },
    {
        "folder": "newFolder",
        "langOfSet": "spanish",
        "sets": [
            {
                "setName": "setName2",
                "description": "setDescription2",
                "dateCreated": "2023-11-15",
                "dateModified": "2023-10-20"
            },
            {
                "setName": "SetName 24",
                "description": "the latest description",
                "dateCreated": "2025-10-25",
                "dateModified": "2025-10-25"
            }
        ]
    }
]

  */
    try {
      const [rows] = await pool.query(`SELECT * FROM ${this.tableSetName}`);

      // Format the data into the desired hierarchical structure
      const formattedData: any = {};
      (rows as any[]).forEach((row) => {
        const folder = row.setFolder;
        const folderLang = row.langOfSet;
        if (!formattedData[folder]) {
          formattedData[folder] = {
            folder: folder,
            langOfSet: folderLang,
            sets: [],
          };
        }
        formattedData[folder].sets.push({
          setName: row.setName,
          description: row.description,
          dateCreated: row.dateCreated,
          dateModified: row.dateModified,
          primaryid: row.primaryid,
        });
      });
      return Object.values(formattedData);
    } catch (err) {
      Logger.error(`Database query failed for hierarchical set data: ${err}`);
      throw err;
    }
  };
}
