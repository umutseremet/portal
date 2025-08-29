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
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINT : true
  );
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(v => !v);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Route değiştiğinde: sadece mobilde kapat
  useEffect(() => {
    if (isMobile && sidebarOpen) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Body scroll kilidi
  useEffect(() => {
    const lock = isMobile && sidebarOpen;
    document.body.classList.toggle('body-lock', lock);
  }, [isMobile, sidebarOpen]);

  return (
    <div className="app-layout">
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />

      {/* Mobil overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay show"
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1035 }}
        />
      )}

      <main className={`main-content ${sidebarOpen && !isMobile ? 'with-sidebar' : 'without-sidebar'}`} style={{ zIndex:1 }}>
        <div className="content-wrapper">{children}</div>
        <Footer />
      </main>
    </div>
  );
};

export default Layout;
