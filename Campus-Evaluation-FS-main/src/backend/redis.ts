import Redis from "ioredis";
import { Log } from "../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Using robust retry strategy to ensure application does not crash
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Reconnect after
    return Math.min(times * 50, 2000);
  },
});

redis.on("connect", () => {
  Log("backend", "info", "redis", "Redis Connected successfully");
});

redis.on("error", (err) => {
  Log("backend", "error", "redis", `Redis Error: ${err.message}`);
});

export const getCache = async (key: string): Promise<any | null> => {
  try {
    const data = await redis.get(key);
    if (data) {
      await Log("backend", "debug", "redis", `Cache Hit: ${key}`);
      return JSON.parse(data);
    }
    await Log("backend", "debug", "redis", `Cache Miss: ${key}. Fetching from DB.`);
    return null;
  } catch (error: any) {
    await Log("backend", "warn", "redis", `Fallback to PostgreSQL due to Redis error: ${error.message}`);
    return null; // Graceful fallback
  }
};

export const setCache = async (key: string, data: any, ttlSeconds: number = 300) => {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (error: any) {
    await Log("backend", "warn", "redis", `Failed to set cache for ${key}: ${error.message}`);
  }
};

export const invalidateCache = async (pattern: string) => {
  try {
    let cursor = "0";
    do {
      const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
    await Log("backend", "info", "redis", `Cache Invalidated for pattern: ${pattern}`);
  } catch (error: any) {
    await Log("backend", "warn", "redis", `Failed to invalidate cache pattern ${pattern}: ${error.message}`);
  }
};
