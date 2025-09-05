// src/frontend/src/components/Layout/Sidebar.js - UPDATED
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      path: '/dashboard',
      type: 'single'
    },
    {
      id: 'vehicle-tracking',
      label: 'Araç Takip',
      icon: 'bi-car-front',
      path: '/vehicles',
      type: 'single'
    },
    {
      id: 'production',
      label: 'Üretim',
      icon: 'bi-gear-fill',
      type: 'group',
      children: [
        { id: 'bom-transfer', label: 'BOM Listesi Aktarımı', path: '/production/bom-transfer' },
        { id: 'data-cam', label: 'Data / CAM Hazırlama', path: '/production/data-cam' },
        { id: 'production-planning', label: 'Üretim Planlama', path: '/production/planning' },
        { id: 'production-tracking', label: 'Üretim Takip', path: '/production/tracking' },
        { id: 'reports', label: 'Raporlar', path: '/production/reports' }
      ]
    },
    {
      id: 'other-operations',
      label: 'Diğer İşlemler',
      icon: 'bi-three-dots',
      type: 'group',
      children: [
        { id: 'visitors', label: 'Ziyaretçiler', path: '/visitors' }
      ]
    }
  ];

  const handleMenuClick = (path, e) => {
    e.preventDefault();
    navigate(path);
    // Mobilde menüden seçim yapınca kapat
    if (isMobile && isOpen) {
      // küçük bir gecikme ile kapat (routing'in state güncellemesiyle çakışmasın)
      setTimeout(() => toggleSidebar(), 80);
    }
  };

  const toggleSubmenu = (menuId, e) => {
    e.preventDefault();
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (children) => children.some(child => isActive(child.path));

  const renderMenuItem = (item) => {
    if (item.type === 'single') {
      return (
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
            fontWeight: isActive(item.path) ? '600' : '400',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
        >
          <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem' }}></i>
          {item.label}
        </button>
      );
    }

    if (item.type === 'group') {
      const isExpanded = expandedMenus[item.id];
      const hasActiveChild = isParentActive(item.children);

      return (
        <div key={item.id} className="nav-group">
          <button
            className={`nav-link nav-group-toggle ${hasActiveChild ? 'active' : ''}`}
            onClick={(e) => toggleSubmenu(item.id, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.75rem 1.5rem',
              margin: '0 0.5rem 0.25rem 0.5rem',
              background: hasActiveChild ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: hasActiveChild ? '#FF6B6B' : '#6c757d',
              fontSize: '0.95rem',
              fontWeight: hasActiveChild ? '600' : '400',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div className="d-flex align-items-center">
              <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem' }}></i>
              {item.label}
            </div>
            <i 
              className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}
              style={{ fontSize: '0.8rem', transition: 'transform 0.2s ease' }}
            ></i>
          </button>
          
          <div 
            className={`nav-submenu ${isExpanded ? 'show' : ''}`}
            style={{
              maxHeight: isExpanded ? `${item.children.length * 50}px` : '0',
              opacity: isExpanded ? '1' : '0',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              paddingLeft: '1rem'
            }}
          >
            {item.children.map((child) => (
              <button
                key={child.id}
                className={`nav-link nav-sub-link ${isActive(child.path) ? 'active' : ''}`}
                onClick={(e) => handleMenuClick(child.path, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.6rem 1.5rem',
                  margin: '0 0.5rem 0.15rem 0.5rem',
                  background: isActive(child.path) ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: isActive(child.path) ? '#FF6B6B' : '#8e9297',
                  fontSize: '0.875rem',
                  fontWeight: isActive(child.path) ? '600' : '400',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <i className="bi bi-dot me-2" style={{ fontSize: '1.2rem' }}></i>
                {child.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040
          }}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`sidebar ${isOpen ? 'show' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e3e6f0',
          transition: 'left 0.3s ease',
          zIndex: 1041,
          overflowY: 'auto',
          paddingTop: '70px', // Account for fixed header
          boxShadow: isOpen ? '0 0 20px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <div className="sidebar-content" style={{ padding: '1rem 0' }}>
          {/* Logo/Brand Area */}
          <div 
            className="sidebar-brand"
            style={{
              padding: '0 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e3e6f0',
              marginBottom: '1rem'
            }}
          >
            <div className="d-flex align-items-center">
              <div 
                className="brand-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#FF6B6B',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}
              >
                <i className="bi bi-grid-1x2-fill text-white"></i>
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2d3748' }}>
                  Vervo Portal
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8e9297' }}>
                  Yönetim Paneli
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="nav flex-column">
            {menuItems.map(renderMenuItem)}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div 
          className="sidebar-footer"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e3e6f0',
            backgroundColor: '#f8f9fa'
          }}
        >
          <div className="text-center">
            <small className="text-muted">
              © 2025 Vervo Portal
            </small>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;