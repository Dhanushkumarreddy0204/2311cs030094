import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { Log } from "../logger";
import { connectDB } from "./db";
import routes from "./routes";

dotenv.config({ path: "../../.env" });

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use("/api", routes);

io.on("connection", (socket) => {
  console.log(`Client connected via WebSocket: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await Log("backend", "info", "service", "Server started");
  });
};

startServer();
