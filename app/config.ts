import { z } from "zod";

const ConfigSchema = z.object({
  serverPort: z.coerce.number().positive().default(3000),
  databasePath: z.string().default("./db/main.db"),
});
export type Config = z.infer<typeof ConfigSchema>;

export const createConfig = (): Config => {
  const result = {
    serverPort: process.env.PORT,
    databasePath: process.env.DATABASE_PATH,
  };

  const config = ConfigSchema.safeParse(result);
  if (!config.success) {
    console.error(
      "invalid environment variables with errors: \n",
      z.treeifyError(config.error)
    );
    process.exit(1);
  }

  return config.data;
};
