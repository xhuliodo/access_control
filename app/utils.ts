import type { App } from ".";

export const gracefulShutdown = async (app: App) => {
  try {
    app.repository.close();
    console.log("Closed database.");
    await app.server.stop();
    console.log("Closed server.");
    process.exit(0);
  } catch (error) {
    console.error("Error while graceful shutdown:", error);
    process.exit(1);
  }
};
