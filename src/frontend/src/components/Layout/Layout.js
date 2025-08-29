// src/frontend/src/components/Layout/Layout.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth >= 992; // Desktop'ta açık başla
  });
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    console.log('toggleSidebar called - current state:', sidebarOpen);
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true); // Desktop'a geçince aç
      } else if (mobile && sidebarOpen) {
        setSidebarOpen(false); // Mobile'a geçince kapat
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Route değişince mobilde sidebar kapansın
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Escape tuşu ile kapatma
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen, isMobile]);

  return (
    <div className="app-layout">
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay show"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1035
          }}
        />
      )}

      <main className={`main-content ${sidebarOpen && !isMobile ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="content-wrapper">{children}</div>
        <Footer />
      </main>
    </div>
  );
};

export default Layout;
