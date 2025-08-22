import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement login API call
    console.log('Login data:', loginData);
    // Simulate successful login
    navigate('/dashboard');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement register API call
    console.log('Register data:', registerData);
    // Simulate successful registration
    navigate('/verify-otp', { state: { email: registerData.email } });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' && (
          <div className="auth-form-container">
            <h2>Welcome Back</h2>
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-full">
                Login
              </button>
            </form>
            <p className="auth-link">
              Don't have an account?{' '}
              <span onClick={() => setActiveTab('register')}>Register</span>
            </p>
            <p className="auth-link">
              <span onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </span>
            </p>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="auth-form-container">
            <h2>Create Account</h2>
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-full">
                Register
              </button>
            </form>
            <p className="auth-link">
              Already have an account?{' '}
              <span onClick={() => setActiveTab('login')}>Login</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
