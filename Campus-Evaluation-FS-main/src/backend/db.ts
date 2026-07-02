import mysql from "mysql2/promise";
import { Log } from "../logger";

let pool: mysql.Pool;

export const connectDB = async () => {
  try {
    // 1. First, connect without specifying a database to create it if it doesn't exist
    const setupConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "user",
      password: process.env.DB_PASSWORD || "password",
    });
    
    const dbName = process.env.DB_NAME || "notification_system";
    await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await setupConnection.end();

    // 2. Now create the main pool bound to the database
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "user",
      password: process.env.DB_PASSWORD || "password",
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    await Log("backend", "info", "db", "Database connected");

    // Initialize tables
    await initializeDatabase(connection);
    
    connection.release();
  } catch (error: any) {
    console.error("DB Connection Error", error);
    await Log("backend", "error", "db", `DB Connection Error: ${error.message}`);
  }
};

const initializeDatabase = async (connection: mysql.PoolConnection) => {
  const studentsSql = `
    CREATE TABLE IF NOT EXISTS students (
        student_id BIGINT PRIMARY KEY,
        full_name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        department VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const notificationsSql = `
    CREATE TABLE IF NOT EXISTS notifications (
        notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id BIGINT NOT NULL,
        notification_type VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
  `;

  try {
    await connection.query(studentsSql);
    await connection.query(notificationsSql);

    // Create Indexes carefully avoiding ER_DUP_KEYNAME errors
    await createIndex(connection, "idx_student_read_created", "notifications", "student_id, is_read, created_at ASC");
    await createIndex(connection, "idx_notification_type", "notifications", "notification_type");
    await createIndex(connection, "idx_notifications_type_created", "notifications", "notification_type, created_at DESC");

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

const createIndex = async (connection: mysql.PoolConnection, indexName: string, tableName: string, columns: string) => {
  try {
    await connection.query(`CREATE INDEX ${indexName} ON ${tableName} (${columns})`);
  } catch (error: any) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }
};

export const query = async (text: string, params?: any[]) => {
  const [result] = await pool.query(text, params);
  return result;
};
