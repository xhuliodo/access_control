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
  };
};

export type Controllers = ReturnType<typeof createControllers>;
