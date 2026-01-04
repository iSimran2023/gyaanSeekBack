import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import routes
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";

dotenv.config();

mongoose.set('strictQuery', false);
mongoose.set('autoIndex', true);

const app = express();
const port = process.env.PORT || 4002;
const MONGO_URL = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4000'
    ];
    const envFrontendUrl = process.env.FRONTEND_URL;
    if (envFrontendUrl && !allowedOrigins.includes(envFrontendUrl)) {
      allowedOrigins.push(envFrontendUrl);
    }
    callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// DB
mongoose.connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB Error:", err));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/aiTool", promptRoutes);
app.use("/api/v1/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "API is running",
    env: {
      MONGO_URI: !!process.env.MONGO_URI,
      JWT_PASSWORD: !!process.env.JWT_PASSWORD,
      NEW_GEMINI_KEY: !!process.env.NEW_GEMINI_KEY
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// FINAL EXPORT — ESM + dynamic import (Vercel-compatible)
if (typeof process !== 'undefined' && process.env.VERCEL) {
  // Vercel serverless environment
  const { createServer } = await import('@vercel/node');
  export default createServer(app);
} else {
  // Local development
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}