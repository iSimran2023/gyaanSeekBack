import { Prompt } from "../model/prompt.model.js";

// Get all chats for user — grouped by chatId (not hour!)
export const getUserChats = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log("Fetching chats for user:", userId);
    
    // Get all prompts for user, sorted by createdAt
    const prompts = await Prompt.find({ userId }).sort({ createdAt: 1 });
    
    console.log("Found prompts:", prompts.length);
    
    if (prompts.length === 0) {
      return res.status(200).json({
        success: true,
        chats: []
      });
    }
    
    // Group by chatId (stable, unique)
    const chatsMap = new Map();
    
    prompts.forEach(prompt => {
      if (!chatsMap.has(prompt.chatId)) {
        chatsMap.set(prompt.chatId, {
          id: prompt.chatId,
          title: "New Chat",
          messages: [],
          lastUpdated: prompt.createdAt,
          messageCount: 0,
          firstUserMessage: null
        });
      }
      
      const chat = chatsMap.get(prompt.chatId);
      
      // Store first user message for title
      if (prompt.role === 'user' && !chat.firstUserMessage) {
        chat.firstUserMessage = prompt.content;
        const shortTitle = prompt.content.length > 40 
          ? prompt.content.substring(0, 40) + '...' 
          : prompt.content;
        chat.title = shortTitle;
      }
      
      chat.messages.push({
        role: prompt.role,
        content: prompt.content,
        createdAt: prompt.createdAt
      });
      
      chat.messageCount++;
      if (prompt.createdAt > chat.lastUpdated) {
        chat.lastUpdated = prompt.createdAt;
      }
    });
    
    // Convert map to array and sort by lastUpdated (newest first)
    const chats = Array.from(chatsMap.values())
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    console.log("Sending chats:", chats.length);
    
    res.status(200).json({
      success: true,
      chats: chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messageCount: chat.messageCount,
        lastUpdated: chat.lastUpdated
      }))
    });
    
  } catch (error) {
    console.error("Error in getUserChats:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch chats"
    });
  }
};

// Get messages for a specific chat — by chatId
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    
    console.log("Fetching messages for chat:", chatId, "user:", userId);
    
    const prompts = await Prompt.find({
      userId,
      chatId 
    }).sort({ createdAt: 1 });
    
    console.log("Found prompts in chat:", prompts.length);
    
    if (prompts.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Chat not found" 
      });
    }
    
    const messages = prompts.map(prompt => ({
      role: prompt.role,
      content: prompt.content
    }));
    
    // Get title from first user message
    const firstUserMessage = prompts.find(p => p.role === 'user');
    const title = firstUserMessage 
      ? (firstUserMessage.content.length > 40 
          ? firstUserMessage.content.substring(0, 40) + '...' 
          : firstUserMessage.content)
      : "New Chat";
    
    res.status(200).json({
      success: true,
      chat: {
        id: chatId,
        title,
        messages,
        messageCount: prompts.length
      }
    });
    
  } catch (error) {
    console.error("Error in getChatMessages:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch chat messages"
    });
  }
};

export const updateChatTitle = async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ 
        success: false,
        error: "Title is required" 
      });
    }
    
    // Note: We’re not storing titles in DB — frontend uses localStorage.
    // To store permanently, add `title` field to Prompt or create Chat model later.
    
    res.status(200).json({
      success: true,
      message: "Title updated",
      chatId: req.params.chatId,
      title: title.trim()
    });
    
  } catch (error) {
    console.error("Error in updateChatTitle:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update chat title"
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    
    const result = await Prompt.deleteMany({
      userId,
      chatId 
    });
    
    console.log("Deleted prompts:", result.deletedCount);
    
    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error("Error in deleteChat:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete chat"
    });
  }
};