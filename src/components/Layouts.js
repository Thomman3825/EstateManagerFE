// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Layout.module.css';
import { useAuth } from '../context/AuthContext';

// Simple Icons
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper to format page title
  const getPageTitle = () => {
    const path = location.pathname.replace('/', '');
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Close sidebar when a link is clicked (Mobile UX)
  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.container}>
      
      {/* --- MOBILE OVERLAY --- */}
      {/* Clicking this dark background closes the menu */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* --- LEFT SIDEBAR --- */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        
        <div className={styles.sidebarHeader}>
           {/* Profile / Brand Section */}
            <div className={styles.brand}>
              <div className={styles.avatar}>{user?.name?.charAt(0) || 'U'}</div>
              <div>
                <h2 className={styles.brandName}>Estate Admin</h2>
                <p className={styles.brandSub}>Welcome, {user?.name || 'User'}</p>
              </div>
            </div>
            
            {/* Close Button (Mobile Only) */}
            <button className={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}>
              <CloseIcon />
            </button>
        </div>

        {/* Navigation Links */}
        <nav className={styles.nav}>
          <Link
            to="/dashboard"
            onClick={handleLinkClick}
            className={`${styles.link} ${location.pathname === '/dashboard' ? styles.activeLink : ''}`}
          >
            <span>📊</span> Dashboard
          </Link>

          <Link
            to="/expenses"
            onClick={handleLinkClick}
            className={`${styles.link} ${location.pathname === '/expenses' ? styles.activeLink : ''}`}
          >
            <span>💸</span> Expenses
          </Link>

          <Link
            to="/tracker"
            onClick={handleLinkClick}
            className={`${styles.link} ${location.pathname === '/tracker' ? styles.activeLink : ''}`}
          >
            <span>📈</span> Tracker Report
          </Link>

          <Link
            to="/estates"
            onClick={handleLinkClick}
            className={`${styles.link} ${location.pathname === '/estates' ? styles.activeLink : ''}`}
          >
            <span>⚙️</span> Manage Estates
          </Link>

          <Link
            to="/workers"
            onClick={handleLinkClick}
            className={`${styles.link} ${location.pathname === '/workers' ? styles.activeLink : ''}`}
          >
            <span>👷</span> Workers
          </Link>
          <Link
            to="/sales"
            onClick={handleLinkClick}
            className={`${styles.link} ${location.pathname === '/sales' ? styles.activeLink : ''}`}
          >
            <span>🎯</span> Sales
          </Link>
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          © 2025 EstateTrack
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={styles.main}>
        {/* Top Header */}
        <header className={styles.header}>
           <div className={styles.headerLeft}>
             {/* Hamburger Button (Mobile Only) */}
             <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>
                <MenuIcon />
             </button>
             <h1 className={styles.headerTitle}>{getPageTitle()}</h1>
           </div>

           <button className={styles.logoutBtn} onClick={logout}>
             Log Out
           </button>
        </header>

        {/* Page Content Injection */}
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;