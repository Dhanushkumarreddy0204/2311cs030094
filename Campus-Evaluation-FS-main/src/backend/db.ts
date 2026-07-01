import { Log } from "../logger";

export const connectDB = async () => {
  try {
    // Mock DB Connection
    await Log("backend", "info", "db", "Database connected");
  } catch (error: any) {
    console.error("DB Connection Error", error);
  }
};
