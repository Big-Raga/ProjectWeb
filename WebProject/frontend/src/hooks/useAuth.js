import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5001/api';

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email, password, onSuccess, onError) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      onSuccess(res.data.token);
      // Show greeting popup on next page after successful login
      try { localStorage.setItem('showGreeting', '1'); } catch (e) {}
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
    } catch (err) {
      onError(err.response?.data?.msg || 'Login Failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const signup = async (name, email, password, onSuccess, onError) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/register`, { name, email, password });
      onSuccess();
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      onError(err.response?.data?.msg || 'Signup Failed. Try again.');
    }
    setLoading(false);
  };

  return {
    login,
    signup,
    loading
  };
};

export default useAuth;
