import React from 'react';
import '../styles/ChatSidebar.css';

const ChatSidebar = ({ 
  chats, 
  currentChatId, 
  sidebarOpen, 
  onChatSelect, 
  onNewChat, 
  onDeleteChat,
  onClose 
}) => {
  return (
    <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="chat-sidebar-header">
        <h3 className="chat-sidebar-title">Chat History</h3>
        <button onClick={onNewChat} className="btn btn-primary new-chat-btn">
          + New
        </button>
      </div>
      
      <div className="chat-history-list">
        {chats.map(chat => (
          <div 
            key={chat._id} 
            className={`chat-history-item ${currentChatId === chat._id ? 'active' : ''}`}
            onClick={() => {
              onChatSelect(chat._id);
              onClose();
            }}
          >
            <span className="chat-history-title">{chat.title}</span>
            <button 
              className="delete-chat-btn" 
              onClick={(e) => onDeleteChat(chat._id, e)}
              title="Delete chat"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
