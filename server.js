import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import routes
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";

const app = express();
const port = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS — allow all for testing
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// DB — only if MONGO_URI is set
console.log("🔍 MONGO_URI exists:", !!MONGO_URI);
console.log("🔍 MONGO_URI length:", MONGO_URI?.length);

if (MONGO_URI) {
  console.log(" Attempting MongoDB connection...");
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast (5 seconds)
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
  })
  .catch(err => {
    console.error(" MongoDB connection FAILED:", err.message);
    console.error(" Atlas tip: Is 0.0.0.0/0 whitelisted in Network Access?");
    console.error(" URI format: mongodb+srv://<user>:<pass>@cluster...");
  });
} else {
  console.warn(" MONGO_URI is missing — check Vercel env vars");
}

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/aiTool", promptRoutes);
app.use("/api/v1/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: "OK",
    db: states[dbState],
    env: {
      MONGO_URI: !!MONGO_URI,
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
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

export default app;