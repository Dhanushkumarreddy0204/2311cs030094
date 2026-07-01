import { Pool } from "pg";
import { Log } from "../logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/notification_system",
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    await Log("backend", "info", "db", "Database connected");

    // Initialize tables
    await initializeDatabase();
    
    client.release();
  } catch (error: any) {
    console.error("DB Connection Error", error);
    await Log("backend", "error", "db", `DB Connection Error: ${error.message}`);
  }
};

const initializeDatabase = async () => {
  const initSql = `
    CREATE TABLE IF NOT EXISTS students (
        student_id BIGINT PRIMARY KEY,
        full_name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        department VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
        notification_id BIGSERIAL PRIMARY KEY,
        student_id BIGINT NOT NULL,
        notification_type VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE INDEX IF NOT EXISTS idx_student_read_created ON notifications(student_id, is_read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notification_type ON notifications(notification_type);
  `;
  try {
    await pool.query(initSql);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
