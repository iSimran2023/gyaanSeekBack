import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose"; // ← add this if missing
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";
import cors from "cors";

dotenv.config();

// FIX: Enable autoIndex BEFORE connecting
mongoose.set('strictQuery', false);
mongoose.set('autoIndex', true); 

console.log("Environment variables loaded:");

const app = express();
const port = process.env.PORT || 4002; 
const MONGO_URL = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS (unchanged)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',  // Vite default
        'http://localhost:3000',  // Create React App default
        'http://localhost:4000'   // Alternative
      ];
      
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
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'] 
  })
);

// DB connection (simplified)
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log(" Connected to MongoDB");
    // Optional: Log indexes after connect
    mongoose.connection.db.collection('prompts').indexInformation()
      .then(indexes => {
        console.log('Existing indexes:', Object.keys(indexes));
        if (!indexes['chatId_1']) {
          console.warn('chatId index missing — create it in Atlas!');
        }
      });
  })
  .catch((error) => console.error("MongoDB Connection Error: ", error));

// Routes (unchanged)
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/aiTool", promptRoutes);
app.use("/api/v1/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
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
    error: "Internal server error"
  });
});

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

// Vercel-compatible export (keeps local dev working too)
if (process.env.NODE_ENV === 'production') {
  // For Vercel — export handler
  import { createServer } from '@vercel/node';
  export default createServer(app);
} else {
  // For local dev — keep app.listen
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}