// src/frontend/src/components/Layout/Sidebar.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  // Ana menü yapılandırması
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      path: '/dashboard',
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
            textAlign: 'left',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isActive(item.path)) {
              e.target.style.background = 'rgba(108, 117, 125, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive(item.path)) {
              e.target.style.background = 'transparent';
            }
          }}
        >
          <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem', width: '16px' }}></i>
          {item.label}
        </button>
      );
    }

    // Group menü (alt menülü)
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
            textAlign: 'left',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!hasActiveChild) {
              e.target.style.background = 'rgba(108, 117, 125, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (!hasActiveChild) {
              e.target.style.background = 'transparent';
            }
          }}
        >
          <div className="d-flex align-items-center">
            <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem', width: '16px' }}></i>
            {item.label}
          </div>
          <i 
            className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} transition-transform`}
            style={{ 
              fontSize: '0.8rem',
              transition: 'transform 0.2s ease'
            }}
          ></i>
        </button>

        {/* Alt menü */}
        <div 
          className={`submenu ${isExpanded ? 'expanded' : 'collapsed'}`}
          style={{
            maxHeight: isExpanded ? `${item.children.length * 42}px` : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
            marginLeft: '0.5rem',
            marginRight: '0.5rem'
          }}
        >
          {item.children.map((child) => (
            <button
              key={child.id}
              className={`nav-link nav-sublink ${isActive(child.path) ? 'active' : ''}`}
              onClick={(e) => handleMenuClick(child.path, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
                margin: '0.125rem 0',
                background: isActive(child.path) ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: isActive(child.path) ? '#FF6B6B' : '#8892b0',
                fontSize: '0.875rem',
                fontWeight: isActive(child.path) ? '500' : '400',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isActive(child.path)) {
                  e.target.style.background = 'rgba(108, 117, 125, 0.05)';
                  e.target.style.color = '#6c757d';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(child.path)) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#8892b0';
                }
              }}
            >
              <div 
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isActive(child.path) ? '#FF6B6B' : '#8892b0',
                  marginRight: '12px'
                }}
              ></div>
              {child.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`sidebar ${isOpen ? 'show' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflowX: 'hidden'
    }}>
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

        {/* Sadece mobilde kapama butonu */}
        {isMobile && (
          <button
            className="btn btn-link text-muted p-1"
            onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
            style={{ border: 'none', background: 'none', fontSize: '20px', lineHeight: 1 }}
            aria-label="Menüyü kapat"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="sidebar-content" style={{ padding: '1rem 0', flex: 1, overflowY: 'auto' }}>
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
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '0.5rem'
              }}
            >
              <i className="bi bi-house-door me-2"></i>
              Ana Menü
            </div>

            {menuItems.map(renderMenuItem)}
          </div>
        </nav>
      </div>

      {/* Sidebar Footer (Opsiyonel) */}
      <div 
        className="sidebar-footer"
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e9ecef',
          color: '#8892b0',
          fontSize: '0.75rem'
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <span>v1.0.0</span>
          <i className="bi bi-info-circle"></i>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;