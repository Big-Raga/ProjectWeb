const router = require('express').Router();
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// GET all chats for a user
router.get('/history', auth, async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.userId })
            .sort({ updatedAt: -1 })
            .select('_id title createdAt updatedAt');
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET specific chat with messages
router.get('/:chatId', auth, async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new chat
router.post('/new', auth, async (req, res) => {
    try {
        const newChat = new Chat({
            userId: req.userId,
            title: req.body.title || 'New Chat',
            messages: [{
                sender: 'bot',
                text: "Hello! I'm your AI academic assistant. I can help you with questions about your courses, syllabi, assignments, and university policies. What would you like to know?"
            }]
        });
        await newChat.save();
        res.json(newChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST message to chat
router.post('/message', auth, async (req, res) => {
    const { message, chatId } = req.body;

    try {
        let chat = await Chat.findOne({ _id: chatId, userId: req.userId });
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        // Add user message
        chat.messages.push({ sender: 'user', text: message });

        // Use RAG to generate response
        let botReply = '';
        let sources = [];
        
        try {
            const ragResult = await ragQuery(req.userId, message);
            botReply = ragResult.answer;
            sources = ragResult.sources || [];
            
            // Optionally append sources to message
            if (sources.length > 0) {
                botReply += `\n\n📚 Sources: ${sources.join(', ')}`;
            }
        } catch (err) {
            console.error('RAG query error:', err);
            botReply = "I'm having trouble accessing your documents right now. Please try again in a moment.";
        }

        // Add bot response
        chat.messages.push({ sender: 'bot', text: botReply });
        
        // Update chat title based on first user message
        if (chat.messages.filter(m => m.sender === 'user').length === 1) {
            chat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        }
        
        chat.updatedAt = Date.now();
        await chat.save();

        res.json({ reply: botReply, chat });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: "Failed to process message" });
    }
});

// DELETE chat
router.delete('/:chatId', auth, async (req, res) => {
    try {
        await Chat.findOneAndDelete({ _id: req.params.chatId, userId: req.userId });
        res.json({ msg: 'Chat deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
