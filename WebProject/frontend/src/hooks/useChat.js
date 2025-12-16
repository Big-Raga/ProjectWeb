import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';

const useChat = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadChatHistory = useCallback(async () => {
    try {
      const res = await api.get('/chat/history');
      setChats(res.data);
      
      if (res.data.length > 0) {
        setCurrentChatId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  }, []);

  const loadChatMessages = useCallback(async (chatId) => {
    try {
      const res = await api.get(`/chat/${chatId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages', err);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId, loadChatMessages]);

  const createNewChat = async () => {
    try {
      // Check if a "New Chat" already exists
      const existingNewChat = chats.find(chat => chat.title === 'New Chat');
      if (existingNewChat) {
        setCurrentChatId(existingNewChat._id);
        setMessages(existingNewChat.messages || []);
        return existingNewChat;
      }

      // Only create a new chat if "New Chat" doesn't exist
      const res = await api.post('/chat/new', {});
      setChats(prevChats => [res.data, ...prevChats]);
      setCurrentChatId(res.data._id);
      setMessages(res.data.messages || []);
      return res.data;
    } catch (err) {
      console.error('Failed to create new chat', err);
      return null;
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}`);
      const updatedChats = chats.filter(c => c._id !== chatId);
      setChats(updatedChats);
      
      if (currentChatId === chatId) {
        if (updatedChats.length > 0) {
          setCurrentChatId(updatedChats[0]._id);
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const sendMessage = async (input) => {
    if (!input.trim() || loading || !currentChatId) return;

    const currentInput = input.trim();
    const userMessage = { sender: 'user', text: currentInput };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.post('/chat/message', { 
        message: currentInput,
        chatId: currentChatId
      });
      
      const botMessage = { sender: 'bot', text: res.data.reply };
      setMessages(prev => [...prev, botMessage]);
      
      if (res.data.chat) {
        const updatedChats = chats.map(c => 
          c._id === currentChatId 
            ? { ...c, title: res.data.chat.title, updatedAt: res.data.chat.updatedAt } 
            : c
        );
        setChats(updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting to the server." };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  return {
    chats,
    currentChatId,
    messages,
    loading,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    sendMessage
  };
};

export default useChat;
