import express from "express";
import { sendPrompt } from "../controllers/prompt.controller.js";
import userMiddleware from "../middleware/prompt.middleware.js";

const router = express.Router();

router.post("/prompt",userMiddleware, sendPrompt);

export default router;

