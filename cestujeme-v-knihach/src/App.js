
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapPage from './components/MapPage';
import SearchPage from './components/SearchPage';
import ProfilePage from './components/ProfilePage';
import LoginForm from './components/LoginForm';
import { sampleBooks } from './data/sampleBooks';
import { onAuthChange, logoutUser } from './firebase/auth';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('map');
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBooks(sampleBooks);
    
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginForm(false);
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
      setCurrentPage('map');
    }
  };

  // Funkcia na aktualizáciu stavu prečítaných kníh
  const handleBookStatusChange = (bookId, newStatus) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      
      const updatedReadBooks = newStatus
        ? [...prevUser.readBooks, bookId]
        : prevUser.readBooks.filter(id => id !== bookId);
      
      return {
        ...prevUser,
        readBooks: updatedReadBooks
      };
    });
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">⏳</div>
        <p>Načítavam...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        handleLogin={handleLoginClick}
        handleLogout={handleLogout}
      />

      {showLoginForm && (
        <LoginForm 
          onClose={() => setShowLoginForm(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <main className="main-content">
        {currentPage === 'map' && (
          <MapPage 
            books={books} 
            user={user} 
            onBookStatusChange={handleBookStatusChange} 
          />
        )}
        {currentPage === 'search' && (
          <SearchPage 
            books={books} 
            user={user} 
            onBookStatusChange={handleBookStatusChange} 
          />
        )}
        {currentPage === 'profile' && user && (
          <ProfilePage 
            user={user} 
            books={books} 
            onBookStatusChange={handleBookStatusChange} 
          />
        )}
        {currentPage === 'profile' && !user && (
          <div className="login-prompt">
            <h2>Prihláste sa pre zobrazenie profilu</h2>
            <p>Pre prístup k profilu a osobnej mape sa musíte prihlásiť.</p>
            <button onClick={handleLoginClick} className="login-button">
              🔐 Prihlásiť sa
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;