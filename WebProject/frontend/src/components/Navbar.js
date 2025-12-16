import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="container">
      <div className="navbar-container">
        <Link to="/">
          <h2 className="navbar-logo">AcademicBot</h2>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          {isAuthenticated && (
            <>
              <Link to="/" className="navbar-link">Home</Link>
              <Link to="/chat" className="navbar-link">Chat</Link>
              <Link to="/documents" className="navbar-link">Documents</Link>
              <Link to="/resources" className="navbar-link">Resources</Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <button onClick={handleLogoutClick} className="btn btn-outline">Logout</button>
          ) : (
            <Link to="/login">
              <button className="btn btn-primary">Login</button>
            </Link>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isAuthenticated && (
        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/chat" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Chat
          </Link>
          <Link to="/documents" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Documents
          </Link>
          <Link to="/resources" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Resources
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
