import { query } from "./db";
import { Log } from "../logger";

export const getNotifications = async (studentId: number, limit: number, offset: number, type?: string, isRead?: boolean) => {
  let sql = `
    SELECT notification_id, notification_type, title, message, is_read, created_at 
    FROM notifications 
    WHERE student_id = ?
  `;
  const params: any[] = [studentId];

  if (type) {
    sql += ` AND notification_type = ?`;
    params.push(type);
  }
  
  if (isRead !== undefined) {
    sql += ` AND is_read = ?`;
    params.push(isRead);
  }

  // Count total notifications for pagination
  const countSql = `SELECT COUNT(*) as count FROM (${sql}) AS filtered_notifications`;
  const countResult: any = await query(countSql, params);
  const total = parseInt(countResult[0].count, 10);

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  await Log("backend", "debug", "repository", "Fetching notifications");
  const result: any = await query(sql, params);

  // In mysql2, boolean might be returned as 1/0 depending on the driver, mapping is_read to boolean to keep API consistent.
  const data = result.map((row: any) => ({
    ...row,
    is_read: row.is_read === 1 || row.is_read === true
  }));

  return { total, data };
};

export const getUnreadCount = async (studentId: number) => {
  const sql = `
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE student_id = ? AND is_read = FALSE
  `;
  await Log("backend", "debug", "repository", "Fetching unread count");
  const result: any = await query(sql, [studentId]);
  return parseInt(result[0].count, 10);
};

export const markNotificationAsRead = async (notificationId: number) => {
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE notification_id = ? 
  `;
  await Log("backend", "debug", "repository", "Marking notification as read");
  const result: any = await query(sql, [notificationId]);
  return result.affectedRows > 0;
};

export const markAllNotificationsAsRead = async (studentId: number) => {
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE student_id = ? AND is_read = FALSE
  `;
  await Log("backend", "debug", "repository", "Marking all notifications as read");
  const result: any = await query(sql, [studentId]);
  return result.affectedRows || 0;
};

export const createNotification = async (studentId: number, type: string, title: string, message: string) => {
  const sql = `
    INSERT INTO notifications (student_id, notification_type, title, message) 
    VALUES (?, ?, ?, ?) 
  `;
  await Log("backend", "debug", "repository", "Creating notification");
  const result: any = await query(sql, [studentId, type, title, message]);
  return result.insertId;
};

export const deleteNotification = async (notificationId: number) => {
  const sql = `
    DELETE FROM notifications 
    WHERE notification_id = ?
  `;
  await Log("backend", "debug", "repository", "Deleting notification");
  const result: any = await query(sql, [notificationId]);
  return result.affectedRows > 0;
};
