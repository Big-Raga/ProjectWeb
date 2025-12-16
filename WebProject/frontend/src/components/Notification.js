import React, { useEffect } from 'react';
import '../styles/Notification.css';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Auto close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <h4 className={`notification-title ${type}`}>
        {type === 'success' ? 'Success' : 'Error'}
      </h4>
      <p className="notification-message">{message}</p>
    </div>
  );
};

export default Notification;
