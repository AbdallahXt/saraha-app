import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Saraha</h1>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <button className="btn-primary" onClick={() => navigate('/auth')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Send & Receive Anonymous Messages</h1>
          <p>Connect with others while maintaining your privacy. Share your thoughts freely without revealing your identity.</p>
          <div className="hero-buttons">
            <button className="btn-primary btn-large" onClick={() => navigate('/auth')}>
              Start Messaging
            </button>
            <button className="btn-secondary btn-large" onClick={scrollToFeatures}>
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="message-bubble">
            <div className="bubble-content">
              <p>"This platform helped me share my honest thoughts without fear"</p>
              <span className="bubble-anonymous">- Anonymous</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why Choose Saraha?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Complete Anonymity</h3>
            <p>Send and receive messages without revealing your identity. Your privacy is our priority.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Delivery</h3>
            <p>Messages are delivered instantly to recipients. No delays, just real-time communication.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Beautiful Interface</h3>
            <p>Enjoy a clean, modern design that makes messaging simple and enjoyable.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Access Saraha from any device. Perfect for messaging on the go.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up with your email and choose a unique username</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Share Your Link</h3>
            <p>Share your unique profile link with friends and connections</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Receive Messages</h3>
            <p>Get anonymous messages and respond privately</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
