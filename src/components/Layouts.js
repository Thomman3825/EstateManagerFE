// frontend/src/components/Layout.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Layout.module.css'; // Import the new CSS
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const {user, logout} = useAuth();

  return (
    <div className={styles.container}>
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className={styles.sidebar}>
        
        {/* Profile / Brand Section */}
        <div className={styles.brand}>
          <div className={styles.avatar}>{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <h2 className={styles.brandName}>Estate Admin</h2>
            <p className={styles.brandSub}>Welcome, {user?.name || 'User'}</p>
          </div>
        </div>

        {/* Navigation Links */}
              <nav className={styles.nav}>
                  <Link
                      to="/dashboard"
                      className={`${styles.link} ${location.pathname === '/dashboard' ? styles.activeLink : ''}`}
                  >
                      <span>📊</span> Dashboard
                  </Link>

                  <Link
                      to="/expenses"
                      className={`${styles.link} ${location.pathname === '/expenses' ? styles.activeLink : ''}`}
                  >
                      <span>💸</span> Expenses
                  </Link>

                  <Link
                      to="/tracker"
                      className={`${styles.link} ${location.pathname === '/tracker' ? styles.activeLink : ''}`}
                  >
                      <span>📈</span> Tracker Report
                  </Link>

                  <Link
                      to="/estates"
                      className={styles.link}
                  >
                      <span>⚙️</span> Manage Estates
                  </Link>

                  <Link
                      to="/workers"
                      className={`${styles.link} ${location.pathname === '/workers' ? styles.activeLink : ''}`}
                  >
                      <span>👷</span> Workers
                  </Link>
                  <Link
                    to="/sales"
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
           <h1 className={styles.headerTitle}>
               {location.pathname.replace('/','').charAt(0).toUpperCase() + location.pathname.slice(2) || 'Dashboard'}
           </h1>
           <button className={styles.logoutBtn} onClick={logout}>
              Log Out
           </button>
        </header>

        {/* Page Content Injection */}
        {children}
      </main>
    </div>
  );
};

export default Layout;