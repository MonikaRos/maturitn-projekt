import React from 'react';
import BookCard from './BookCard';
import PersonalMap from './PersonalMap';

function ProfilePage({ user, books, onBookStatusChange, onWishlistChange }) {
  const userReadBooks = user.readBooks || [];
  const userWishlist = user.wishlist || [];
  
  // Prečítané knihy
  const readBooks = books.filter(book => userReadBooks.includes(book.id));
  
  // Wishlist - knihy ktoré NIE SÚ prečítané, ale sú vo wishlist-e
  const wishlistBooks = books.filter(book => 
    userWishlist.includes(book.id) && !userReadBooks.includes(book.id)
  );

  const totalCountries = [...new Set(readBooks.map(book => book.country))].length;
  const favoriteGenres = getFavoriteGenres(readBooks);

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2> Môj literárny profil</h2>
        <p>Vitajte späť, {user.displayName || user.email}!</p>
      </div>

      <div className="profile-content">
        {/* OSOBNÁ MAPA so štatistikami */}
        <PersonalMap readBooks={readBooks} />

        {/* Prečítané knihy */}
        <div className="reading-section">
          <h3 className="section-title">
             Vaše literárne cesty ({readBooks.length})
          </h3>
          
          {readBooks.length > 0 ? (
            <div className="books-showcase">
              {readBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  user={user}
                  isRead={true}
                  isInWishlist={userWishlist.includes(book.id)}
                  onStatusChange={onBookStatusChange}
                  onWishlistChange={onWishlistChange}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>Zatiaľ nemáte označené žiadne prečítané knihy</p>
            </div>
          )}
        </div>

        {/* Krajiny ktoré ste navštívili */}
        <div className="travel-map-section">
          <h3 className="section-title"> Krajiny, ktoré ste navštívili</h3>
          
          <div className="map-container">
            <div className="countries-visited">
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
                <p className="no-countries">Začnite čítať a objavte nové krajiny! </p>
              )}
            </div>
          </div>
        </div>

        {/* WISHLIST - Knihy na prečítanie */}
        <div className="wishlist-section">
          <h3 className="section-title">
             Môj wishlist - Chcem prečítať ({wishlistBooks.length})
          </h3>
          
          {wishlistBooks.length > 0 ? (
            <div className="wishlist-grid">
              {wishlistBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  user={user}
                  isRead={false}
                  isInWishlist={true}
                  onStatusChange={onBookStatusChange}
                  onWishlistChange={onWishlistChange}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>Váš wishlist je prázdny. Pridajte knihy, ktoré chcete prečítať!</p>
            </div>
          )}
        </div>

        {/* Obľúbené žánre */}
        {favoriteGenres.length > 0 && (
          <div className="genres-section">
            <h3 className="section-title"> Vaše obľúbené žánre</h3>
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

function getFavoriteGenres(readBooks) {
  const genreCounts = {};
  
  readBooks.forEach(book => {
    genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
  });
  
  return Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

export default ProfilePage;