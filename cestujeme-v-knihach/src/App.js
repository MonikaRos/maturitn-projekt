import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapPage from './components/MapPage';
import SearchPage from './components/SearchPage';
import ProfilePage from './components/ProfilePage';
import { sampleBooks } from './data/sampleBooks';
import './styles/App.css';

function App() {
  // Stavy (dáta) aplikácie
  const [currentPage, setCurrentPage] = useState('map'); // aktuálna stránka
  const [user, setUser] = useState(null); // prihlásený užívateľ
  const [books, setBooks] = useState([]); // zoznam všetkých kníh

  // Načítanie dát pri spustení aplikácie
  useEffect(() => {
    setBooks(sampleBooks);
  }, []);

  // Funkcie pre prihlásenie/odhlásenie
  const handleLogin = () => {
    setUser({
      id: 1,
      name: "Anna Čitateľka",
      readBooks: [1, 3] // ID prečítaných kníh
    });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('map'); // presmeruj na mapu po odhlásení
  };

  return (
    <div className="App">
      {/* Hlavička s navigáciou */}
      <Header 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />

      {/* Hlavný obsah - zobrazí sa podľa vybranej stránky */}
      <main className="main-content">
        {currentPage === 'map' && <MapPage books={books} />}
        {currentPage === 'search' && <SearchPage books={books} />}
        {currentPage === 'profile' && user && <ProfilePage user={user} books={books} />}
        {currentPage === 'profile' && !user && (
          <div className="login-prompt">
            <h2>Prihláste sa pre zobrazenie profilu</h2>
            <button onClick={handleLogin} className="login-button">
              Prihlásiť sa
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;