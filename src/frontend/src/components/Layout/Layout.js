// src/frontend/src/components/Layout/Layout.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const BREAKPOINT = 992;

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT : false
  );
  
  // Desktop'ta sidebar açık, mobilde kapalı olsun
  const [sidebarOpen, setSidebarOpen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINT : true
  );
  
  const location = useLocation();

  const toggleSidebar = () => {
    console.log('🔄 Layout: toggleSidebar called, current state:', sidebarOpen);
    setSidebarOpen(prev => !prev);
  };

  // Ekran boyutu değişimini dinle
  useEffect(() => {
    const onResize = () => {
      const newIsMobile = window.innerWidth < BREAKPOINT;
      setIsMobile(newIsMobile);
      
      // Mobil'e geçerken sidebar'ı kapat
      if (newIsMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      // Desktop'a geçerken sidebar'ı aç
      else if (!newIsMobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [sidebarOpen]);

  // Route değiştiğinde: sadece mobilde sidebar'ı kapat
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Body scroll kilidi - sadece mobile'da
  useEffect(() => {
    const shouldLock = isMobile && sidebarOpen;
    document.body.style.overflow = shouldLock ? 'hidden' : 'unset';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

  // Debug logs
  useEffect(() => {
    console.log('📱 Layout State:', {
      isMobile,
      sidebarOpen,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'undefined'
    });
  }, [isMobile, sidebarOpen]);

  return (
    <div className="app-layout">
      <Header 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
      />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isMobile={isMobile} 
      />

      {/* Mobil overlay - sadece mobile'da göster */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay show"
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,.5)', 
            zIndex: 1035,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Ana içerik */}
      <main 
        className={`main-content ${sidebarOpen && !isMobile ? 'with-sidebar' : 'without-sidebar'}`}
        style={{
          marginLeft: sidebarOpen && !isMobile ? '280px' : '0',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          paddingTop: '80px', // Header yüksekliği
          zIndex: 1
        }}
      >
        <div className="content-wrapper" style={{ padding: '2rem' }}>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Layout;