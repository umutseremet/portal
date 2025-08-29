// src/frontend/src/components/Layout/Sidebar.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      path: '/dashboard'
    },
    {
      id: 'production',
      label: 'Üretim Planlama',
      icon: 'bi-gear-fill',
      path: '/production'
    },
    {
      id: 'visitors',
      label: 'Ziyaretçiler',
      icon: 'bi-people-fill',
      path: '/visitors'
    }
  ];

  // ✅ DÜZELTME: Menu click handler
  const handleMenuClick = (path, e) => {
    e.preventDefault();
    console.log('📍 Menu clicked:', path);
    
    navigate(path);
    
    // Mobile'da menüye tıklayınca sidebar'ı kapat
    if (isMobile && isOpen) {
      console.log('📱 Mobile menu click, closing sidebar');
      setTimeout(() => toggleSidebar(), 100); // Küçük delay ile smooth geçiş
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ✅ SIDEBAR */}
      <div
        className={`sidebar ${isOpen ? 'show' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : -280,
          width: 280,
          height: '100vh',
          background: 'white',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
          zIndex: isMobile ? 1040 : 1020,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          borderRight: '1px solid #e9ecef'
        }}
      >
        {/* ✅ SIDEBAR HEADER */}
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
          
          {/* ✅ CLOSE BUTTON - Sadece mobile'da göster */}
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

        {/* ✅ SIDEBAR CONTENT */}
        <div className="sidebar-content" style={{ padding: '1rem 0' }}>
          {/* Main Navigation */}
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
              
              {menuItems.map(item => (
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
                    background: isActive(item.path) 
                      ? 'rgba(255, 107, 107, 0.1)' 
                      : 'transparent',
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
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
                      e.target.style.color = '#FF6B6B';
                      e.target.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#6c757d';
                      e.target.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <i className={`bi ${item.icon} me-3`} style={{ fontSize: '18px' }}></i>
                  <span className="nav-text">{item.label}</span>
                  
                  {/* Active indicator */}
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

          {/* ✅ SIDEBAR FOOTER */}
          <div 
            className="sidebar-footer"
            style={{
              marginTop: '2rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e9ecef'
            }}
          >
            <div 
              className="upgrade-card"
              style={{
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                padding: '1.5rem',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}
            >
              <div className="upgrade-icon mb-2">
                <i className="bi bi-star-fill" style={{ fontSize: '24px' }}></i>
              </div>
              <h6 className="fw-bold mb-1">Vervo Pro</h6>
              <p className="small mb-3 opacity-75">
                Daha fazla özellik ve analiz için yükseltin
              </p>
              <button 
                className="btn btn-light btn-sm fw-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Yükselt
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;