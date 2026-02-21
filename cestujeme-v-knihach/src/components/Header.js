// src/components/Header.js
import React, { useEffect } from 'react';

function Header({ currentPage, setCurrentPage, user, handleLogin, handleLogout }) {
  useEffect(() => {
    if (user) {
      console.log('👤 Header dostal používateľa:', user.displayName);
      console.log('🔑 isAdmin v Header:', user.isAdmin);
    }
  }, [user]);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo a názov - KLIKATEĽNÝ */}
        <div 
          className="logo-section" 
          onClick={() => setCurrentPage('leaderboard')}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo">📚</div>
          <h1 className="app-title">Cestujeme v knihách</h1>
        </div>

        {/* Navigačné menu */}
        <nav className="navigation">
          <button 
            onClick={() => setCurrentPage('map')}
            className={`nav-button ${currentPage === 'map' ? 'active' : ''}`}
          >
            🌍 Mapa
          </button>

          <button 
            onClick={() => setCurrentPage('search')}
            className={`nav-button ${currentPage === 'search' ? 'active' : ''}`}
          >
            🔍 Vyhľadávanie
          </button>

          {/*<button 
            onClick={() => setCurrentPage('leaderboard')}
            className={`nav-button ${currentPage === 'leaderboard' ? 'active' : ''}`}
          >
            🏆 Rebríčky
          </button>*/}

          {/* Admin tlačidlo - viditeľné len pre adminov */}
          {user && user.isAdmin && (
            <button 
              onClick={() => setCurrentPage('admin')}
              className={`nav-button admin-button ${currentPage === 'admin' ? 'active' : ''}`}
            >
              👨‍💼 Admin
            </button>
          )}

          {/* Prihlásenie/Profil */}
          {user ? (
            <div className="user-section">
              <button 
                onClick={() => setCurrentPage('profile')}
                className={`nav-button ${currentPage === 'profile' ? 'active' : ''}`}
              >
                👤 {user.displayName}
              </button>
              <button 
                onClick={handleLogout}
                className="logout-button"
              >
                Odhlásiť sa
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="login-button"
            >
              👤 Prihlásiť sa
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;