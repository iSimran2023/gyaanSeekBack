import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

// Routes
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
import chatRoutes from "./routes/chat.route.js";

const app = express();
const port = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI; 

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      /\.vercel\.app$/,
      'https://gyaanseek-front.vercel.app'
    ];
    callback(null, allowed.some(o => typeof o === 'string' ? origin === o : o.test(origin)));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// DB — only if MONGO_URI is set (Vercel env)
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Error:", err.message));
} else {
  console.warn("⚠️ MONGO_URI not set — DB disabled");
}

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/aiTool", promptRoutes);
app.use("/api/v1/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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

// EXPORT FOR VERCEL (no require, no conditional export)
export default app;