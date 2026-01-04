import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prompt } from "../model/prompt.model.js";
import { nanoid } from 'nanoid';


const genAI = new GoogleGenerativeAI(process.env.NEW_GEMINI_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Store active chats in memory
const activeChats = new Map();

export const sendPrompt = async (req, res) => {
  const { content, chatId } = req.body;
  const userId = req.userId;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    const currentChatId = chatId || nanoid(12);

    await Prompt.create({
      userId,
      chatId: currentChatId,
      role: "user",
      content: content.trim(),
    });

    //  Wrap AI call in try-catch
    let aiContent = "Sorry, I couldn't generate a response.";
    try {
      const result = await model.generateContent(content);
      aiContent = result.response.text();
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      aiContent = "AI service is temporarily unavailable. Please try again later.";
    }

    await Prompt.create({
      userId,
      chatId: currentChatId,
      role: "assistant",
      content: aiContent,
    });

    return res.status(200).json({ 
      reply: aiContent,
      chatId: currentChatId
    });

  } catch (error) {
    console.error("Unexpected error in sendPrompt:", error); 
    return res.status(500).json({
      error: "Something went wrong while generating the AI response",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};