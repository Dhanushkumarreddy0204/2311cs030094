import { Log } from "../logger";

export const findUserById = async (id: string) => {
  await Log("backend", "debug", "repository", "Finding user by id");
  return { id, name: "Test User" };
};
