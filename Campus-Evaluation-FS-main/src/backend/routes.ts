import { Router } from "express";
import { Log } from "../logger";
import * as controller from "./controller";

const router = Router();

// Logging middleware for API routes
router.use(async (req, res, next) => {
  await Log("backend", "debug", "route", `${req.method} ${req.url} called`);
  next();
});

router.get("/v1/notifications", controller.fetchNotifications);
router.get("/v1/notifications/unread-count", controller.fetchUnreadCount);
router.patch("/v1/notifications/read-all", controller.markAllAsRead);
router.patch("/v1/notifications/:id/read", controller.markAsRead);
router.post("/v1/notifications", controller.createNotification);
router.delete("/v1/notifications/:id", controller.deleteNotification);

export default router;
