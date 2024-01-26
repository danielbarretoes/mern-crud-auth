import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import { FRONTEND_URL } from "./config.js";

const app = express();

// CORS config
app.use(
  cors({
    credentials: true,
    origin: FRONTEND_URL,
  })
);

// bibliotecas de lectura
app.use(express.json());
app.use(cookieParser());

// console debug req
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api", tasksRoutes);

// Static App Frontend
if (process.env.NODE_ENV === "production") {
  const path = await import("path");
  app.use(express.static("client/dist"));

  app.get("*", (req, res) => {
    console.log(path.resolve("client", "dist", "index.html"));
    res.sendFile(path.resolve("client", "dist", "index.html"));
  });
}

export default app;
