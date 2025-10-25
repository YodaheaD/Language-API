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

export class LangaugeClass {
  constructor(public tableName: string, public data: any[] = []) {
    // this.cacheName = name + "Cache";
  }

  /**
   * Direct database access (private method)
   * SQL Example: "SELECT * FROM spanish"
   */
  public getAllDataSQL = async () => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`);
      Logger.info(`Fetched all data from SQL table: ${this.tableName}`);
      return rows;
    } catch (err) {
      Logger.error(`Database query failed for table ${this.tableName}: ${err}`);
      throw err;
    }
  };

  // Paginated data fetch
  /**
   * SQL Example: table "langtable1" , page 2, pageSize 5
   * "SELECT * FROM langtable1 LIMIT 5 OFFSET 5"
   */
  getPaginatedDataSQL = async (page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize;
    try {
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

  // Get random set of data ( for quizes )
  // Params: NumOfItems
  getRandomDataSQL = async (numOfItems: number) => {
    try {
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

  /** Maintenance Routes */
  // For the CRUD operations on the Table

  // Create an entry in the Table
  // Params: word , definition
  /**
   * SQL Example: the word is "hola" and definition is "hello" for table "spanish"
   * "INSERT INTO spanish (word, definition) VALUES ('hola', 'hello')"
   */
  addEntryToTable = async (word: string, definition: string) => {
    try {
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

  // Create multiple entries in the Table
  // Params: array of {word, definition}
  /**
   * SQL Example: the word is "hola" and definition is "hello" for table "spanish"
   * "INSERT INTO spanish (word, definition) VALUES ('hola', 'hello')"
   */
addMultipleEntriesToTable = async (entries: { word: string; definition: string }[]) => {
  try {
    if (!entries.length) return 0; // nothing to insert

    const query = `INSERT INTO ${this.tableName} (word, definition) VALUES ?`;

    // Prepare the array of values
    const values = entries.map(entry => [entry.word, entry.definition]);

    // Execute the bulk insert
    const [result] = await pool.query(query, [values]);

    // result.affectedRows tells you how many rows were inserted
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


  // Remove Entry from Table
  // Given word, delete that entry
  // Params : word
  /**
   * SQL Example: We want to remove the word: "testWord1" from table "spanish"
   * "DELETE FROM spanish WHERE word = 'testWord1'"
   */
  removeEntryFromTable = async (word: string) => {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE word = ?`;
      // Capture the result
      const [result] = await pool.query(query, [word]);

      // result is of type OkPacket in mysql2
      // affectedRows tells you how many rows were deleted
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

  // // Add Column to current Table
  // addColumn = async (columnName: string, dataType: string) => {
  //   if (!allowColumnNames.includes(columnName)) {
  //     throw new Error(`Column name ${columnName} is not allowed.`);
  //   }

  //   try {
  //     const query = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ${dataType}`;
  //     await pool.query(query);
  //     Logger.info(
  //       `Added column ${columnName} to table ${this.tableName} with data type ${dataType}`
  //     );
  //   } catch (err) {
  //     Logger.error(
  //       `Failed to add column ${columnName} to table ${this.tableName}: ${err}`
  //     );
  //     throw err;
  //   }
  // };
}
