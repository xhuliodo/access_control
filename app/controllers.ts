import type { Repository } from "./repository";

export const createControllers = (repository: Repository) => {
  return {};
};

export type Controllers = ReturnType<typeof createControllers>;
