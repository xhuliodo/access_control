import { createApp } from "./app";
import { createConfig } from "./app/config";
import { gracefulShutdown } from "./app/utils";

console.log("Starting application...");
const config = createConfig();
const app = createApp(config);
console.log(`Application started successfully.`);
console.log(`Listening on http://localhost:${app.server.port}`);

const shutdown = () => {
  console.log("Gracefully shutting down...");
  gracefulShutdown(app);
};

// Listen for termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
