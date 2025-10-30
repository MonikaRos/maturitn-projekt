
import React, { useState } from 'react';
import { toggleBookReadStatus } from '../firebase/firestore';

function BookCard({ book, user, isRead, onStatusChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Funkcia na označenie/odznačenie knihy
  const handleToggleRead = async (e) => {
    e.stopPropagation(); // Zabráni expandu pri kliknutí na tlačidlo
    
    if (!user) {
      alert('Pre označenie knihy sa musíte prihlásiť');
      return;
    }

    setIsLoading(true);
    
    const result = await toggleBookReadStatus(user.uid, book.id, isRead);
    
    if (result.success) {
      // Zavolaj callback funkciu na aktualizáciu stavu v rodičovskom komponente
      onStatusChange(book.id, !isRead);
    } else {
      alert('Nastala chyba: ' + result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div 
      className={`book-card ${isRead ? 'book-read' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="book-card-header">
        <div className="book-image">
          <img src={book.image} alt={book.title} />
        </div>
        
        <div className="book-info">
          <h4 className="book-title">{book.title}</h4>
          <p className="book-author">📖 {book.author}</p>
          <p className="book-year">📅 {book.year}</p>
          <p className="book-location">📍 {book.city}, {book.country}</p>
          <p className="book-genre">🏷️ {book.genre}</p>
        </div>
      </div>

      {/* Tlačidlo prečítané */}
      {user && (
        <button
          onClick={handleToggleRead}
          disabled={isLoading}
          className={`read-toggle-button ${isRead ? 'read' : 'unread'}`}
        >
          {isLoading ? '⏳' : (isRead ? '✓ Prečítané' : '+ Označiť ako prečítané')}
        </button>
      )}

      {/* Rozbalený detail */}
      {isExpanded && (
        <div className="book-card-expanded">
          <p className="book-description">{book.description}</p>
          {isRead && (
            <div className="read-badge">
              <span>✨ Už ste navštívili toto miesto cez knihu!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BookCard;