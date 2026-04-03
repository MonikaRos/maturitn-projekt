// src/components/SearchPage.js
import React, { useState, useEffect } from 'react';
import BookCard from './BookCard';

function SearchPage({ books, user, onBookStatusChange, onWishlistChange }) {
  // Stavy pre vyhľadávanie
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBooks, setFilteredBooks] = useState(books);
  const [filterBy, setFilterBy] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Získanie jedinečných žánrov zo všetkých kníh
  const genres = [...new Set(books.map(book => book.genre))];

  // Funkcia na filtrovanie kníh
  useEffect(() => {
    let filtered = books;

    // Filter podľa žánru
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === selectedGenre);
    }

    // Filter podľa vyhľadávacieho textu
    if (searchTerm !== '') {
      const searchLower = searchTerm.toLowerCase();
      
      filtered = filtered.filter(book => {
        switch (filterBy) {
          case 'title':
            return book.title.toLowerCase().includes(searchLower);
          case 'author':
            return book.author.toLowerCase().includes(searchLower);
          case 'country':
            return book.country.toLowerCase().includes(searchLower) || 
                   book.city.toLowerCase().includes(searchLower);
          case 'all':
          default:
            return book.title.toLowerCase().includes(searchLower) ||
                   book.author.toLowerCase().includes(searchLower) ||
                   book.country.toLowerCase().includes(searchLower) ||
                   book.city.toLowerCase().includes(searchLower) ||
                   book.description.toLowerCase().includes(searchLower);
        }
      });
    }

    setFilteredBooks(filtered);
  }, [searchTerm, filterBy, selectedGenre, books]);

  const clearSearch = () => {
    setSearchTerm('');
    setFilterBy('all');
    setSelectedGenre('all');
  };

  return (
    <div className="search-page">
      <div className="page-header">
        <h2> Vyhľadávanie kníh</h2>
        <p>Nájdite knihy podľa názvu, autora, miesta alebo žánru</p>
      </div>

      {/* Vyhľadávacie nástroje */}
      <div className="search-tools">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Zadajte hľadaný výraz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              ✕
            </button>
          )}
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Hľadať v:</label>
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value)}
              className="filter-select"
            >
              <option value="all">Všetko</option>
              <option value="title">Názov knihy</option>
              <option value="author">Autor</option>
              <option value="country">Krajina/Mesto</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Žáner:</label>
            <select 
              value={selectedGenre} 
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="filter-select"
            >
              <option value="all">Všetky žánre</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <button onClick={clearSearch} className="clear-all-button">
            Vyčistiť všetko
          </button>
        </div>
      </div>

      {/* Výsledky */}
      <div className="search-results">
        <div className="results-header">
          <h3>
            {searchTerm || selectedGenre !== 'all' 
              ? `Výsledky vyhľadávania (${filteredBooks.length})` 
              : `Všetky knihy (${books.length})`
            }
          </h3>
          
          {(searchTerm || selectedGenre !== 'all') && (
            <div className="active-filters">
              {searchTerm && (
                <span className="filter-tag">
                  Hľadáte: "{searchTerm}"
                </span>
              )}
              {selectedGenre !== 'all' && (
                <span className="filter-tag">
                  Žáner: {selectedGenre}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Zoznam výsledkov - POUŽÍVA BookCard! */}
        {filteredBooks.length > 0 ? (
          <div className="books-grid">
            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                user={user}
                isRead={user?.readBooks?.includes(book.id)}
                isInWishlist={user?.wishlist?.includes(book.id)}
                onStatusChange={onBookStatusChange}
                onWishlistChange={onWishlistChange}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon"></div>
            <h3>Žiadne knihy sa nenašli</h3>
            <p>Skúste zmeniť vyhľadávacie kritériá alebo vyčistiť filtre</p>
            <button onClick={clearSearch} className="try-again-button">
              Vyčistiť filtre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;