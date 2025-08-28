// ===== DÜZELTME 3: src/frontend/src/components/Layout/Header.js =====

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
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  const handleMenuToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    } else {
      console.error('toggleSidebar function not available!');
    }
  };

  // ✅ DÜZELTME: Menü adlarını kullan, içerik başlık değil 
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/production':
        return 'Üretim Planlama';
      case '/visitors':
        return 'Ziyaretçiler'; // ✅ Menü adı olarak "Ziyaretçiler" kullan
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

  const getUserRole = () => {
    return user?.role || 'admin';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light header-nav fixed-top">
      <div className="container-fluid">
        {/* Sidebar Toggle + Brand */}
        <div className="d-flex align-items-center">
          <button
            className="btn navbar-toggler d-lg-none me-3"
            type="button"
            onClick={handleMenuToggle}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '1.25rem',
              color: '#FF6B6B'
            }}
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
          
          {/* ✅ DÜZELTME: Dynamic page title */}
          <span className="navbar-brand mb-0 h1 d-none d-md-block">
            {getPageTitle()}
          </span>
        </div>

        {/* Search Box - Orta */}
        <div className="flex-grow-1 mx-4 d-none d-lg-block">
          <div className="position-relative" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <input
              className="form-control pe-5"
              type="search"
              placeholder="Ara..."
              style={{
                backgroundColor: '#f8f9fa',
                border: '2px solid #e9ecef',
                borderRadius: '25px',
                paddingLeft: '1rem',
                paddingRight: '3rem'
              }}
            />
            <div className="position-absolute" style={{ right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
              <i className="bi bi-search text-muted"></i>
            </div>
          </div>
        </div>

        {/* User Dropdown - Sağ */}
        <div className="d-flex align-items-center">
          {/* Notifications */}
          <button className="btn btn-link text-decoration-none position-relative me-3 d-none d-md-block">
            <i className="bi bi-bell fs-5 text-muted"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
              3
            </span>
          </button>

          {/* User Dropdown */}
          <div className="dropdown user-dropdown">
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center"
              type="button"
              onClick={toggleDropdown}
              style={{ border: 'none', background: 'none' }}
            >
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white fw-bold"
                style={{
                  width: '35px',
                  height: '35px',
                  background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                  fontSize: '0.875rem'
                }}
              >
                {getUserInitials()}
              </div>
              <div className="d-none d-md-block text-start me-2">
                <div className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>
                  {getUserDisplayName()}
                </div>
                <div className="text-muted small">
                  {getUserRole()}
                </div>
              </div>
              <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} text-muted`}></i>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className="dropdown-menu dropdown-menu-end show"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  zIndex: 1050,
                  minWidth: '250px',
                  marginTop: '0.5rem',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                }}
              >
                {/* User Info Header */}
                <div className="px-4 py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-3 text-white fw-bold"
                      style={{
                        width: '45px',
                        height: '45px',
                        background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                        fontSize: '1rem'
                      }}
                    >
                      {getUserInitials()}
                    </div>
                    <div>
                      <div className="fw-medium text-dark">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-muted small">
                        {getUserEmail()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="dropdown-item d-flex align-items-center py-2 px-4">
                    <i className="bi bi-person me-3 text-muted"></i>
                    Profilim
                  </button>
                  <button className="dropdown-item d-flex align-items-center py-2 px-4">
                    <i className="bi bi-gear me-3 text-muted"></i>
                    Ayarlar
                  </button>
                  <button className="dropdown-item d-flex align-items-center py-2 px-4">
                    <i className="bi bi-question-circle me-3 text-muted"></i>
                    Yardım
                  </button>
                  <hr className="dropdown-divider" />
                  <button 
                    className="dropdown-item d-flex align-items-center py-2 px-4 text-danger"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    <i className="bi bi-box-arrow-right me-3"></i>
                    {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;