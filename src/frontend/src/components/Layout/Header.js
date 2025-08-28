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

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/production':
        return 'Üretim Planlama';
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
    return user?.admin ? 'admin' : (user?.role || 'user');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container-fluid">
        {/* HAMBURGER MENU BUTTON - Tüm Ekranlarda Görünür */}
        <button
          className="btn btn-outline-danger me-3 hamburger-menu-btn"
          onClick={handleMenuToggle}
          aria-label="Toggle sidebar"
          type="button"
          disabled={loading}
        >
          <i className="bi bi-list fs-4"></i>
        </button>

        {/* Page Title - Desktop Only */}
        <div className="flex-grow-1 mx-4 d-none d-md-block">
          <h4 className="mb-0 text-dark fw-bold">{getPageTitle()}</h4>
        </div>

        {/* Mobile Brand */}
        <div className="d-lg-none flex-grow-1">
          <span className="navbar-brand mb-0 h1 text-danger fw-bold">
            <i className="bi bi-calendar-event-fill me-2"></i>
            acara
          </span>
        </div> 

        {/* Right Side Actions */}
        <div className="d-flex align-items-center gap-2">
          {/* Mobile Search Toggle */}
          <button className="btn btn-link text-dark d-md-none p-2">
            <i className="bi bi-search fs-5"></i>
          </button>

          {/* Notifications */}
          <button className="btn btn-link text-dark position-relative p-2">
            <i className="bi bi-bell fs-5"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              3
            </span>
          </button>

           

          {/* User Dropdown */}
          <div className="dropdown user-dropdown">
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center p-2"
              onClick={toggleDropdown}
              aria-expanded={dropdownOpen}
              disabled={loading}
            >
              {/* User Avatar */}
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger text-white me-2" 
                   style={{ width: '40px', height: '40px', fontSize: '0.875rem', fontWeight: '600' }}>
                {getUserInitials()}
              </div>
              
              <div className="d-none d-lg-block text-start">
                <div className="fw-semibold text-dark small">{getUserDisplayName()}</div>
                <div className="text-muted small">{getUserRole()}</div>
              </div>
              <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-2 text-muted small d-none d-lg-inline`}></i>
            </button>

            {dropdownOpen && (
              <ul className="dropdown-menu dropdown-menu-end show shadow border-0">
                <li>
                  <div className="dropdown-header">
                    <div className="fw-semibold">{getUserDisplayName()}</div>
                    <div className="text-muted small">{getUserEmail()}</div>
                    {user?.id && (
                      <div className="text-muted small">ID: {user.id}</div>
                    )}
                  </div>
                </li> 
                 
                <li>
                  <button className="dropdown-item d-flex align-items-center" type="button">
                    <i className="bi bi-question-circle me-2"></i>
                    Yardım
                  </button>
                </li> 
                 
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item text-danger d-flex align-items-center"
                    onClick={handleLogout}
                    type="button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Çıkış yapılıyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Çıkış Yap
                      </>
                    )}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;