import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    console.log('toggleSidebar called - current state:', sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      
      setIsMobile(mobile);

      // Mobilde sidebar'ı kapat, desktop'ta varsayılan olarak kapalı bırak
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Route değiştiğinde mobilde sidebar'ı kapat
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      console.log('Route changed, closing mobile sidebar');
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

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
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

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

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="content-wrapper">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Layout;