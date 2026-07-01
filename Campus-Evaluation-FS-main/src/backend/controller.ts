import { Request, Response } from "express";
import { Log } from "../logger";
import * as service from "./service";
import { handleError } from "./handler";
import { io } from "./server"; // For WebSocket broadcasting

// We assume a hardcoded student ID for this evaluation.
// In a real application, this would come from the JWT via middleware.
const STUDENT_ID = 2311;

export const fetchNotifications = async (req: Request, res: Response) => {
  try {
    await Log("backend", "info", "controller", "Fetching notifications");
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const type = req.query.notification_type as string | undefined;
    const isReadParam = req.query.isRead as string | undefined;
    const isRead = isReadParam ? isReadParam.toLowerCase() === 'true' : undefined;

    const result = await service.getNotifications(STUDENT_ID, limit, offset, type, isRead);
    
    res.status(200).json({
      page,
      limit,
      totalNotifications: result.total,
      totalPages: Math.ceil(result.total / limit),
      data: result.data
    });
  } catch (error: any) {
    await handleError(error, req, res);
  }
};

export const fetchUnreadCount = async (req: Request, res: Response) => {
  try {
    await Log("backend", "info", "controller", "Fetching unread count");
    const unreadCount = await service.getUnreadCount(STUDENT_ID);
    res.status(200).json({ unreadCount });
  } catch (error: any) {
    await handleError(error, req, res);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    await Log("backend", "info", "controller", `Marking notification ${notificationId} as read`);
    
    const success = await service.markNotificationAsRead(STUDENT_ID, notificationId);
    if (!success) {
      return res.status(404).json({ success: false, message: "Notification Not Found" });
    }

    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    await handleError(error, req, res);
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    await Log("backend", "info", "controller", "Marking all notifications as read");
    const updated = await service.markAllNotificationsAsRead(STUDENT_ID);
    res.status(200).json({ updated, message: "All notifications marked as read" });
  } catch (error: any) {
    await handleError(error, req, res);
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, type } = req.body;
    await Log("backend", "info", "controller", "Creating notification");
    
    const notificationId = await service.createNotification(STUDENT_ID, type, title, message);
    
    // Broadcast via WebSockets
    if (io) {
      io.emit('new_notification', {
        id: notificationId,
        studentId: STUDENT_ID,
        type,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({ notificationId, message: "Notification created successfully" });
  } catch (error: any) {
    await handleError(error, req, res);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    await Log("backend", "info", "controller", `Deleting notification ${notificationId}`);
    
    const success = await service.deleteNotification(STUDENT_ID, notificationId);
    if (!success) {
      return res.status(404).json({ success: false, message: "Notification Not Found" });
    }

    res.status(204).send();
  } catch (error: any) {
    await handleError(error, req, res);
  }
};
