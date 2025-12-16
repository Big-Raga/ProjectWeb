import React, { useState } from 'react';
import Notification from '../components/Notification';
import { useNotification, useAuth } from '../hooks';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { notification, showNotification, clearNotification } = useNotification();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(
      email, 
      password,
      (token) => {
        showNotification('Login Successful!', 'success');
        onLogin(token);
      },
      (errorMsg) => {
        showNotification(errorMsg, 'error');
      }
    );
  };

  return (
    <div className="login-container">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={clearNotification} 
        />
      )}
      
      <div className="login-card">
        <h2 className="login-title">AcademicBot</h2>
        <p className="login-subtitle">Access your personalized learning dashboard</p>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary login-submit">Login</button>
        </form>
        <p className="login-signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
