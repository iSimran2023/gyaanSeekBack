import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prompt } from "../model/prompt.model.js";

const genAI = new GoogleGenerativeAI(process.env.NEW_GEMINI_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Store active chats in memory (or use Redis in production)
const activeChats = new Map();

export const sendPrompt = async (req, res) => {
  const { content, chatId } = req.body;
  const userId = req.userId;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    let currentChatId = chatId;
    
    // If no chatId provided or chatId doesn't exist, create new chat session
    if (!currentChatId || !activeChats.has(`${userId}-${currentChatId}`)) {
      currentChatId = Date.now().toString(); // Simple timestamp as chatId
      activeChats.set(`${userId}-${currentChatId}`, {
        userId,
        chatId: currentChatId,
        lastActivity: Date.now()
      });
    }

    // Save user prompt
    await Prompt.create({
      userId,
      role: "user",
      content,
    });

    // Generate AI response
    const result = await model.generateContent(content);
    const aiContent = result.response.text();

    // Save AI response
    await Prompt.create({
      userId,
      role: "assistant",
      content: aiContent,
    });

    // Update last activity
    activeChats.set(`${userId}-${currentChatId}`, {
      ...activeChats.get(`${userId}-${currentChatId}`),
      lastActivity: Date.now()
    });

    return res.status(200).json({ 
      reply: aiContent,
      chatId: currentChatId // Return chatId to frontend
    });

  } catch (error) {
    console.error("Error in Prompt:", error);
    return res.status(500).json({
      error: "Something went wrong while generating the AI response",
    });
  }
};