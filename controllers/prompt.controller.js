import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prompt } from "../model/prompt.model.js";

const genAI = new GoogleGenerativeAI(process.env.NEW_GEMINI_KEY);

// Initialize the model ONCE
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const sendPrompt = async (req, res) => {
  const { content } = req.body;
  const userId = req.userId;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    // Save user prompt
    await Prompt.create({
      userId,
      role: "user",
      content,
    });

    // Generate AI response using correct Gemini API
    const result = await model.generateContent(content);
    const aiContent = result.response.text();

    // Save AI response
    await Prompt.create({
      userId,
      role: "assistant",
      content: aiContent,
    });

    return res.status(200).json({ reply: aiContent });

  } catch (error) {
    console.error("Error in Prompt:", error);
    return res.status(500).json({
      error: "Something went wrong while generating the AI response",
    });
  }
};
