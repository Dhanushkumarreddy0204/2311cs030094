import { Request, Response } from "express";
import { Log } from "../logger";

export const handleError = async (error: Error, req: Request, res: Response) => {
  await Log("backend", "error", "handler", error.message);
  res.status(500).json({ error: "Internal Server Error" });
};
