import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Resources from './pages/Resources';
import Documents from './pages/Documents';
import api from './api/axios';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on app load
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Test token validity with a protected endpoint
          await api.get('/chat/history');
          setIsAuthenticated(true);
        } catch (err) {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('showGreeting');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('showGreeting');
    setIsAuthenticated(false);
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          color: 'var(--text-main)'
        }}>
          Loading...
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Auth Route Wrapper (redirects to chat if already logged in)
  const AuthRoute = ({ children }) => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          color: 'var(--text-main)'
        }}>
          Loading...
        </div>
      );
    }
    
    if (isAuthenticated) {
      return <Navigate to="/chat" replace />;
    }
    return children;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        color: 'var(--text-main)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={
          <div className="container">
            <Home isAuthenticated={isAuthenticated} />
          </div>
        } />
        <Route path="/login" element={
          <AuthRoute>
            <Login onLogin={handleLogin} />
          </AuthRoute>
        } />
        <Route path="/signup" element={
          <AuthRoute>
            <Signup />
          </AuthRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/resources" element={
          <ProtectedRoute>
            <div className="container">
              <Resources />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
