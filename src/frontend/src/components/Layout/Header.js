import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const handleLogout = () => {
    logout();
    navigate('/login');
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

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container-fluid">
        {/* HAMBURGER MENU BUTTON - Tüm Ekranlarda Görünür */}
        <button
          className="btn btn-outline-danger me-3 hamburger-menu-btn"
          onClick={handleMenuToggle}
          aria-label="Toggle sidebar"
          type="button"
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

          {/* Messages */}
          <button className="btn btn-link text-dark position-relative p-2">
            <i className="bi bi-chat-dots fs-5"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              5
            </span>
          </button>

          {/* User Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center p-2"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin User')}&size=40&background=FF6B6B&color=ffffff&bold=true`}
                alt="User Avatar"
                className="rounded-circle me-2"
                width="40"
                height="40"
                onError={(e) => {
                  // Fallback eğer link çalışmazsa
                  e.target.src = 'https://ui-avatars.com/api/?name=AU&size=40&background=FF6B6B&color=ffffff&bold=true';
                }}
              />
              <div className="d-none d-lg-block text-start">
                <div className="fw-semibold text-dark small">{user?.name || 'Admin User'}</div>
                <div className="text-muted small">{user?.role || 'admin'}</div>
              </div>
              <i className="bi bi-chevron-down ms-2 text-muted small d-none d-lg-inline"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
              <li>
                <div className="dropdown-header">
                  <div className="fw-semibold">{user?.name || 'Admin User'}</div>
                  <div className="text-muted small">{user?.email || 'admin@admin.com'}</div>
                </div>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item d-flex align-items-center" type="button">
                  <i className="bi bi-person-circle me-2"></i>
                  Profil
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center" type="button">
                  <i className="bi bi-gear me-2"></i>
                  Ayarlar
                </button>
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
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Çıkış Yap
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;