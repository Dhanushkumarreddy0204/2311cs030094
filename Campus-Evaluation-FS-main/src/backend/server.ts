import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Log } from "../logger";
import { connectDB } from "./db";
import routes from "./routes";

dotenv.config({ path: "../../.env" });

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", routes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await Log("backend", "info", "service", "Server started");
  });
};

startServer();
