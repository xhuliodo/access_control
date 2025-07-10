import z from "zod";
import type { Config } from "./config";
import { Database } from "bun:sqlite";

const ResourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  // In SQLite, booleans are often stored as 0 or 1
  isPublic: z.number().transform((val) => val === 1),
});
export type Resource = z.infer<typeof ResourceSchema>;

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const createSqliteDatabase = (config: Config): Database => {
  const db = new Database(config.databasePath);
  return db;
};

export const createRepository = (db: Database) => {
  return {
    close: () => {
      db.close();
    },
    getResourceById: async (id: number): Promise<Resource | null> => {
      const sql = "SELECT * FROM resources WHERE id = ?";

      const result = db.query(sql).get(id);
      return result ? ResourceSchema.parse(result) : null;
    },
    getAllUsers: async (): Promise<User[]> => {
      const sql = "SELECT * FROM users";

      const result = db.query(sql).all();
      return z.array(UserSchema).parse(result);
    },
    getResourceAccessList: async (id: number): Promise<User[]> => {
      const sql = `
      SELECT u.id, u.name
      FROM users u
      JOIN resource_shares rs ON u.id = rs.userId
      WHERE rs.resourceId = :resourceId

      UNION

      SELECT u.id, u.name
      FROM users u
      JOIN user_groups ug ON u.id = ug.userId
      JOIN resource_shares rs ON ug.groupId = rs.groupId
      WHERE rs.resourceId = :resourceId
      `;

      const results = db.query(sql).all({ ":resourceId": id });
      return z.array(UserSchema).parse(results);
    },
  };
};
export type Repository = ReturnType<typeof createRepository>;
