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

const ResourceWithUserCountSchema = z.object({
  resourceId: z.number(),
  userCount: z.number(),
});
export type ResourceWithUserCount = z.infer<typeof ResourceWithUserCountSchema>;

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
    getUserResources: async (id: number): Promise<Resource[]> => {
      const sql = `
      SELECT r.id, r.name, r.isPublic
      FROM resources r
      JOIN resource_shares rs ON r.id = rs.resourceId
      WHERE rs.userId = :userId

      UNION

      SELECT r.id, r.name, r.isPublic
      FROM resources r
      JOIN resource_shares rs ON r.id = rs.resourceId
      JOIN user_groups ug ON rs.groupId = ug.groupId
      WHERE ug.userId = :userId

      UNION

      SELECT r.id, r.name, r.isPublic
      FROM resources r
      WHERE r.isPublic = TRUE
      `;

      const results = db.query(sql).all({ ":userId": id });
      return z.array(ResourceSchema).parse(results);
    },
    getAllUsersCount: async (): Promise<{ count: number }> => {
      const sql = "SELECT COUNT(id) as count FROM users";

      const result = db.query(sql).get();
      return z.object({ count: z.number() }).parse(result);
    },
    getAllResources: async (): Promise<Resource[]> => {
      const sql = "SELECT * FROM resources";

      const result = db.query(sql).all();
      return z.array(ResourceSchema).parse(result);
    },
    getPrivateResourcesUserCount: async (): Promise<
      ResourceWithUserCount[]
    > => {
      const sql = `
      WITH private_resource_access AS (
      SELECT rs.resourceId, rs.userId
      FROM resource_shares rs
      JOIN resources r ON rs.resourceId = r.id
      WHERE rs.userId IS NOT NULL AND r.isPublic = FALSE
      
      UNION
      
      SELECT rs.resourceId, ug.userId
      FROM resource_shares rs
      JOIN user_groups ug ON rs.groupId = ug.groupId
      JOIN resources r ON rs.resourceId = r.id
      WHERE r.isPublic = FALSE
      )
      
      SELECT resourceId, COUNT(userId) AS userCount
      FROM private_resource_access
      GROUP BY resourceId
      `;

      const results = db.query(sql).all();
      return z.array(ResourceWithUserCountSchema).parse(results);
    },
  };
};
export type Repository = ReturnType<typeof createRepository>;
