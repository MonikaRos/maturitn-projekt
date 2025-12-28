// src/components/InteractiveMap.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pre ikony markerov v Leaflet (React má s tým problém)
// Toto je technické riešenie - nemusíš to úplne chápať, len to skopíruj
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Vytvorenie vlastnej ikony pre knihy
const bookIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Komponent na centrovanie mapy na vybranú knihu
function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 8); // zoom level 8
    }
  }, [center, map]);
  
  return null;
}

function InteractiveMap({ books, onBookClick }) {
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Východiskové nastavenie mapy - centrum Európy
  const defaultCenter = [50.0, 10.0];
  const defaultZoom = 4;

  const handleMarkerClick = (book) => {
    setSelectedBook(book);
    if (onBookClick) {
      onBookClick(book);
    }
  };

  return (
    <div className="interactive-map-container">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
        scrollWheelZoom={true}
      >
        {/* TileLayer - to sú skutočné mapové dlaždice z OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* MapController - automaticky centruje mapu na vybranú knihu */}
        {selectedBook && <MapController center={selectedBook.coordinates} />}
        
        {/* Markery pre každú knihu */}
        {books.map(book => (
          <Marker
            key={book.id}
            position={book.coordinates}
            icon={bookIcon}
            eventHandlers={{
              click: () => handleMarkerClick(book)
            }}
          >
            {/* Popup - to čo sa zobrazí po kliknutí na marker */}
            <Popup>
              <div className="map-popup">
                <h3>{book.title}</h3>
                <p className="popup-author">📖 {book.author}</p>
                <p className="popup-location">📍 {book.city}, {book.country}</p>
                <p className="popup-year">📅 {book.year}</p>
                <p className="popup-genre">🏷️ {book.genre}</p>
                <p className="popup-description">{book.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legenda */}
      <div className="map-legend">
        <h4>Legenda:</h4>
        <div className="legend-item">
          <span className="legend-marker">📍</span>
          <span>Kliknutím na červený marker zobrazíte detail knihy</span>
        </div>
        <div className="legend-stats">
          <strong>{books.length}</strong> kníh na <strong>{[...new Set(books.map(b => b.country))].length}</strong> miestach
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;