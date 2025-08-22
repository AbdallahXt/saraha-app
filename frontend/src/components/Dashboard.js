import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const navigate = useNavigate();

  // Sample messages data
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "I really appreciate your work on the project!",
      timestamp: "2 hours ago",
      isRead: false
    },
    {
      id: 2,
      content: "Your presentation was amazing yesterday!",
      timestamp: "1 day ago",
      isRead: true
    },
    {
      id: 3,
      content: "Thank you for your help with the assignment!",
      timestamp: "3 days ago",
      isRead: true
    }
  ]);

  const [profile, setProfile] = useState({
    username: "john_doe",
    email: "john@example.com",
    avatar: null,
    messageCount: messages.length
  });

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logging out...');
    navigate('/');
  };

  const deleteMessage = (messageId) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };

  const copyProfileLink = () => {
    const profileLink = `${window.location.origin}/send/${profile.username}`;
    navigator.clipboard.writeText(profileLink);
    alert('Profile link copied to clipboard!');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Saraha Dashboard</h1>
          <div className="header-actions">
            <button className="btn-secondary" onClick={copyProfileLink}>
              Copy My Link
            </button>
            <button className="btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3>{profile.username}</h3>
            <p>{profile.email}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{profile.messageCount}</span>
                <span className="stat-label">Messages</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              📨 Messages
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'messages' && (
            <div className="messages-section">
              <div className="section-header">
                <h2>Your Messages</h2>
                <span className="badge">{messages.length}</span>
              </div>
              
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p>No messages yet. Share your link to receive anonymous messages!</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map(message => (
                    <div key={message.id} className={`message-card ${!message.isRead ? 'unread' : ''}`}>
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">{message.timestamp}</span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => deleteMessage(message.id)}
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>Profile Settings</h2>
              <div className="profile-form">
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={profile.username} readOnly />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={profile.email} readOnly />
                </div>
                <button className="btn-primary">Update Profile</button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h2>Account Settings</h2>
              <div className="settings-options">
                <button className="settings-item">
                  Change Password
                </button>
                <button className="settings-item">
                  Notification Settings
                </button>
                <button className="settings-item danger">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
