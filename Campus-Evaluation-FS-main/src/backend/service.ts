import * as repo from "./repository";
import { getCache, setCache, invalidateCache } from "./redis";

const CACHE_TTL = 300; // 5 minutes

export const getNotifications = async (studentId: number, limit: number, offset: number, type?: string, isRead?: boolean) => {
  const cacheKey = `notifications:user:${studentId}:limit:${limit}:offset:${offset}:type:${type || 'all'}:isRead:${isRead !== undefined ? isRead : 'all'}`;
  
  // 1. Check Cache
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  // 2. Cache Miss - Fetch from DB
  const dbData = await repo.getNotifications(studentId, limit, offset, type, isRead);
  
  // 3. Store in Cache
  await setCache(cacheKey, dbData, CACHE_TTL);
  
  return dbData;
};

export const getUnreadCount = async (studentId: number) => {
  const cacheKey = `notifications:user:${studentId}:unread`;
  
  const cachedCount = await getCache(cacheKey);
  if (cachedCount !== null) return cachedCount;

  const count = await repo.getUnreadCount(studentId);
  await setCache(cacheKey, count, CACHE_TTL);
  
  return count;
};

export const markNotificationAsRead = async (studentId: number, notificationId: number) => {
  const success = await repo.markNotificationAsRead(notificationId);
  if (success) {
    await invalidateCache(`notifications:user:${studentId}:*`);
  }
  return success;
};

export const markAllNotificationsAsRead = async (studentId: number) => {
  const updated = await repo.markAllNotificationsAsRead(studentId);
  if (updated > 0) {
    await invalidateCache(`notifications:user:${studentId}:*`);
  }
  return updated;
};

export const createNotification = async (studentId: number, type: string, title: string, message: string) => {
  const id = await repo.createNotification(studentId, type, title, message);
  await invalidateCache(`notifications:user:${studentId}:*`);
  return id;
};

export const deleteNotification = async (studentId: number, notificationId: number) => {
  const success = await repo.deleteNotification(notificationId);
  if (success) {
    await invalidateCache(`notifications:user:${studentId}:*`);
  }
  return success;
};
