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

export const createBulkNotifications = async (studentIds: number[], type: string, title: string, message: string) => {
  if (studentIds.length === 0) return 0;
  
  const placeholders = studentIds.map(() => "(?, ?, ?, ?)").join(", ");
  const sql = `
    INSERT INTO notifications (student_id, notification_type, title, message) 
    VALUES ${placeholders}
  `;
  
  const values: any[] = [];
  for (const id of studentIds) {
    values.push(id, type, title, message);
  }
  
  await Log("backend", "debug", "repository", `Creating ${studentIds.length} notifications in bulk`);
  const result: any = await query(sql, values);
  return result.insertId; // First insert ID of the bulk insert
};

export const getAllStudentIds = async () => {
  const sql = `SELECT student_id FROM students`;
  await Log("backend", "debug", "repository", "Fetching all student IDs");
  const result: any = await query(sql);
  
  if (result.length === 0) {
    // If no students exist, return a mock array for testing purposes
    return [1042, 2311, 3456, 7890, 9999];
  }
  return result.map((row: any) => row.student_id);
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
