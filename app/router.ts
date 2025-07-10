import type { Controllers } from "./controllers";

export const createRouter = (controllers: Controllers) => {
  return {
    "/": {
      GET: () => new Response("hello world!"),
    },
  };
};

export type Router = ReturnType<typeof createRouter>;
