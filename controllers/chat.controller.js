import { Prompt } from "../model/prompt.model.js";

// Helper function to generate chatId from timestamp
const generateChatIdFromTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  
  return `${year}${month}${day}_${hour}`;
};

// Parse chatId to get date range
const parseChatIdToDateRange = (chatId) => {
  try {
    const [datePart, hourPart] = chatId.split('_');
    
    if (!datePart || !hourPart) {
      throw new Error('Invalid chatId format');
    }
    
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(hourPart);
    
    const startTime = new Date(year, month, day, hour, 0, 0);
    const endTime = new Date(year, month, day, hour + 1, 0, 0);
    
    return { startTime, endTime };
  } catch (error) {
    console.error("Error parsing chatId:", chatId, error);
    // Fallback: return a default range if parsing fails
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    return { startTime, endTime };
  }
};

// Get all chats for user
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
    
    // Group prompts by hour
    const chatsMap = new Map();
    
    prompts.forEach(prompt => {
      try {
        const chatId = generateChatIdFromTimestamp(prompt.createdAt);
        
        if (!chatsMap.has(chatId)) {
          chatsMap.set(chatId, {
            id: chatId,
            title: `Chat ${new Date(prompt.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}`,
            messages: [],
            lastUpdated: prompt.createdAt,
            messageCount: 0,
            firstUserMessage: null
          });
        }
        
        const chat = chatsMap.get(chatId);
        
        // Store first user message for title
        if (prompt.role === 'user' && !chat.firstUserMessage) {
          chat.firstUserMessage = prompt.content;
          // Set title from first user message (truncate if too long)
          if (prompt.content.length > 0) {
            const shortContent = prompt.content.length > 40 
              ? prompt.content.substring(0, 40) + '...' 
              : prompt.content;
            chat.title = shortContent;
          }
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
      } catch (error) {
        console.error("Error processing prompt:", error);
      }
    });
    
    // Convert map to array and sort by lastUpdated
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
      error: "Failed to fetch chats",
      details: error.message 
    });
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    
    console.log("Fetching messages for chat:", chatId, "user:", userId);
    
    const { startTime, endTime } = parseChatIdToDateRange(chatId);
    
    const prompts = await Prompt.find({
      userId,
      createdAt: { 
        $gte: startTime, 
        $lt: endTime 
      }
    }).sort({ createdAt: 1 });
    
    console.log("Found prompts in range:", prompts.length);
    
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
      : `Chat ${startTime.toLocaleString()}`;
    
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
      error: "Failed to fetch chat messages",
      details: error.message 
    });
  }
};

// Update chat title
export const updateChatTitle = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ 
        success: false,
        error: "Title is required" 
      });
    }
    
    // In this implementation, we're not storing titles in the database
    // This would require adding a Chat model or storing titles separately
    // For now, we'll just acknowledge the request
    
    res.status(200).json({
      success: true,
      message: "Title updated (frontend should store in localStorage)",
      chatId,
      title: title.trim()
    });
    
  } catch (error) {
    console.error("Error in updateChatTitle:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update chat title",
      details: error.message 
    });
  }
};

// Delete chat (delete all prompts in that time range)
export const deleteChat = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    
    const { startTime, endTime } = parseChatIdToDateRange(chatId);
    
    const result = await Prompt.deleteMany({
      userId,
      createdAt: { 
        $gte: startTime, 
        $lt: endTime 
      }
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
      error: "Failed to delete chat",
      details: error.message 
    });
  }
};