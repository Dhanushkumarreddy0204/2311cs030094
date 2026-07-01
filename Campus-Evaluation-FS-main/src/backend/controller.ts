import { Request, Response } from "express";
import { Log } from "../logger";
import { findUserById } from "./repository";
import { handleError } from "./handler";

export const createUser = async (req: Request, res: Response) => {
  try {
    await Log("backend", "info", "controller", "Creating user");
    const user = await findUserById("123");
    res.status(201).json(user);
  } catch (error: any) {
    await handleError(error, req, res);
  }
};
