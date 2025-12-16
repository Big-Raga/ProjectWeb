import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to AcademicBot</h1>

      <p className="home-description">
        Your centralized academic support platform powered by AI. Get instant answers, access resources,
        and receive personalized guidance throughout your academic journey.
      </p>

      <div className="home-cta">
        {!isAuthenticated ? (
          <>
            <Link to="/signup">
              <button className="btn btn-primary home-cta-btn">Get Started</button>
            </Link>
            <Link to="/login">
              <button className="btn btn-outline home-cta-btn">Login</button>
            </Link>
          </>
        ) : (
          <Link to="/chat">
            <button className="btn btn-primary home-cta-btn">Go to Chatbot</button>
          </Link>
        )}
      </div>

      <h3 className="home-features-title">Core Features</h3>

      <div className="home-features-grid">
        {[ 
          { title: "AI powered Q&A", desc: "Get instant answers to your academic questions using our advanced RAG chatbot." },
          { title: "Course Resources", desc: "Access syllabus, notes, policies, and study materials all in one place." },
          { title: "Mental Health Support", desc: "Find tips, resources, and supportive tools for managing academic stress." }
        ].map((feature, index) => (
          <div key={index} className="home-feature-card">
            <h4 className="home-feature-title">{feature.title}</h4>
            <p className="home-feature-desc">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
