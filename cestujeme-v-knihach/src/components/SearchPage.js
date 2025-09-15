
import React, { useState, useEffect } from 'react';

function SearchPage({ books }) {
  // Stavy pre vyhľadávanie
  const [searchTerm, setSearchTerm] = useState(''); // čo používateľ píše do vyhľadávania
  const [filteredBooks, setFilteredBooks] = useState(books); // vyfiltrované knihy
  const [filterBy, setFilterBy] = useState('all'); // podľa čoho filtrovať (všetko, názov, autor, krajina)
  const [selectedGenre, setSelectedGenre] = useState('all'); // filter podľa žánru

  // Získanie jedinečných žánrov zo všetkých kníh
  const genres = [...new Set(books.map(book => book.genre))];

  // Funkcia na filtrovanie kníh - spustí sa vždy keď sa zmení vyhľadávaný text alebo filter
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
  }, [searchTerm, filterBy, selectedGenre, books]); // spustí sa pri zmene týchto hodnôt

  // Funkcia na vyčistenie vyhľadávania
  const clearSearch = () => {
    setSearchTerm('');
    setFilterBy('all');
    setSelectedGenre('all');
  };

  return (
    <div className="search-page">
      <div className="page-header">
        <h2>🔍 Vyhľadávanie kníh</h2>
        <p>Nájdite knihy podľa názvu, autora, miesta alebo žánru</p>
      </div>

      {/* Vyhľadávacie nástroje */}
      <div className="search-tools">
        {/* Hlavné vyhľadávacie pole */}
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

        {/* Filtre */}
        <div className="filters">
          {/* Filter podľa kategórie */}
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

          {/* Filter podľa žánru */}
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

          {/* Tlačidlo na vyčistenie */}
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
          
          {/* Zobrazenie aktívnych filtrov */}
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

        {/* Zoznam výsledkov */}
        {filteredBooks.length > 0 ? (
          <div className="books-grid">
            {filteredBooks.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-image">
                  <img src={book.image} alt={book.title} />
                </div>
                
                <div className="book-info">
                  <h4 className="book-title">{book.title}</h4>
                  <p className="book-author">📖 {book.author}</p>
                  <p className="book-year">📅 {book.year}</p>
                  <p className="book-location">📍 {book.city}, {book.country}</p>
                  <p className="book-genre">🏷️ {book.genre}</p>
                  <p className="book-description">{book.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">📚</div>
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