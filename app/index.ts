import type { Config } from "./config";
import { createRepository, createSqliteDatabase } from "./repository";
import { createControllers } from "./controllers";
import { createRouter } from "./router";

export const createApp = (config: Config) => {
  const db = createSqliteDatabase(config);
  const repository = createRepository(db);

  const controllers = createControllers(repository);
  const router = createRouter(controllers);
  const server = Bun.serve({
    port: config.serverPort,
    routes: router,
  });

  return {
    server,
    repository,
  };
};

export type App = ReturnType<typeof createApp>;
