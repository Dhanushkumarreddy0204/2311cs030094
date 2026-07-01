import { Router } from "express";
import { Log } from "../logger";
import { createUser } from "./controller";

const router = Router();

router.get("/users", async (req, res, next) => {
  await Log("backend", "debug", "route", "GET /users called");
  // Simulate routing to controller
  await createUser(req, res);
});

export default router;
