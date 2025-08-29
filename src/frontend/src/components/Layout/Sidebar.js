// src/frontend/src/components/Layout/Sidebar.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', path: '/dashboard' },
    { id: 'production', label: 'Üretim Planlama', icon: 'bi-gear-fill', path: '/production' },
    { id: 'visitors', label: 'Ziyaretçiler', icon: 'bi-people-fill', path: '/visitors' }
  ];

  const handleMenuClick = (path, e) => {
    e.preventDefault();
    navigate(path);

    // Mobile'da menüye tıklayınca sidebar'ı kapat
    if (isMobile && isOpen) {
      setTimeout(() => toggleSidebar(), 100);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div
        className={`sidebar ${isOpen ? 'show' : ''}`} 
      >
      {/* Sidebar Header */}
      <div
        className="sidebar-header"
        style={{
          padding: '2rem 1.5rem 1rem',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div className="d-flex align-items-center">
          <div
            className="logo-icon"
            style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}
          >
            <i className="bi bi-calendar-event-fill"></i>
          </div>
          <h4 className="logo-text mb-0 ms-3 fw-bold text-dark">vervo</h4>
        </div>

        {/* Close button sadece mobile'da */}
        {isMobile && (
          <button
            className="btn btn-link text-muted p-1"
            onClick={toggleSidebar}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="sidebar-content" style={{ padding: '1rem 0' }}>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div
              className="nav-section-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1.5rem',
                color: '#6c757d',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '0.5rem'
              }}
            >
              <i className="bi bi-house-door me-2"></i>
              Ana Menü
            </div>

            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={(e) => handleMenuClick(item.path, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  margin: '0 0.5rem 0.25rem 0.5rem',
                  background: isActive(item.path) ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: isActive(item.path) ? '#FF6B6B' : '#6c757d',
                  fontSize: '0.95rem',
                  fontWeight: isActive(item.path) ? '600' : '500',
                  textAlign: 'left',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <i className={`bi ${item.icon} me-3`} style={{ fontSize: '18px' }}></i>
                <span className="nav-text">{item.label}</span>

                {isActive(item.path) && (
                  <div
                    className="nav-indicator"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '20px',
                      background: '#FF6B6B',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
