import React, { useState } from 'react';

function MapPage({ books }) {
  const [selectedBook, setSelectedBook] = useState(null);

  // Zoskupenie kníh podľa krajiny
  const booksByCountry = books.reduce((acc, book) => {
    if (!acc[book.country]) {
      acc[book.country] = [];
    }
    acc[book.country].push(book);
    return acc;
  }, {});

  return (
    <div className="map-page">
      <div className="page-header">
        <h2>🗺️ Mapa literárnych miest</h2>
        <p>Objavte miesta, kde sa odohráli vaše obľúbené knihy</p>
      </div>

      <div className="map-content">
        {/* Tu bude neskôr skutočná mapa - zatiaľ placeholder */}
        <div className="map-placeholder">
          <div className="map-info">
            <h3>🌍 Interaktívna mapa</h3>
            <p>Tu bude zobrazená skutočná mapa s označenými knihami</p>
            <p className="small-text">Zatiaľ zobrazujeme knihy podľa krajín nižšie</p>
          </div>
        </div>

        {/* Zoznam krajín a kníh */}
        <div className="countries-section">
          <h3>📚 Knihy podľa krajín</h3>
          <div className="countries-grid">
            {Object.entries(booksByCountry).map(([country, countryBooks]) => (
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