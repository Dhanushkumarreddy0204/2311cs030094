import amqp from "amqplib";
import dotenv from "dotenv";
import { Log } from "../logger";

dotenv.config({ path: "../../.env" });

const MAX_RETRIES = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate sending an email with occasional fake failures
const sendEmail = async (studentId: number, data: any) => {
  await sleep(100); // simulate SMTP delay
  
  // 10% chance to fail to demonstrate retry/DLQ logic
  if (Math.random() < 0.1) {
    throw new Error("SMTP connection timeout");
  }
};

async function startWorker() {
  try {
    const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    
    // Ensure queues and DLX exist
    await channel.assertExchange("dlx", "direct", { durable: true });
    await channel.assertQueue("dlq.email", { durable: true });
    await channel.bindQueue("dlq.email", "dlx", "dlq.email");

    await channel.assertQueue("email_queue", {
      durable: true,
      deadLetterExchange: "dlx",
      deadLetterRoutingKey: "dlq.email"
    });
    
    // Process 50 emails concurrently
    channel.prefetch(50);
    
    await Log("backend", "info", "service", "Worker started listening to email_queue...");
    
    channel.consume("email_queue", async (msg) => {
      if (!msg) return;
      
      const data = JSON.parse(msg.content.toString());
      const studentId = data.studentId;
      
      try {
        await Log("backend", "info", "service", `Processing email for student ${studentId}`);
        
        await sendEmail(studentId, data);
        
        channel.ack(msg);
        await Log("backend", "info", "service", `Successfully delivered email to ${studentId}`);
        
      } catch (error: any) {
        const headers = msg.properties.headers || {};
        const retries = headers['x-retry-count'] || 0;
        
        if (retries < MAX_RETRIES) {
          await Log("backend", "warn", "service", `SMTP timeout. Attempt ${retries + 1} of ${MAX_RETRIES} for ${studentId}. Re-queuing.`);
          
          // Re-queue with incremented retry count
          channel.ack(msg); // acknowledge original
          
          // Wait briefly (exponential backoff simulation could go here)
          await sleep(1000);
          
          channel.sendToQueue("email_queue", msg.content, {
            persistent: true,
            headers: {
              ...headers,
              'x-retry-count': retries + 1
            }
          });
        } else {
          await Log("backend", "error", "service", `Max retries exceeded for ${studentId}. Routing to DLQ.`);
          // NACK without requeue routes it to DLX (Dead Letter Exchange)
          channel.nack(msg, false, false); 
        }
      }
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      await Log("backend", "info", "service", "SIGTERM received. Shutting down worker.");
      await channel.close();
      await connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error("Worker initialization failed:", error);
    process.exit(1);
  }
}

startWorker();
