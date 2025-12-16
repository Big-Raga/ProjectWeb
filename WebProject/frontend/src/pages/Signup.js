import React, { useState } from 'react';
import Notification from '../components/Notification';
import { useNotification, useAuth } from '../hooks';
import '../styles/Signup.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { notification, showNotification, clearNotification } = useNotification();
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(
      name,
      email, 
      password,
      () => {
        showNotification('Registration Successful! Redirecting to login...', 'success');
      },
      (errorMsg) => {
        showNotification(errorMsg, 'error');
      }
    );
  };

  return (
    <div className="signup-container">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={clearNotification} 
        />
      )}

      <div className="signup-card">
        <h2 className="signup-title">Create Account</h2>
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary signup-submit">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
