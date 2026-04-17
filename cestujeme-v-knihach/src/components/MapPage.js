import React from 'react';
import InteractiveMap from './InteractiveMap';

function MapPage({ books, user, onBookStatusChange, onWishlistChange }) {
  return (
    <div className="map-page">
      <div className="page-header">
        <h2> Mapa literárnych miest</h2>
        <p>Objavte miesta, kde sa odohráli vaše obľúbené knihy</p>
      </div>

      <div className="map-content">
        {/* Všetka potrebná logika je v InteractiveMap aby to bolo prehľadné tu iba kompletujeme */}
        <InteractiveMap 
          books={books} 
          user={user}
          onBookStatusChange={onBookStatusChange}
          onWishlistChange={onWishlistChange}
        />
      </div>
    </div>
  );
}

export default MapPage;