// src/frontend/src/components/Layout/Header.js
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
  );

  const triggerRef = useRef(null);
  const portalRef = useRef(document.createElement('div'));
  const [pos, setPos] = useState({ top: 0, left: 0, width: 220 });

  // Portal element'i DOM'a ekle
  useEffect(() => {
    const el = portalRef.current;
    el.style.position = 'fixed';
    el.style.zIndex = '2000';
    document.body.appendChild(el);
    return () => { try { document.body.removeChild(el); } catch(_){} };
  }, []);

  // Ekran boyutu dinleme
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Dropdown pozisyonu (masaüstü)
  const measure = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const menuW = Math.max(220, Math.min(280, window.innerWidth * 0.5));
    let left = r.right - menuW; // sağa hizala
    const pad = 8;
    if (left + menuW > window.innerWidth - pad) left = window.innerWidth - pad - menuW;
    if (left < pad) left = pad;
    const top = r.bottom + 8;
    setPos({ top, left, width: menuW });
  };

  useLayoutEffect(() => {
    if (dropdownOpen && !isMobile) {
      measure();
      const onResize = () => measure();
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onResize, true);
      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onResize, true);
      };
    }
  }, [dropdownOpen, isMobile]);

  // Dış tıklama & ESC
  useEffect(() => {
    const onClick = (e) => {
      if (!dropdownOpen) return;
      if (triggerRef.current?.contains(e.target)) return;
      if (portalRef.current?.contains(e.target)) return;
      setDropdownOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [dropdownOpen]);

  // ✅ EKSIK OLAN FONKSIYON: handleToggle
  const handleToggle = (e) => {
    e.stopPropagation();
    setDropdownOpen(prev => !prev);
  };

  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/login'); }
  };

  const getUserName = () =>
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` :
    user?.fullName || user?.username || 'Admin User';

  const initials = getUserName().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  const hit = { width:44, height:44, minWidth:44, minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:8 };

  return (
    <nav className="navbar navbar-light header-nav fixed-top" style={{ zIndex: 1040 }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">

        {/* Hamburger */}
        <button
          type="button"
          className="btn d-flex align-items-center justify-content-center me-3"
          onClick={(e)=>{ e.stopPropagation(); toggleSidebar?.(); }}
          style={{
            ...hit,
            border:'2px solid #FF6B6B',
            background: sidebarOpen ? '#FF6B6B' : 'white',
            color: sidebarOpen ? 'white' : '#FF6B6B',
            fontSize: '1.5rem'
          }}
          aria-label={sidebarOpen ? 'Menüyü kapat':'Menüyü aç'}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
        >
          <i className="bi bi-list" />
        </button>

        {/* Logo & Path */}
        <div className="d-flex align-items-center flex-grow-1">
          <i className="bi bi-calendar-event-fill me-2"></i>
          <h4 className="mb-0 text-dark">vervo</h4>
          <span className="ms-3 text-muted d-none d-lg-block">/ {location.pathname.replace('/', '')}</span>
        </div>

        {/* Sağ Aksiyonlar */}
        <div className="d-flex align-items-center header-actions">
          {/* Notification Button */}
          <button className="btn btn-link notification-btn" style={hit} aria-label="Bildirimler">
            <i className="bi bi-bell fs-5"></i>
          </button>
          
          

          {/* User Avatar & Dropdown */}
          <div className="user-dropdown">
            <button
              ref={triggerRef}
              type="button"
              className="btn d-flex align-items-center"
              onClick={handleToggle} // ✅ handleToggle kullanıyoruz
              style={{ ...hit, paddingLeft:6, paddingRight:10 }}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              {/* ✅ Avatar - büyütülmüş boyut ve mesafe */}
              <div className="avatar avatar-xxl rounded-circle text-white fw-bold d-flex justify-content-center align-items-center user-avatar"
                   style={{ backgroundColor:'#FF6B6B' }}>
                {initials}
              </div>
              <span className="d-none d-sm-block small text-dark ms-2">{getUserName()}</span>
              <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-2 text-muted`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* PORTAL: Dropdown */}
      {dropdownOpen && createPortal(
        isMobile ? (
          // Bottom sheet (mobil)
          <div
            role="menu"
            style={{
              position:'fixed', left:0, right:0, bottom:0,
              background:'#fff', borderTopLeftRadius:16, borderTopRightRadius:16,
              boxShadow:'0 -10px 30px rgba(0,0,0,.08)', padding:'8px 0',
              zIndex:2000, paddingBottom:'env(safe-area-inset-bottom)'
            }}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="dropdown-item px-3 py-2 text-muted">{getUserName()}</div>
            <hr className="dropdown-divider" />
            <button className="dropdown-item px-3 py-2">Profilim</button>
            <hr className="dropdown-divider" />
            <button className="dropdown-item px-3 py-2 text-danger" onClick={handleLogout} disabled={loading}>
              {loading ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
            </button>
          </div>
        ) : (
          // Masaüstü: sağ üst hizalı açılır menü
          <div
            role="menu"
            style={{
              position:'fixed',
              top: pos.top, left: pos.left, width: pos.width,
              background:'#fff', border:'1px solid #e5e7eb', borderRadius:12,
              boxShadow:'0 10px 30px rgba(0,0,0,.08)', padding:'6px 0'
            }}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="dropdown-item px-3 py-2 text-muted">{getUserName()}</div>
            <hr className="dropdown-divider" />
            <button className="dropdown-item px-3 py-2">Profilim</button> 
            <hr className="dropdown-divider" />
            <button className="dropdown-item px-3 py-2 text-danger" onClick={handleLogout} disabled={loading}>
              {loading ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
            </button>
          </div>
        ),
        portalRef.current
      )}
    </nav>
  );
};

export default Header;