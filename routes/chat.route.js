import express from "express";
import { 
  getUserChats, 
  getChatMessages, 
  updateChatTitle, 
  deleteChat 
} from "../controllers/chat.controller.js";
import userMiddleware from "../middleware/prompt.middleware.js";

const router = express.Router();

// All chat routes
router.get("/chats", userMiddleware, getUserChats);
router.get("/chats/:chatId", userMiddleware, getChatMessages);
router.patch("/chats/:chatId/title", userMiddleware, updateChatTitle);
router.delete("/chats/:chatId", userMiddleware, deleteChat);

export default router;