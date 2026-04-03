// src/components/PersonalMap.js
import React, { useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import './PersonalMap.css';
import L from 'leaflet';

// Fix pre ikony markerov v Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Zelená ikona pre prečítané knihy
const createReadBookIcon = (count) => {
  return new L.DivIcon({
    html: `<div style="background-color: #6281b7; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><span style="font-size: 14px;">${count}</span></div>`,
    className: 'personal-book-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let color = count === 1 ? '#272856' : count === 2 ? '#6281b7' : '#bec0de';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${count}</div>`,
    className: 'personal-marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

function PersonalMap({ readBooks }) {
  const markerRefs = useRef({});
  const defaultCenter = [50.0, 10.0];
  const defaultZoom = 4;

  // Zoskupenie kníh podľa GPS koordinátov
  const groupedBooks = useMemo(() => {
    const groups = {};
    
    readBooks.forEach(book => {
      const lat = Math.round(book.coordinates[0] * 100) / 100;
      const lng = Math.round(book.coordinates[1] * 100) / 100;
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
  }, [readBooks]);

  if (readBooks.length === 0) {
    return (
      <div className="personal-map-empty">
        <div className="empty-icon"></div>
        <h3>Vaša literárna mapa je prázdna</h3>
        <p>Začnite označovať knihy ako prečítané a uvidíte ich tu!</p>
      </div>
    );
  }

  return (
    <div className="personal-map-container">
      <div className="personal-map-header">
        <h3> Vaša literárna mapa</h3>
        <p>Miesta, ktoré ste navštívili cez knihy</p>
      </div>

      <div className="personal-map-wrapper">
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
          
          <MarkerClusterGroup
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {groupedBooks.map((group, index) => (
              <Marker
                key={index}
                position={group.coordinates}
                icon={createReadBookIcon(group.books.length)}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[group.key] = ref;
                  }
                }}
              >
                <Popup>
                  <div className="personal-popup">
                    <h4>📍 {group.location}</h4>
                    <p className="popup-count">
                      <strong>{group.books.length}</strong> {group.books.length === 1 ? 'prečítaná kniha' : group.books.length < 5 ? 'prečítané knihy' : 'prečítaných kníh'}
                    </p>
                    <div className="popup-books">
                      {group.books.map((book, idx) => (
                        <div key={book.id} className="popup-book">
                          <strong>{book.title}</strong>
                          <span className="popup-author"> • {book.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <div className="personal-map-stats">
        <div className="stat-item">
          <span className="stat-icon">📚</span>
          <div>
            <div className="stat-number">{readBooks.length}</div>
            <div className="stat-label">Prečítaných kníh</div>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📍</span>
          <div>
            <div className="stat-number">{groupedBooks.length}</div>
            <div className="stat-label">Navštívených miest</div>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌍</span>
          <div>
            <div className="stat-number">{[...new Set(readBooks.map(b => b.country))].length}</div>
            <div className="stat-label">Krajín</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalMap;