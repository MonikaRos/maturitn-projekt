import React, { useState } from 'react';
import InteractiveMap from './InteractiveMap';

function MapPage({ books }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Zoskupenie kníh podľa krajiny
  const booksByCountry = books.reduce((acc, book) => {
    if (!acc[book.country]) {
      acc[book.country] = [];
    }
    acc[book.country].push(book);
    return acc;
  }, {});

  // Funkcia pri kliknutí na knihu na mape
  const handleMapBookClick = (book) => {
    setSelectedBook(book);
    setSelectedCountry(book.country);
  };

  // Filtrovanie kníh podľa vybranej krajiny
  const displayedCountries = selectedCountry 
    ? { [selectedCountry]: booksByCountry[selectedCountry] }
    : booksByCountry;

  return (
    <div className="map-page">
      <div className="page-header">
        <h2>🗺️ Mapa literárnych miest</h2>
        <p>Objavte miesta, kde sa odohráli vaše obľúbené knihy</p>
      </div>

      <div className="map-content">
        {/* Skutočná interaktívna mapa */}
        <InteractiveMap 
          books={books} 
          onBookClick={handleMapBookClick}
        />
        
        {/* Informácia o vybranej knihe/krajine */}
        {selectedBook && (
          <div className="selected-info">
            <button 
              onClick={() => {
                setSelectedBook(null);
                setSelectedCountry(null);
              }}
              className="clear-selection"
            >
              ✕ Zrušiť výber
            </button>
            <h3>Vybratá kniha: {selectedBook.title}</h3>
            <p>Zobrazujú sa knihy z krajiny: <strong>{selectedBook.country}</strong></p>
          </div>
        )}

        {/* Zoznam krajín a kníh */}
        <div className="countries-section">
          <h3>📚 Knihy podľa krajín</h3>
          <div className="countries-grid">
            {Object.entries(displayedCountries).map(([country, countryBooks]) => (
              <div key={country} className="country-card">
                <h4 className="country-name">🏳️ {country}</h4>
                <p className="books-count">{countryBooks.length} {countryBooks.length === 1 ? 'kniha' : 'kníh'}</p>
                
                <div className="books-list">
                  {countryBooks.map(book => (
                    <div 
                      key={book.id} 
                      className={`book-item ${selectedBook?.id === book.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBook(selectedBook?.id === book.id ? null : book)}
                    >
                      <h5>{book.title}</h5>
                      <p className="author">{book.author}</p>
                      <p className="location">📍 {book.city}</p>
                      
                      {selectedBook?.id === book.id && (
                        <div className="book-details">
                          <p><strong>Rok vydania:</strong> {book.year}</p>
                          <p><strong>Žáner:</strong> {book.genre}</p>
                          <p><strong>Popis:</strong> {book.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;