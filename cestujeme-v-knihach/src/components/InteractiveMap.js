// src/components/InteractiveMap.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { toggleBookReadStatus, toggleWishlist } from '../firebase/firestore';
import 'leaflet/dist/leaflet.css';
import './InteractiveMap.css';
import L from 'leaflet';

console.log('🚀 InteractiveMap.js SA NAČÍTAL!');

// Fix pre ikony markerov v Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let color = count === 1 ? '#d73027' : count === 2 ? '#fc8d59' : '#4575b4';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${count}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

const createBookIcon = (count) => {
  let color = count === 1 ? '#d73027' : count === 2 ? '#fc8d59' : '#4575b4';
  
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><span style="font-size: 14px;">${count}</span></div>`,
    className: 'custom-book-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const getNormalizedCoordinates = (book) => {
  if (!book || !book.coordinates) {
    return null;
  }

  const { coordinates } = book;

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const lat = Number(coordinates[0]);
    const lng = Number(coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
  }

  if (typeof coordinates === 'object') {
    const lat = Number(
      coordinates.lat ?? coordinates.latitude ?? coordinates._lat
    );
    const lng = Number(
      coordinates.lng ?? coordinates.lon ?? coordinates.longitude ?? coordinates._long ?? coordinates._lng
    );

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
  }

  return null;
};

function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

function InteractiveMap({ books, user, onBookStatusChange, onWishlistChange }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingBookId, setLoadingBookId] = useState(null);
  const [wishlistLoadingBookId, setWishlistLoadingBookId] = useState(null);
  const [mapCenter, setMapCenter] = useState([50.0, 10.0]);
  const [mapZoom, setMapZoom] = useState(4);
  
  const markerRefs = useRef({});
  const defaultCenter = [50.0, 10.0];
  const defaultZoom = 4;
  const safeBooks = useMemo(() => (Array.isArray(books) ? books : []), [books]);

  useEffect(() => {
    console.log('✅ SelectedLocation zmenené:', selectedLocation);
    if (selectedLocation) {
      console.log('📚 Počet kníh v selectedLocation:', selectedLocation.books.length);
    }
  }, [selectedLocation]);

  const groupedBooks = useMemo(() => {
    const groups = {};
    
    safeBooks.forEach(book => {
      const normalizedCoordinates = getNormalizedCoordinates(book);
      if (!normalizedCoordinates) {
        return;
      }

      const [latValue, lngValue] = normalizedCoordinates;

      const lat = Math.round(latValue * 100) / 100;
      const lng = Math.round(lngValue * 100) / 100;
      const key = `${lat},${lng}`;
      
      if (!groups[key]) {
        groups[key] = {
          coordinates: [lat, lng],
          books: [],
          location: `${book.city}, ${book.country}`,
          key: key
        };
      }
      
      groups[key].books.push(book);
    });
    
    return Object.values(groups);
  }, [safeBooks]);

  const handleMarkerClick = (locationGroup) => {
    console.log('🗺️ Kliknuté na marker:', locationGroup.location);
    setSelectedLocation(locationGroup);
    setMapCenter(locationGroup.coordinates);
    setMapZoom(10);
  };

  const handleBookClick = (book) => {
    console.log('🖱️ KLIKNUTÉ NA KNIHU:', book.title);

    const normalizedCoordinates = getNormalizedCoordinates(book);
    if (!normalizedCoordinates) {
      return;
    }

    const [latValue, lngValue] = normalizedCoordinates;
    
    const lat = Math.round(latValue * 100) / 100;
    const lng = Math.round(lngValue * 100) / 100;
    const locationKey = `${lat},${lng}`;
    
    console.log('🔑 Location key:', locationKey);
    
    const locationGroup = groupedBooks.find(group => group.key === locationKey);
    
    console.log('🗺️ Nájdená locationGroup:', locationGroup);
    
    if (locationGroup) {
      setSelectedLocation(locationGroup);
      setMapCenter(locationGroup.coordinates);
      setMapZoom(10);
      
      setTimeout(() => {
        const markerRef = markerRefs.current[locationKey];
        if (markerRef) {
          markerRef.openPopup();
        }
      }, 100);
    } else {
      console.error('❌ LocationGroup sa nenašla!');
    }
  };

  const handleToggleRead = async (book, e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Pre označenie knihy sa musíte prihlásiť');
      return;
    }

    const isCurrentlyRead = user.readBooks?.includes(book.id);
    setLoadingBookId(book.id);
    
    const result = await toggleBookReadStatus(user.uid, book.id, isCurrentlyRead);
    
    if (result.success) {
      if (typeof onBookStatusChange === 'function') {
        onBookStatusChange(book.id, !isCurrentlyRead);
      }
    } else {
      alert('Nastala chyba: ' + result.error);
    }
    
    setLoadingBookId(null);
  };

  const handleToggleWishlist = async (book, e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Pre pridanie knihy do wishlistu sa musíte prihlásiť');
      return;
    }

    const isCurrentlyInWishlist = user.wishlist?.includes(book.id);
    setWishlistLoadingBookId(book.id);
    
    const result = await toggleWishlist(user.uid, book.id, isCurrentlyInWishlist);
    
    if (result.success) {
      if (typeof onWishlistChange === 'function') {
        onWishlistChange(book.id, !isCurrentlyInWishlist);
      }
    } else {
      alert('Nastala chyba: ' + result.error);
    }
    
    setWishlistLoadingBookId(null);
  };

  const handleShowAllBooks = () => {
    setSelectedLocation(null);
    setMapCenter(defaultCenter);
    setMapZoom(defaultZoom);
  };

  const booksToDisplay = selectedLocation ? selectedLocation.books : safeBooks;
  
  console.log('🔍 Render - selectedLocation:', selectedLocation ? selectedLocation.location : 'null');
  console.log('📖 Render - booksToDisplay count:', booksToDisplay.length);

  return (
    <div className="map-container-wrapper">
      <div className="map-section">
        <div className="map-wrapper">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />
            
            <MarkerClusterGroup
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
            >
              {groupedBooks.map((group, index) => (
                <Marker
                  key={index}
                  position={group.coordinates}
                  icon={createBookIcon(group.books.length)}
                  eventHandlers={{
                    click: () => handleMarkerClick(group)
                  }}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[group.key] = ref;
                    }
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <h4>📍 {group.location}</h4>
                      <p><strong>{group.books.length}</strong> {group.books.length === 1 ? 'kniha' : group.books.length < 5 ? 'knihy' : 'kníh'}</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Zobrazené v sidebari →
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
          
        <div className="map-legend">
          <h4>Legenda:</h4>
          <div className="legend-item">
            <span className="legend-color-dot red"></span>
            <span>1 kniha</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-dot orange"></span>
            <span>2 knihy</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-dot blue"></span>
            <span>3+ kníh</span>
          </div>
          <div className="legend-stats">
            <strong>{safeBooks.length}</strong> kníh na <strong>{groupedBooks.length}</strong> miestach
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="sidebar-header">
          {selectedLocation ? (
            <>
              <h3 className="sidebar-title">📍 {selectedLocation.location}</h3>
              <p className="sidebar-subtitle">
                {selectedLocation.books.length} {selectedLocation.books.length === 1 ? 'kniha' : selectedLocation.books.length < 5 ? 'knihy' : 'kníh'}
              </p>
              <button onClick={handleShowAllBooks} className="show-all-button">
                ← Zobraziť všetky knihy
              </button>
            </>
          ) : (
            <>
              <h3 className="sidebar-title">📚 Všetky knihy</h3>
              <p className="sidebar-subtitle">
                {safeBooks.length} {safeBooks.length === 1 ? 'kniha' : safeBooks.length < 5 ? 'knihy' : 'kníh'} celkom
              </p>
            </>
          )}
        </div>

        <div className="books-list">
          {booksToDisplay.map((book) => {
            const isRead = user?.readBooks?.includes(book.id);
            const isLoading = loadingBookId === book.id;
            const isInWishlist = user?.wishlist?.includes(book.id);
            const isWishlistLoading = wishlistLoadingBookId === book.id;
            
            return (
              <div 
                key={book.id}
                className={`book-card-sidebar ${isRead ? 'read' : ''}`}
                onClick={() => handleBookClick(book)}
              >
                <h4 className="book-card-title">{book.title}</h4>
                <p className="book-card-author">📖 {book.author}</p>
                
                {!selectedLocation && (
                  <>
                    <p className="book-card-location">📍 {book.city}, {book.country}</p>
                    <p className="book-card-hint">Klikni pre zobrazenie na mape</p>
                  </>
                )}

                {selectedLocation && (
                  <div className="book-detail-compact">
                    <p className="book-detail-info">📅 {book.year}</p>
                    <p className="book-detail-info">🏷️ {book.genre}</p>
                    
                    {book.description && (
                      <p className="book-description">{book.description}</p>
                    )}
                    
                    {user && (
                      <>
                        <button
                          onClick={(e) => handleToggleRead(book, e)}
                          disabled={isLoading}
                          className={`read-toggle-btn ${isRead ? 'read' : 'unread'}`}
                        >
                          {isLoading ? '⏳' : (isRead ? '✓ Prečítané' : '+ Označiť ako prečítané')}
                        </button>
                        
                        {/* NOVÉ TLAČIDLO PRE WISHLIST */}
                        <button
                          onClick={(e) => handleToggleWishlist(book, e)}
                          disabled={isWishlistLoading}
                          className={`wishlist-toggle-btn ${isInWishlist ? 'in-wishlist' : 'not-in-wishlist'}`}
                        >
                          {isWishlistLoading ? '⏳' : (isInWishlist ? '⭐ V wishlist-e' : '☆ Pridať do wishlistu')}
                        </button>
                      </>
                    )}
                    
                    {isRead && (
                      <div className="read-badge">
                        ✨ Už ste navštívili toto miesto cez knihu!
                      </div>
                    )}
                    
                    {/* NOVÝ BADGE PRE WISHLIST */}
                    {isInWishlist && !isRead && (
                      <div className="wishlist-badge">
                        ⭐ V zozname želaní
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;