// src/frontend/src/components/Layout/Header.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  // ✅ DÜZELTME: Hamburger menu handler
  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Hamburger clicked! Current sidebar state:', sidebarOpen);
    
    if (toggleSidebar) {
      toggleSidebar();
    } else {
      console.error('toggleSidebar function not available!');
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/production':
        return 'Üretim Planlama';
      case '/visitors':
        return 'Ziyaretçiler';
      default:
        return 'Dashboard';
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.fullName) {
      return user.fullName;
    }
    if (user?.username) {
      return user.username;
    }
    return 'Admin User';
  };

  const getUserEmail = () => {
    return user?.email || 'admin@acara.com';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light header-nav fixed-top">
      <div className="container-fluid">
        {/* ✅ DÜZELTME: Hamburger Menu + Brand */}
        <div className="d-flex align-items-center">
          {/* Hamburger Menu Button - Tüm ekranlarda görünür */}
          <button
            className="hamburger-menu-btn me-3"
            type="button"
            onClick={handleMenuToggle}
            aria-label="Toggle navigation"
            style={{
              border: '2px solid #FF6B6B',
              background: 'white',
              color: '#FF6B6B',
              padding: '8px 12px',
              borderRadius: '8px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#FF6B6B';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#FF6B6B';
            }}
          >
            <i className={`bi ${sidebarOpen ? 'bi-x' : 'bi-list'} fs-5`}></i>
          </button>

          {/* Brand */}
          <div className="d-flex align-items-center">
            <div 
              className="logo-icon me-2"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}
            >
              <i className="bi bi-calendar-event-fill"></i>
            </div>
            <h4 className="logo-text mb-0 text-dark fw-bold">vervo</h4>
            
            {/* Page Title - Desktop only */}
            <span className="page-title-desktop ms-4 text-muted d-none d-lg-block">
              / {getPageTitle()}
            </span>
          </div>
        </div>

        {/* ✅ DÜZELTME: Right Side Actions */}
        <div className="d-flex align-items-center gap-3">
          {/* Search Bar - Desktop only */}
          <div className="search-container d-none d-md-block">
            <div className="position-relative">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Ara..."
                style={{ paddingLeft: '40px', width: '300px' }}
              />
              <i 
                className="bi bi-search position-absolute" 
                style={{
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d'
                }}
              ></i>
            </div>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Notifications */}
            <button className="btn btn-link header-btn p-0">
              <i className="bi bi-bell fs-5"></i>
              <span className="position-absolute translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem', top: '8px', right: '8px' }}>
                3
              </span>
            </button>

            {/* Settings */}
            <button className="btn btn-link header-btn p-0">
              <i className="bi bi-gear fs-5"></i>
            </button>

            {/* User Dropdown */}
            <div className="user-dropdown position-relative">
              <button
                className="btn btn-link d-flex align-items-center p-0"
                onClick={toggleDropdown}
                style={{ textDecoration: 'none' }}
              >
                <div 
                  className="user-avatar me-2"
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {getUserInitials()}
                </div>
                <div className="d-none d-sm-block">
                  <div className="text-start">
                    <div className="user-name fw-medium text-dark" style={{ fontSize: '14px' }}>
                      {getUserDisplayName()}
                    </div>
                    <div className="user-role text-muted" style={{ fontSize: '12px' }}>
                      Administrator
                    </div>
                  </div>
                </div>
                <i className="bi bi-chevron-down ms-2 text-muted"></i>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div 
                  className="dropdown-menu show position-absolute"
                  style={{
                    top: '100%',
                    right: '0',
                    marginTop: '8px',
                    minWidth: '200px',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999
                  }}
                >
                  <div className="dropdown-header">
                    <div className="fw-medium">{getUserDisplayName()}</div>
                    <div className="text-muted small">{getUserEmail()}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-person me-2"></i>
                    Profil
                  </a>
                  <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-gear me-2"></i>
                    Ayarlar
                  </a>
                  <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-question-circle me-2"></i>
                    Yardım
                  </a>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;