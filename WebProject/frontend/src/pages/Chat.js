import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ChatSidebar from '../components/ChatSidebar';
import { useChat } from '../hooks';
import '../styles/Chat.css';

const Chat = () => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    chats,
    currentChatId,
    messages,
    loading,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    sendMessage
  } = useChat();

  const [displayMessages, setDisplayMessages] = useState([]);

  // Add greeting message for empty chats after login
  useEffect(() => {
    try {
      const shouldShowGreeting = localStorage.getItem('showGreeting');
      if (shouldShowGreeting && messages.length === 0) {
        const greetingMessage = {
          sender: 'bot',
          text: "Hello! I'm your AI academic assistant. I can help you with questions about your courses, syllabi, assignments, and university policies. What would you like to know?"
        };
        setDisplayMessages([greetingMessage]);
        localStorage.removeItem('showGreeting');
      } else {
        setDisplayMessages(messages);
      }
    } catch (e) {
      setDisplayMessages(messages);
    }
  }, [messages]);

  const handleNewChat = async () => {
    const chat = await createNewChat();
    if (chat) {
      setCurrentChatId(chat._id);
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    await deleteChat(chatId);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    // If no current chat, create one first
    if (!currentChatId) {
      const newChat = await createNewChat();
      if (!newChat) return;
      setCurrentChatId(newChat._id);
    }

    const currentInput = input;
    setInput('');
    await sendMessage(currentInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = [
    'Whats the deadline for assignment 2?',
    'Explain the RAG architecture',
    'How do you use flexbox in CSS'
  ];

  return (
    <div>
      <button
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <div className="chat-layout">
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          sidebarOpen={sidebarOpen}
          onChatSelect={setCurrentChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="chat-container">
          {/* Chat Window */}
          <div className="chat-messages">
            {displayMessages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-sub)',
                  marginTop: 'auto',
                  marginBottom: 'auto'
                }}
              >
                <p>Start a conversation by typing a message below.</p>
              </div>
            ) : (
              displayMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <span className="chat-bot-icon">🤖</span>
                  )}
                  {msg.sender === 'bot' ? (
                    <ReactMarkdown className="markdown-content">
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              ))
            )}

            {loading && <div className="chat-loading">Thinking...</div>}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your courses..."
              className="chat-input"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              className="btn btn-primary chat-send-btn"
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>

          {/* Suggestions */}
          {displayMessages.length === 1 && displayMessages[0].sender === 'bot' && (
            <div className="chat-suggestions">
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="chat-suggestion-btn"
                  disabled={loading}   
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
