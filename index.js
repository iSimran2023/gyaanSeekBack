import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";
import cors from "cors";

dotenv.config();

// ✅ FIX: Enable autoIndex BEFORE connecting
mongoose.set('strictQuery', false);
mongoose.set('autoIndex', true);

console.log("Environment variables loaded:");

const app = express();
const MONGO_URL = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration - SIMPLIFY FOR VERCEL
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
  })
);

// ✅ DB connection (with Vercel-friendly handling)
if (MONGO_URL) {
  mongoose.connect(MONGO_URL)
    .then(() => {
      console.log("✅ Connected to MongoDB");
    })
    .catch((error) => {
      console.error("❌ MongoDB Connection Error: ", error);
    });
} else {
  console.warn("⚠️  MONGO_URI not set - running without database");
}

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/aiTool", promptRoutes);
app.use("/api/v1/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: `Route ${req.originalUrl} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? "Internal server error" 
      : err.message
  });
});

// ✅ CRITICAL CHANGE FOR VERCEL:
// Export the app instead of calling app.listen()
export default app;

// ✅ Optional: Only start server locally
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 4002;
  app.listen(port, () => {
    console.log(`🚀 Server listening locally on port ${port}`);
  });
}