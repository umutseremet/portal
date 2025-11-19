// src/frontend/src/components/Layout/Sidebar.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});

  // Menu items configuration
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      path: '/dashboard'
    },
    {
      id: 'production',
      label: 'Üretim',
      icon: 'bi-tools',
      children: [
        { id: 'bom-transfer', label: 'BOM Listesi Aktarımı', path: '/production/bom-transfer' },
         { id: 'data-cam', label: 'Data / CAM Hazırlama', path: '/production/technical-drawing-preparation' },
        // { id: 'production-planning', label: 'Üretim Planlama', path: '/production/planning' },
        // { id: 'production-tracking', label: 'Üretim Takip', path: '/production/tracking' },
        // { id: 'reports', label: 'Raporlar', path: '/production/reports' }

        {
          id: 'weekly-calendar',
          label: 'Haftalık Üretim Planı',
          icon: 'bi-calendar3',
          path: '/production/weekly-calendar'
        }
      ]
    },
    {
      id: 'definitions',
      label: 'Tanımlamalar',
      icon: 'bi-gear-fill',
      children: [
        { id: 'items', label: 'Ürünler', path: '/definitions/items' },
        { id: 'item-groups', label: 'Ürün Grupları', path: '/definitions/item-groups' },
      ]
    },
    {
      id: 'vehicles',
      label: 'Araç Takip',
      icon: 'bi-truck',
      path: '/vehicles'
    },
    {
      id: 'visitors',
      label: 'Ziyaretçi Takip',
      icon: 'bi-people-fill',
      path: '/visitors'
    }
  ];

  // Check if current path is active
  const isActive = (path) => {
    return location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path));
  };

  // Handle menu click
  const handleMenuClick = (path, e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔗 Sidebar: Navigating to:', path);

    // Navigate to the path
    navigate(path);

    // Close sidebar on mobile after navigation
    if (isMobile && isOpen) {
      setTimeout(() => toggleSidebar(), 150);
    }
  };

  // Handle group toggle
  const handleGroupToggle = (groupId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Render menu item
  const renderMenuItem = (item) => {
    // Group item with children
    if (item.children) {
      const isExpanded = expandedGroups[item.id];
      const hasActiveChild = item.children.some(child => isActive(child.path));

      return (
        <div key={item.id} className="nav-group">
          <button
            className={`nav-link nav-group-toggle ${hasActiveChild ? 'active' : ''}`}
            onClick={(e) => handleGroupToggle(item.id, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.75rem 1rem',
              margin: '0.125rem 0.5rem',
              background: hasActiveChild ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: hasActiveChild ? '#FF6B6B' : '#6c757d',
              fontSize: '0.875rem',
              fontWeight: hasActiveChild ? '600' : '500',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem', width: '20px' }}></i>
              <span>{item.label}</span>
            </div>
            <i
              className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}
              style={{
                fontSize: '0.8rem',
                transition: 'transform 0.2s ease'
              }}
            ></i>
          </button>

          {/* Submenu */}
          <div
            className={`submenu ${isExpanded ? 'expanded' : 'collapsed'}`}
            style={{
              maxHeight: isExpanded ? '200px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              paddingLeft: '1rem'
            }}
          >
            {item.children.map(child => (
              <button
                key={child.id}
                className={`nav-link nav-sublink ${isActive(child.path) ? 'active' : ''}`}
                onClick={(e) => handleMenuClick(child.path, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.5rem 1rem',
                  margin: '0.125rem 0.25rem',
                  background: isActive(child.path) ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: isActive(child.path) ? '#FF6B6B' : '#6c757d',
                  fontSize: '0.8rem',
                  fontWeight: isActive(child.path) ? '600' : '400',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  cursor: 'pointer'
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

    // Simple menu item
    return (
      <button
        key={item.id}
        className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
        onClick={(e) => handleMenuClick(item.path, e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '0.75rem 1rem',
          margin: '0.125rem 0.5rem',
          background: isActive(item.path) ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color: isActive(item.path) ? '#FF6B6B' : '#6c757d',
          fontSize: '0.875rem',
          fontWeight: isActive(item.path) ? '600' : '500',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          textAlign: 'left',
          cursor: 'pointer'
        }}
      >
        <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem', width: '20px' }}></i>
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Sidebar - CSS'in kontrol etmesine izin ver */}
      <nav className={`sidebar ${isOpen ? 'show' : ''}`}>
        {/* Sidebar Header */}
        <div
          className="sidebar-header"
          style={{
            padding: '1.5rem 1rem 1rem',
            borderBottom: '1px solid #e9ecef',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="logo-icon"
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                marginRight: '12px'
              }}
            >
              <i className="bi bi-truck"></i>
            </div>
            <h4
              className="logo-text"
              style={{
                fontWeight: '700',
                color: '#212529',
                fontSize: '1.25rem',
                margin: 0
              }}
            >
              Vervo Portal
            </h4>
          </div>
        </div>

        {/* Navigation Menu - Sidebar Content olarak sar */}
        <div className="sidebar-content">
          <div className="sidebar-nav" style={{ padding: '0 0.5rem' }}>
            {menuItems.map(renderMenuItem)}
          </div>
        </div>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            className="sidebar-close-btn"
            onClick={toggleSidebar}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#6c757d',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </nav>
    </>
  );
};

export default Sidebar;