/**
 * Table-like class to manage language data with SQL integration and caching.
 *
 * Each function will have comment with example of SQL query used.
 */

import Logger from "../utils/logger";
import NodeCache from "node-cache";
import { getPool } from "../config/db";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export class LangaugeClass {
  constructor(public tableName: string, public data: any[] = []) {}

  /**
   * Direct database access
   * SQL Example: "SELECT * FROM spanish"
   */
  public getAllDataSQL = async () => {
    try {
      const pool = await getPool();
      const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`);
      Logger.info(`Fetched all data from SQL table: ${this.tableName}`);
      return rows;
    } catch (err) {
      Logger.error(`Database query failed for table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  /**
   * Paginated data fetch
   * SQL Example:
   * "SELECT * FROM langtable1 LIMIT 5 OFFSET 5"
   */
  public getPaginatedDataSQL = async (page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize;
    try {
      const pool = await getPool();
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );
      Logger.info(
        `Fetched paginated data from SQL table: ${this.tableName}, Page: ${page}, Page Size: ${pageSize}`
      );
      return rows;
    } catch (err) {
      Logger.error(`Database query failed for table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  /**
   * Returns the size of the table
   * SQL Example:
   * "SELECT COUNT(*) as count FROM langtable1"
   */
  public getTableSizeSQL = async () => {
    try {
      const pool = await getPool();
      const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      const count = (rows as any)[0].count;
      Logger.info(`Fetched table size from SQL table: ${this.tableName}`);
      return count;
    } catch (err) {
      Logger.error(`Database query failed for table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  /**
   * Returns random rows from table
   * SQL Example:
   * "SELECT * FROM langtable1 ORDER BY RAND() LIMIT 3"
   */
  public getRandomDataSQL = async (numOfItems: number) => {
    try {
      const pool = await getPool();
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} ORDER BY RAND() LIMIT ?`,
        [numOfItems]
      );
      Logger.info(
        `Fetched random data from SQL table: ${this.tableName}, Num of Items: ${numOfItems}`
      );
      return rows;
    } catch (err) {
      Logger.error(`Database query failed for table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  /**
   * Insert a single entry
   * SQL Example:
   * "INSERT INTO spanish (word, definition) VALUES ('hola', 'hello')"
   */
  public addEntryToTable = async (word: string, definition: string) => {
    try {
      const pool = await getPool();
      const query = `INSERT INTO ${this.tableName} (word, definition) VALUES (?, ?)`;
      await pool.query(query, [word, definition]);
      Logger.info(
        `Added entry to table ${this.tableName}: { word: ${word}, definition: ${definition} }`
      );
    } catch (err) {
      Logger.error(`Failed to add entry to table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  /**
   * Bulk insert entries
   */
  public addMultipleEntriesToTable = async (
    entries: { word: string; definition: string }[]
  ) => {
    try {
      if (!entries.length) return 0;

      const pool = await getPool();
      const query = `INSERT INTO ${this.tableName} (word, definition) VALUES ?`;
      const values = entries.map((e) => [e.word, e.definition]);

      const [result] = await pool.query(query, [values]);
      const affectedRows = (result as any).affectedRows;

      Logger.info(
        `Added ${affectedRows} entries to table ${this.tableName}.`
      );

      return affectedRows;
    } catch (err) {
      Logger.error(`Failed to add entries to table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  /**
   * Delete entry by word
   * SQL Example:
   * "DELETE FROM spanish WHERE word = 'testWord1'"
   */
  public removeEntryFromTable = async (word: string) => {
    try {
      const pool = await getPool();
      const query = `DELETE FROM ${this.tableName} WHERE word = ?`;
      const [result] = await pool.query(query, [word]);

      const affectedRows = (result as any).affectedRows;

      if (affectedRows > 0) {
        Logger.info(
          `Removed entry from table ${this.tableName}: { word: ${word} }, rows deleted: ${affectedRows}`
        );
      } else {
        Logger.warn(
          `No entry found to delete in table ${this.tableName} for word: ${word}`
        );
      }
    } catch (err) {
      Logger.error(
        `Failed to remove entry from table ${this.tableName}: ${err}`
      );
      throw err;
    }
  };
}
