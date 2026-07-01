import { query } from "./db";
import { Log } from "../logger";

export const getNotifications = async (studentId: number, limit: number, offset: number, type?: string, isRead?: boolean) => {
  let sql = `
    SELECT notification_id, notification_type, title, message, is_read, created_at 
    FROM notifications 
    WHERE student_id = $1
  `;
  const params: any[] = [studentId];
  let paramIndex = 2;

  if (type) {
    sql += ` AND notification_type = $${paramIndex++}`;
    params.push(type);
  }
  
  if (isRead !== undefined) {
    sql += ` AND is_read = $${paramIndex++}`;
    params.push(isRead);
  }

  // Count total notifications for pagination
  const countSql = `SELECT COUNT(*) FROM (${sql}) AS filtered_notifications`;
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count, 10);

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  params.push(limit, offset);

  await Log("backend", "debug", "repository", "Fetching notifications");
  const result = await query(sql, params);

  return { total, data: result.rows };
};

export const getUnreadCount = async (studentId: number) => {
  const sql = `
    SELECT COUNT(*) 
    FROM notifications 
    WHERE student_id = $1 AND is_read = FALSE
  `;
  await Log("backend", "debug", "repository", "Fetching unread count");
  const result = await query(sql, [studentId]);
  return parseInt(result.rows[0].count, 10);
};

export const markNotificationAsRead = async (notificationId: number) => {
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE notification_id = $1 
    RETURNING *
  `;
  await Log("backend", "debug", "repository", "Marking notification as read");
  const result = await query(sql, [notificationId]);
  return result.rowCount ? result.rowCount > 0 : false;
};

export const markAllNotificationsAsRead = async (studentId: number) => {
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE student_id = $1 AND is_read = FALSE
  `;
  await Log("backend", "debug", "repository", "Marking all notifications as read");
  const result = await query(sql, [studentId]);
  return result.rowCount || 0;
};

export const createNotification = async (studentId: number, type: string, title: string, message: string) => {
  const sql = `
    INSERT INTO notifications (student_id, notification_type, title, message) 
    VALUES ($1, $2, $3, $4) 
    RETURNING notification_id
  `;
  await Log("backend", "debug", "repository", "Creating notification");
  const result = await query(sql, [studentId, type, title, message]);
  return result.rows[0].notification_id;
};

export const deleteNotification = async (notificationId: number) => {
  const sql = `
    DELETE FROM notifications 
    WHERE notification_id = $1
  `;
  await Log("backend", "debug", "repository", "Deleting notification");
  const result = await query(sql, [notificationId]);
  return result.rowCount ? result.rowCount > 0 : false;
};
