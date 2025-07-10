import type { Controllers } from "./controllers";

export const createRouter = (controllers: Controllers) => {
  return {
    "/resource/:id/access-list": {
      GET: controllers.getResourceAccessList,
    },
    "/user/:id/resources": {
      GET: controllers.getUserResources,
    },
    "/resources/with-user-count": {
      GET: controllers.getResourcesWithUserCount,
    },
  };
};

export type Router = ReturnType<typeof createRouter>;
