// src/components/BookCard.js
import React, { useState } from 'react';
import { toggleBookReadStatus, toggleWishlist } from '../firebase/firestore';

function BookCard({ book, user, isRead, isInWishlist, onStatusChange, onWishlistChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Funkcia na označenie/odznačenie knihy ako prečítanú
  const handleToggleRead = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Pre označenie knihy sa musíte prihlásiť');
      return;
    }

    setIsLoading(true);
    
    const result = await toggleBookReadStatus(user.uid, book.id, isRead);
    
    if (result.success) {
      onStatusChange(book.id, !isRead);
    } else {
      alert('Nastala chyba: ' + result.error);
    }
    
    setIsLoading(false);
  };

  // Funkcia na pridanie/odobratie knihy z wishlistu
  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Pre pridanie knihy do wishlistu sa musíte prihlásiť');
      return;
    }

    setIsWishlistLoading(true);
    
    const result = await toggleWishlist(user.uid, book.id, isInWishlist);
    
    if (result.success) {
      onWishlistChange(book.id, !isInWishlist);
    } else {
      alert('Nastala chyba: ' + result.error);
    }
    
    setIsWishlistLoading(false);
  };

  return (
    <div 
      className={`book-card ${isRead ? 'book-read' : ''} ${isInWishlist ? 'book-wishlist' : ''}`}
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

      {/* Tlačidlá */}
      {user && (
        <div className="book-card-actions">
          <button
            onClick={handleToggleRead}
            disabled={isLoading}
            className={`read-toggle-button ${isRead ? 'read' : 'unread'}`}
          >
            {isLoading ? '⏳' : (isRead ? '✓ Prečítané' : '+ Označiť ako prečítané')}
          </button>
          
          <button
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading}
            className={`wishlist-toggle-button ${isInWishlist ? 'in-wishlist' : 'not-in-wishlist'}`}
          >
            {isWishlistLoading ? '⏳' : (isInWishlist ? '⭐ V wishlist-e' : '☆ Pridať do wishlistu')}
          </button>
        </div>
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
          {isInWishlist && !isRead && (
            <div className="wishlist-badge">
              <span>⭐ V zozname želaní</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BookCard;