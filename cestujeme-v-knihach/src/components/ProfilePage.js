import React, { useState } from 'react';

function ProfilePage({ user, books }) {
  // Rozdelenie kníh na prečítané a neprečítané
  const readBooks = books.filter(book => user.readBooks.includes(book.id));
  const unreadBooks = books.filter(book => !user.readBooks.includes(book.id));

  // Štatistiky
  const totalCountries = [...new Set(readBooks.map(book => book.country))].length;
  const totalCities = [...new Set(readBooks.map(book => book.city))].length;
  const favoriteGenres = getFavoriteGenres(readBooks);

  // State pre zobrazenie detailov knihy
  const [selectedBook, setSelectedBook] = useState(null);

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>👤 Môj literárny profil</h2>
        <p>Vitajte späť, {user.name}!</p>
      </div>

      {/* Štatistiky používateľa */}
      <div className="user-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{readBooks.length}</div>
            <div className="stat-label">Prečítaných kníh</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalCountries}</div>
            <div className="stat-label">Navštívených krajín</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalCities}</div>
            <div className="stat-label">Objavených miest</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{favoriteGenres.length}</div>
            <div className="stat-label">Obľúbených žánrov</div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        {/* Prečítané knihy */}
        <div className="reading-section">
          <h3 className="section-title">
            📚 Vaše literárne cesty ({readBooks.length})
          </h3>
          
          {readBooks.length > 0 ? (
            <div className="books-showcase">
              {readBooks.map(book => (
                <div key={book.id} className="read-book-card">
                  <div className="book-cover">
                    <img src={book.image} alt={book.title} />
                  </div>
                  <div className="book-details">
                    <h4>{book.title}</h4>
                    <p className="author">{book.author}</p>
                    <div className="book-location">
                      <span className="flag">🌍</span>
                      <span>{book.city}, {book.country}</span>
                    </div>
                    <div className="completion-badge">
                      ✓ Prečítané
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <p>Zatiaľ nemáte označené žiadne prečítané knihy</p>
            </div>
          )}
        </div>

        {/* Mapa navštívených miest */}
        <div className="travel-map-section">
          <h3 className="section-title">🗺️ Vaša literárna mapa</h3>
          
          <div className="map-container">
            {/* Tu bude neskôr skutočná mapa - zatiaľ zoznam krajín */}
            <div className="countries-visited">
              <h4>Krajiny, ktoré ste navštívili cez knihy:</h4>
              <div className="countries-list">
                {[...new Set(readBooks.map(book => book.country))].map(country => {
                  const countryBooks = readBooks.filter(book => book.country === country);
                  return (
                    <div key={country} className="country-badge">
                      <span className="country-name">{country}</span>
                      <span className="books-count">({countryBooks.length})</span>
                    </div>
                  );
                })}
              </div>
              
              {totalCountries === 0 && (
                <p className="no-countries">Začnite čítať a objavte nové krajiny! 🌎</p>
              )}
            </div>
          </div>
        </div>

        {/* Knihy na prečítanie / Wishlist */}
        <div className="wishlist-section">
          <h3 className="section-title">
            🎯 Budúce literárne dobrodružstvá ({unreadBooks.length})
          </h3>
          
          {unreadBooks.length > 0 ? (
            <div className="wishlist-grid">
              {unreadBooks.map(book => (
                <div key={book.id} className="wishlist-book">
                  <div className="book-info">
                    <h4>{book.title}</h4>
                    <p className="author">{book.author}</p>
                    <div className="destination">
                      <span>📍 {book.city}, {book.country}</span>
                    </div>
                    <p className="genre">🏷️ {book.genre}</p>
                  </div>
                  
                  <div className="book-actions">
                    <button 
                      className="details-button"
                      onClick={() => setSelectedBook(selectedBook?.id === book.id ? null : book)}
                    >
                      {selectedBook?.id === book.id ? 'Skryť' : 'Detaily'}
                    </button>
                  </div>
                  
                  {selectedBook?.id === book.id && (
                    <div className="book-expanded">
                      <p className="description">{book.description}</p>
                      <p><strong>Rok vydania:</strong> {book.year}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p>Prečítali ste všetky dostupné knihy! Gratulujeme! 🎉</p>
            </div>
          )}
        </div>

        {/* Obľúbené žánre */}
        {favoriteGenres.length > 0 && (
          <div className="genres-section">
            <h3 className="section-title">🎭 Vaše obľúbené žánre</h3>
            <div className="genres-list">
              {favoriteGenres.map(({ genre, count }) => (
                <div key={genre} className="genre-item">
                  <span className="genre-name">{genre}</span>
                  <span className="genre-count">{count} {count === 1 ? 'kniha' : 'kníh'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Pomocná funkcia na získanie obľúbených žánrov
function getFavoriteGenres(readBooks) {
  const genreCounts = {};
  
  readBooks.forEach(book => {
    genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
  });
  
  return Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count); // zoradené podľa počtu kníh
}

export default ProfilePage;