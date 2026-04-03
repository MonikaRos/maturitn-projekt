// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapPage from './components/MapPage';
import SearchPage from './components/SearchPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import LeaderboardPage from './components/LeaderboardPage';
import LoginForm from './components/LoginForm';
import SeedDatabaseButton from './components/SeedDatabaseButton'; // SEED BUTTON
import { onAuthChange, logoutUser } from './firebase/auth';
import { getAllBooks } from './firebase/firestore';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('map');
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initializeApp = async () => {
    const result = await getAllBooks();
    
    if (result.success && result.books.length > 0) {
      console.log('Načítané knihy z Firestore:', result.books.length);
      setBooks(result.books);
    } else {
      console.log(' Žiadne knihy v databáze');
      setBooks([]);
    }
  };

  const refreshBooks = useCallback(async () => {
    const result = await getAllBooks();
    if (result.success) {
      setBooks(result.books);
    }
  }, []);

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const handleLoginSuccess = (userData) => {
    console.log(' App.js dostal používateľa:', userData);
    console.log(' isAdmin v App.js:', userData.isAdmin);
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

  const handleWishlistChange = (bookId, newStatus) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      
      const currentWishlist = prevUser.wishlist || [];
      const updatedWishlist = newStatus
        ? [...currentWishlist, bookId]
        : currentWishlist.filter(id => id !== bookId);
      
      return {
        ...prevUser,
        wishlist: updatedWishlist
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
            onWishlistChange={handleWishlistChange}
          />
        )}
        {currentPage === 'search' && (
          <SearchPage 
            books={books} 
            user={user} 
            onBookStatusChange={handleBookStatusChange}
            onWishlistChange={handleWishlistChange}
          />
        )}
        {currentPage === 'leaderboard' && (
          <LeaderboardPage 
            books={books}
            user={user}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage 
            user={user}
            onBooksChange={refreshBooks}
          />
        )}
        {currentPage === 'profile' && user && (
          <ProfilePage 
            user={user} 
            books={books} 
            onBookStatusChange={handleBookStatusChange}
            onWishlistChange={handleWishlistChange}
          />
        )}
        {currentPage === 'profile' && !user && (
          <div className="login-prompt">
            <h2>Prihláste sa pre zobrazenie profilu</h2>
            <p>Pre prístup k profilu a osobnej mape sa musíte prihlásiť.</p>
            <button onClick={handleLoginClick} className="login-button">
               Prihlásiť sa
            </button>
          </div>
        )}
      </main>

      {/* SEED DATABASE BUTTON - Zobrazí sa len pre adminov */}
      {user && user.isAdmin && <SeedDatabaseButton />}
    </div>
  );
}

export default App;