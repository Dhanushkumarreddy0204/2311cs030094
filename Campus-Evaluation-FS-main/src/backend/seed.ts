import { query, connectDB } from "./db";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const generateSeedData = async () => {
  try {
    await connectDB();
    console.log("Connected to database. Seeding data...");

    // Insert dummy student
    await query(`
      INSERT IGNORE INTO students (student_id, full_name, email, department)
      VALUES (2311, 'Dhanush Kumar', 'cdhnaushkumarreddy@gmail.com', 'CS')
    `);

    // Generate 100+ notifications
    const types = ["Placement", "Result", "Event"];
    const priorities = ["High", "Medium", "Low"]; // Note: priority is usually handled in code, but we just generate standard fields.
    const messages = [
      "New placement drive for Google is scheduled for tomorrow.",
      "End semester results for CS 3rd year are out.",
      "Annual technical fest begins next week. Register now!",
      "Urgent: Submit your project report by EOD.",
      "Your application for the internship has been shortlisted.",
    ];
    
    let values = [];
    for (let i = 1; i <= 120; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const title = `${type} Notification ${i}`;
      const message = messages[Math.floor(Math.random() * messages.length)];
      const isRead = Math.random() > 0.5 ? 1 : 0;
      // Random timestamp in the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');

      values.push(`(2311, '${type}', '${title}', '${message}', ${isRead}, '${formattedDate}')`);
    }

    const insertQuery = `
      INSERT INTO notifications (student_id, notification_type, title, message, is_read, created_at)
      VALUES ${values.join(",\n      ")}
    `;

    await query(insertQuery);

    console.log("Successfully seeded 120 notifications!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

generateSeedData();
