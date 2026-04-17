import React, { useState } from 'react';
import { seedDatabase } from '../utils/seedDatabase';

function SeedDatabaseButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    if (!window.confirm('Naozaj chcete naplniť databázu testovacími dátami? Pridá sa 50 kníh a 5 používateľov.')) {
      return;
    }

    setIsSeeding(true);
    setMessage(' Naplňujem databázu...');

    const result = await seedDatabase();

    if (result.success) {
      setMessage(' Databáza úspešne naplnená! Obnovte stránku.');
    } else {
      setMessage(' Chyba pri naplňovaní databázy. Pozrite konzolu.');
    }

    setIsSeeding(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'white',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        style={{
          padding: '0.8rem 1.5rem',
          background: isSeeding ? '#9ca3af' : '#4c51bf',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSeeding ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem'
        }}
      >
        {isSeeding ? '⏳ Naplňujem...' : '🌱 Naplniť DB'}
      </button>
      {message && (
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: message.includes('✅') ? '#059669' : message.includes('❌') ? '#dc2626' : '#6b7280'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default SeedDatabaseButton;