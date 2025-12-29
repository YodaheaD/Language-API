/**
 * Table-like class to manage language data with SQL integration and caching.
 *
 * Each function will have comment with example of SQL query used.
 */

import Logger from "../utils/logger";
import { getPool } from "../config/db";
import dotenv from "dotenv";
import { ResultSetHeader } from "mysql2";

dotenv.config();

export class SetsClass {
  constructor(public languageOfSet: string) {}

  tableSetName = "settable";

  /**
   * Get all sets for a language
   */
  public getAllSetofLang = async () => {
    try {
      const pool = await getPool();

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

  /**
   * Update setFolder for a given setName
   */
  public updateSetFolderSQL = async (
    setName: string,
    newSetFolder: string
  ) => {
    try {
      const pool = await getPool();

      const [result] = await pool.query(
        `UPDATE ${this.tableSetName}
         SET setFolder = ?
         WHERE setName = ? AND langOfSet = ?`,
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

  /**
   * Return all distinct set folders
   */
  public returnAllSetFolders = async () => {
    try {
      const pool = await getPool();

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

  /**
   * Create a new set
   */
  public createNewSetSQL = async (
    setName: string,
    setFolder: string,
    description: string
  ) => {
    try {
      const pool = await getPool();

      const YYYY_MM_DD = new Date().toISOString().split("T")[0];

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${this.tableSetName}
         (langOfSet, setName, setFolder, description, dateCreated, dateModified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          this.languageOfSet,
          setName,
          setFolder,
          description,
          YYYY_MM_DD,
          YYYY_MM_DD,
        ]
      );

      Logger.info(`Created new set ${setName} in folder ${setFolder}`);
      return result;
    } catch (err) {
      Logger.error(`Failed to create new set ${setName}: ${err}`);
      throw err;
    }
  };

  /**
   * Delete a set by name and language
   */
  public deleteSet = async (setName: string, langOfSet: string) => {
    try {
      const pool = await getPool();

      const [result] = await pool.query(
        `DELETE FROM ${this.tableSetName}
         WHERE setName = ? AND langOfSet = ?`,
        [setName, langOfSet]
      );

      Logger.info(`Deleted set ${setName} for language ${langOfSet}`);
      return result;
    } catch (err) {
      Logger.error(
        `Failed to delete set ${setName} for language ${langOfSet}: ${err}`
      );
      throw err;
    }
  };

  /**
   * Return hierarchical folder → sets structure
   */
  public returnHeirchicalSetData = async () => {
    try {
      const pool = await getPool();

      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableSetName}`
      );

      const formattedData: any = {};

      (rows as any[]).forEach((row) => {
        const folder = row.setFolder;
        const folderLang = row.langOfSet;
        
        // Create a unique key combining folder and language to handle
        // cases where the same folder name exists for multiple languages
        const folderKey = `${folder}_${folderLang}`;

        if (!formattedData[folderKey]) {
          formattedData[folderKey] = {
            folder,
            langOfSet: folderLang,
            sets: [],
          };
        }

        formattedData[folderKey].sets.push({
          setName: row.setName,
          description: row.description,
          dateCreated: row.dateCreated,
          dateModified: row.dateModified,
          primaryid: row.primaryid,
        });
      });

      return Object.values(formattedData);
    } catch (err) {
      Logger.error(
        `Database query failed for hierarchical set data: ${err}`
      );
      throw err;
    }
  };
}
