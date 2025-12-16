// frontend/src/components/Layout.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Layout.module.css'; // Import the new CSS

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className={styles.container}>
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className={styles.sidebar}>
        
        {/* Profile / Brand Section */}
        <div className={styles.brand}>
          <div className={styles.avatar}>E</div>
          <div>
            <h2 className={styles.brandName}>Estate Admin</h2>
            <p className={styles.brandSub}>Pro Version</p>
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
                      to="/"
                      className={styles.link}
                  >
                      <span>⚙️</span> Switch Estate
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
           <h1 className={styles.headerTitle}>Overview</h1>
           <button className={styles.logoutBtn} onClick={() => window.location.href='/'}>
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