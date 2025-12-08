import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT || 4001;
const MONGO_URL = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// DB connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB Connection Error: ", error));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/aiTool", promptRoutes);
app.use("/api/v1/chat", chatRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// 404 handler - FIXED: Use proper path pattern
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: `Route ${req.originalUrl} not found` 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});