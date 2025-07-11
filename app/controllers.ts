import z from "zod";
import type { Repository } from "./repository";
import type { BunRequest } from "bun";

const ParamsWithIdSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .min(1, "parameter 'id' must be a positive number"),
});

export const createControllers = (repository: Repository) => {
  return {
    getResourceAccessList: async (req: BunRequest) => {
      try {
        const parsedParams = ParamsWithIdSchema.safeParse(req.params);
        if (!parsedParams.success) {
          return Response.json(
            {
              error: "invalid 'id' parameter",
              issues: z.treeifyError(parsedParams.error).properties?.id?.errors,
            },
            { status: 400 }
          );
        }
        const resourceId = parsedParams.data.id;

        const foundResource = await repository.getResourceById(resourceId);
        if (!foundResource) {
          return Response.json(
            { error: "resource not found" },
            { status: 404 }
          );
        }

        if (foundResource.isPublic) {
          const allUsers = await repository.getAllUsers();
          return Response.json(allUsers);
        }

        const accessList = await repository.getResourceAccessList(resourceId);
        return Response.json(accessList);
      } catch (error) {
        console.error("unhandled error occurred: ", error);
        return Response.json(
          { error: "internal server error, please try again." },
          { status: 500 }
        );
      }
    },
    getUserResources: async (req: BunRequest) => {
      try {
        const parsedParams = ParamsWithIdSchema.safeParse(req.params);
        if (!parsedParams.success) {
          return Response.json(
            {
              error: "invalid 'id' parameter",
              issues: z.treeifyError(parsedParams.error).properties?.id?.errors,
            },
            { status: 400 }
          );
        }
        const userId = parsedParams.data.id;

        const userResources = await repository.getUserResources(userId);
        return Response.json(userResources);
      } catch (error) {
        console.error("Unhandled error occurred: ", error);
        return Response.json(
          { error: "internal server error, please try again." },
          { status: 500 }
        );
      }
    },
    getResourcesWithUserCount: async () => {
      try {
        const [allUsersCount, allResources, privateResourcesUserCounts] =
          await Promise.all([
            repository.getAllUsersCount(),
            repository.getAllResources(),
            repository.getPrivateResourcesUserCount(),
          ]);

        const privateResourcesUserCountMap = new Map();
        for (const pr of privateResourcesUserCounts) {
          privateResourcesUserCountMap.set(pr.resourceId, pr.userCount);
        }

        const resourcesWithUserCount = allResources.map((r) => {
          // think of the resource as public
          let userCount = allUsersCount.count;
          // if not public, get the actual count
          if (!r.isPublic) {
            userCount = privateResourcesUserCountMap.get(r.id) || 0;
          }

          return {
            id: r.id,
            name: r.name,
            isPublic: r.isPublic,
            userCount: userCount,
          };
        });

        return Response.json(resourcesWithUserCount);
      } catch (error) {
        console.error("Unhandled error occurred: ", error);
        return Response.json(
          { error: "internal server error, please try again." },
          { status: 500 }
        );
      }
    },
    getUsersWithResourceCount: async () => {
      try {
        const [allPublicResourceCount, allUsers, usersPrivateResouceCounts] =
          await Promise.all([
            repository.getAllPublicResourceCount(),
            repository.getAllUsers(),
            repository.getUsersPrivateResourceCount(),
          ]);

        const usersPrivateResouceCountsMap = new Map();
        for (const upr of usersPrivateResouceCounts) {
          usersPrivateResouceCountsMap.set(upr.userId, upr.resourceCount);
        }

        const usersWithResourceCount = allUsers.map((u) => {
          // add exclusively all public resources
          let resourceCount = allPublicResourceCount.count;
          // add private only resources to the count
          const privateCount = usersPrivateResouceCountsMap.get(u.id) || 0;
          resourceCount += privateCount;

          return {
            userId: u.id,
            name: u.name,
            resourceCount,
          };
        });

        return Response.json(usersWithResourceCount);
      } catch (error) {
        console.error("Unhandled error occurred: ", error);
        return Response.json(
          { error: "internal server error, please try again." },
          { status: 500 }
        );
      }
    },
  };
};

export type Controllers = ReturnType<typeof createControllers>;
