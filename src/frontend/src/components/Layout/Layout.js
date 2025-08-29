// src/frontend/src/components/Layout/Layout.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ Varsayılan: kapalı
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // ✅ DÜZELTME: Toggle fonksiyonu
  const toggleSidebar = () => {
    console.log('🔄 toggleSidebar called - current state:', sidebarOpen);
    setSidebarOpen(prev => {
      const newState = !prev;
      console.log('🔄 Sidebar state changing to:', newState);
      return newState;
    });
  };

  // ✅ DÜZELTME: Resize handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      console.log('📱 Resize detected - mobile:', mobile, 'window width:', window.innerWidth);
      
      setIsMobile(mobile);

      // Mobile'a geçtiğinde sidebar'ı kapat
      if (mobile && sidebarOpen) {
        console.log('📱 Switching to mobile, closing sidebar');
        setSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // ✅ DÜZELTME: Route değişiminde mobile'da sidebar'ı kapat
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      console.log('🚀 Route changed on mobile, closing sidebar');
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // ✅ DÜZELTME: Escape tuşu ile kapatma
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        console.log('⌨️ Escape pressed, closing sidebar');
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // ✅ DÜZELTME: Outside click handler
  const handleOverlayClick = () => {
    console.log('🖱️ Overlay clicked, closing sidebar');
    setSidebarOpen(false);
  };

  // Debug state changes
  useEffect(() => {
    console.log('🏗️ Layout state - sidebarOpen:', sidebarOpen, 'isMobile:', isMobile);
  }, [sidebarOpen, isMobile]);

  return (
    <div className="app-layout">
      {/* Header */}
      <Header 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen} 
      />
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />

      {/* ✅ DÜZELTME: Mobile Overlay - Sadece mobile'da göster */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay show"
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1035,
            cursor: 'pointer'
          }}
        />
      )}

      {/* ✅ DÜZELTME: Main Content */}
      <main className={`main-content ${sidebarOpen && !isMobile ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="content-wrapper">
          {children}
        </div>
        <Footer />
      </main>
      
      {/* ✅ DEBUG INFO - Geliştirme için (production'da kaldırılabilir) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="debug-info"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999
          }}
        >
          Sidebar: {sidebarOpen ? 'OPEN' : 'CLOSED'} | Mobile: {isMobile ? 'YES' : 'NO'}
        </div>
      )}
    </div>
  );
};

export default Layout;