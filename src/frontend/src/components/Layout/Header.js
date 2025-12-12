// src/frontend/src/components/Layout/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar, sidebarOpen, isMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle hamburger menu click
  const handleHamburgerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🍔 Header: Hamburger clicked, current sidebar state:', sidebarOpen);
    console.log('🍔 Header: isMobile:', isMobile);
    
    // React state'i güncelle
    toggleSidebar();
    
    // Eski assets/js kodları ile uyumluluk için
    if (typeof window.toggleSidebar === 'function') {
      window.toggleSidebar();
    }
  };

  // Handle user dropdown toggle
  const handleDropdownToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(prev => !prev);
  };

  // Handle logout
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.fullName || user.name || user.email || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header 
      className="header-nav navbar navbar-expand-lg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        zIndex: 1050,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
        padding: '0'
      }}
    >
      <div 
        className="container-fluid"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          justifyContent: 'space-between'
        }}
      >
        {/* Left Side - Hamburger Menu */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className="hamburger-menu-btn"
            onClick={handleHamburgerClick}
            type="button"
            aria-label="Toggle sidebar"
            style={{
              border: '2px solid #FF6B6B',
              backgroundColor: 'white',
              color: '#FF6B6B',
              padding: '8px 12px',
              borderRadius: '8px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#FF6B6B';
              e.target.style.color = 'white';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#FF6B6B';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="bi bi-list" style={{ fontSize: '1.25rem' }}></i>
          </button>

          {/* Portal Title (Desktop Only) */}
          {!isMobile && (
            <div style={{ marginLeft: '1rem' }}>
              <h5 style={{ margin: 0, color: '#212529', fontWeight: '600' }}>
                Aslan Group Portal
              </h5>
              <small style={{ color: '#6c757d' }}>Yönetim Paneli</small>
            </div>
          )}
        </div>

        {/* Right Side - User Actions */}
        <div 
          className="header-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {/* Notifications */}
          <button
            className="btn btn-link"
            style={{
              color: '#6c757d',
              padding: '8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            <i className="bi bi-bell" style={{ fontSize: '1.1rem' }}></i>
          </button>

          {/* User Dropdown */}
          <div className="dropdown" ref={dropdownRef}>
            <button
              className="btn btn-link dropdown-toggle"
              onClick={handleDropdownToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* User Avatar */}
              <div
                className="user-avatar"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600' , textDecoration: 'none'
                }}
              >
                {getUserInitials()}
              </div>
              
              {/* User Name (Desktop Only) */}
              {!isMobile && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                    {user?.fullName || user?.name || 'Kullanıcı'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    {user?.mail || 'user@example.com'}
                  </div>
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="dropdown-menu show"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  minWidth: '200px',
                  backgroundColor: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  marginTop: '8px',
                  padding: '8px 0', 
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                    {user?.fullName || user?.name || 'Kullanıcı'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    {user?.mail || 'user@example.com'}
                  </div>
                </div>
                
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#212529',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="bi bi-person me-2"></i>
                  Profil
                </button>
                
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#212529',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="bi bi-gear me-2"></i>
                  Ayarlar
                </button>
                
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
                
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#dc3545',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;