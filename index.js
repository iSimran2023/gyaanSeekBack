import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";
import cors from "cors";

dotenv.config();

console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("MongoDB connected:", !!process.env.MONGO_URI);
console.log("Gemini key exists:", !!process.env.NEW_GEMINI_KEY);
const app = express();
const port = process.env.PORT || 4001;
const MONGO_URL = process.env.MONGO_URI;



// Middleware
app.use(express.json());
app.use(cookieParser());
// index.js - Update CORS section
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',  // Vite default
        'http://localhost:3000',  // Create React App default
        'http://localhost:4000'   // Alternative
      ];
      
      // Also check from environment variable
      const envFrontendUrl = process.env.FRONTEND_URL;
      if (envFrontendUrl && !allowedOrigins.includes(envFrontendUrl)) {
        allowedOrigins.push(envFrontendUrl);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
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