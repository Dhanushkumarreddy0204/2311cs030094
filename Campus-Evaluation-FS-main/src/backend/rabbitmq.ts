import amqp from "amqplib";
import type { Connection, Channel } from "amqplib";
import { Log } from "../logger";

let connection: any = null;
let channel: any = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  if (channel) return channel;

  try {
    const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    await channel.assertExchange("dlx", "direct", { durable: true });
    await channel.assertQueue("dlq.email", { durable: true });
    await channel.bindQueue("dlq.email", "dlx", "dlq.email");

    await channel.assertQueue("email_queue", {
      durable: true,
      deadLetterExchange: "dlx",
      deadLetterRoutingKey: "dlq.email"
    });

    await Log("backend", "info", "service", "Connected to RabbitMQ and asserted queues");
    return channel;
  } catch (error) {
    await Log("backend", "error", "service", `RabbitMQ Connection Error: ${error}`);
    throw error;
  }
};

export const publishToQueue = async (queueName: string, data: any) => {
  const ch = await connectRabbitMQ();
  const payload = Buffer.from(JSON.stringify(data));
  ch.sendToQueue(queueName, payload, { persistent: true });
};
