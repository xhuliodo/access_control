import type { Controllers } from "./controllers";

export const createRouter = (controllers: Controllers) => {
  return {
    "/resource/:id/access-list": {
      GET: controllers.getResourceAccessList,
    },
  };
};

export type Router = ReturnType<typeof createRouter>;
