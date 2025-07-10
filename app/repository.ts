import type { Config } from "./config";
import { Database } from "bun:sqlite";

export type Repository = ReturnType<typeof createRepository>;

export const createSqliteDatabase = (config: Config): Database => {
  const db = new Database(config.databasePath);
  return db;
};

export const createRepository = (db: Database) => {
  return {
    close: () => {
      db.close();
    },
  };
};
