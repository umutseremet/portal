// src/frontend/src/components/Layout/Header.js
import React, { useState, useEffect } from 'react';
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

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSidebar?.();
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  // dış tıklama kapatma
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.fullName) return user.fullName;
    if (user?.username) return user.username;
    return 'Admin User';
  };

  const getUserInitials = () => {
    return getUserDisplayName()
      .split(' ')
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="navbar navbar-light header-nav fixed-top">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        
        {/* ✅ Hamburger (tamamen custom, bootstrap collapse yok) */}
        <button
          type="button"
          className="btn d-flex align-items-center justify-content-center me-3"
          onClick={handleMenuToggle}
          style={{
            border: '2px solid #FF6B6B',
            background: sidebarOpen ? '#FF6B6B' : 'white',
            color: sidebarOpen ? 'white' : '#FF6B6B',
            fontSize: '1.5rem',
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="bi bi-list"></i>
        </button>

        {/* Logo */}
        <div className="d-flex align-items-center flex-grow-1">
          <i className="bi bi-calendar-event-fill me-2"></i>
          <h4 className="mb-0 text-dark">vervo</h4>
          <span className="ms-3 text-muted d-none d-lg-block">/ {location.pathname.replace('/', '')}</span>
        </div>

        {/* Sağ taraf */}
        <div className="d-flex align-items-center">
          <button className="btn btn-link">
            <i className="bi bi-bell fs-5"></i>
          </button>
          <button className="btn btn-link">
            <i className="bi bi-gear fs-5"></i>
          </button>

          {/* Kullanıcı Dropdown */}
          <div className="user-dropdown position-relative ms-3">
            <button type="button" className="btn d-flex align-items-center" onClick={toggleDropdown}>
              <div className="rounded-circle bg-danger text-white fw-bold d-flex justify-content-center align-items-center me-2"
                   style={{ width: '36px', height: '36px' }}>
                {getUserInitials()}
              </div>
              <span className="d-none d-sm-block small text-dark">{getUserDisplayName()}</span>
              <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-2 text-muted`}></i>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu dropdown-menu-end show mt-2">
                <button className="dropdown-item">Profilim</button>
                <button className="dropdown-item">Ayarlar</button>
                <hr className="dropdown-divider" />
                <button className="dropdown-item text-danger" onClick={handleLogout} disabled={loading}>
                  {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
