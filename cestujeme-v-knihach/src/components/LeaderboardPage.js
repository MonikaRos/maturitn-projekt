
import React, { useMemo } from 'react';
import './LeaderboardPage.css';

function LeaderboardPage({ books, user }) {
  // Výpočet štatistík
  const stats = useMemo(() => {
    if (!books || books.length === 0) return null;

    // 1. Najpopulárnejšie knihy (najčítanejšie)
    const bookReadCounts = {};
    books.forEach(book => {
      // Simulujeme počet čítaní - v reálnej app by to bolo z Firebase
      // Zatiaľ použijeme náhodné čísla pre demonštráciu
      bookReadCounts[book.id] = Math.floor(Math.random() * 100) + 1;
    });

    const topBooks = books
      .map(book => ({
        ...book,
        readCount: bookReadCounts[book.id]
      }))
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 10);

    // 2. Najpopulárnejšie krajiny
    const countryStats = {};
    books.forEach(book => {
      if (!countryStats[book.country]) {
        countryStats[book.country] = {
          country: book.country,
          bookCount: 0,
          cities: new Set()
        };
      }
      countryStats[book.country].bookCount++;
      countryStats[book.country].cities.add(book.city);
    });

    const topCountries = Object.values(countryStats)
      .map(stat => ({
        ...stat,
        citiesCount: stat.cities.size
      }))
      .sort((a, b) => b.bookCount - a.bookCount)
      .slice(0, 10);

    // 3. Najpopulárnejšie žánre
    const genreStats = {};
    books.forEach(book => {
      if (!genreStats[book.genre]) {
        genreStats[book.genre] = 0;
      }
      genreStats[book.genre]++;
    });

    const topGenres = Object.entries(genreStats)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 4. Najpopulárnejšie mestá
    const cityStats = {};
    books.forEach(book => {
      const cityKey = `${book.city}, ${book.country}`;
      if (!cityStats[cityKey]) {
        cityStats[cityKey] = {
          city: book.city,
          country: book.country,
          count: 0
        };
      }
      cityStats[cityKey].count++;
    });

    const topCities = Object.values(cityStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 5. Celkové štatistiky
    const totalCountries = new Set(books.map(b => b.country)).size;
    const totalCities = new Set(books.map(b => `${b.city}, ${b.country}`)).size;
    const totalGenres = new Set(books.map(b => b.genre)).size;

    return {
      topBooks,
      topCountries,
      topGenres,
      topCities,
      totalBooks: books.length,
      totalCountries,
      totalCities,
      totalGenres
    };
  }, [books]);

  if (!stats) {
    return (
      <div className="leaderboard-page">
        <div className="page-header">
          <h2>🏆 Rebríčky a štatistiky</h2>
          <p>Načítavam dáta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h2>🏆 Rebríčky a štatistiky</h2>
        <p>Objavte najpopulárnejšie knihy, krajiny a žánre v našej zbierke</p>
      </div>

      {/* Celkové štatistiky */}
      <div className="overall-stats">
        <div className="stat-box">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBooks}</div>
            <div className="stat-label">Celkom kníh</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🌍</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCountries}</div>
            <div className="stat-label">Krajín</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🏙️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCities}</div>
            <div className="stat-label">Miest</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🎭</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalGenres}</div>
            <div className="stat-label">Žánrov</div>
          </div>
        </div>
      </div>

      {/* Rebríčky */}
      <div className="leaderboards-container">
        {/* Top knihy */}
        <div className="leaderboard-section">
          <div className="section-header">
            <h3>📖 Najpopulárnejšie knihy</h3>
            <p>TOP 10 najčítanejších kníh</p>
          </div>
          <div className="leaderboard-list">
            {stats.topBooks.map((book, index) => (
              <div key={book.id} className="leaderboard-item">
                <div className="rank-badge" data-rank={index + 1}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                <div className="item-image">
                  <img src={book.image} alt={book.title} />
                </div>
                <div className="item-info">
                  <h4>{book.title}</h4>
                  <p className="item-subtitle">{book.author}</p>
                  <p className="item-meta">📍 {book.city}, {book.country}</p>
                </div>
                <div className="item-score">
                  <div className="score-value">{book.readCount}</div>
                  <div className="score-label">čítaní</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top krajiny */}
        <div className="leaderboard-section">
          <div className="section-header">
            <h3>🌍 Najpopulárnejšie krajiny</h3>
            <p>TOP 10 najnavštevovanejších krajín</p>
          </div>
          <div className="leaderboard-list">
            {stats.topCountries.map((country, index) => (
              <div key={country.country} className="leaderboard-item country-item">
                <div className="rank-badge" data-rank={index + 1}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                <div className="country-flag">🌍</div>
                <div className="item-info">
                  <h4>{country.country}</h4>
                  <p className="item-meta">{country.citiesCount} {country.citiesCount === 1 ? 'mesto' : 'mestá'}</p>
                </div>
                <div className="item-score">
                  <div className="score-value">{country.bookCount}</div>
                  <div className="score-label">kníh</div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(country.bookCount / stats.topCountries[0].bookCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Žánre a Mestá vedľa seba */}
      <div className="secondary-stats">
        {/* Top žánre */}
        <div className="leaderboard-section compact">
          <div className="section-header">
            <h3>🎭 Najpopulárnejšie žánre</h3>
          </div>
          <div className="genre-grid">
            {stats.topGenres.map((genre, index) => (
              <div key={genre.genre} className="genre-card">
                <div className="genre-rank">#{index + 1}</div>
                <div className="genre-name">{genre.genre}</div>
                <div className="genre-count">{genre.count} kníh</div>
                <div className="genre-bar">
                  <div 
                    className="genre-bar-fill" 
                    style={{ width: `${(genre.count / stats.topGenres[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top mestá */}
        <div className="leaderboard-section compact">
          <div className="section-header">
            <h3>🏙️ Najpopulárnejšie mestá</h3>
          </div>
          <div className="cities-list">
            {stats.topCities.map((city, index) => (
              <div key={`${city.city}-${city.country}`} className="city-item">
                <div className="city-rank">#{index + 1}</div>
                <div className="city-info">
                  <div className="city-name">{city.city}</div>
                  <div className="city-country">{city.country}</div>
                </div>
                <div className="city-count">{city.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User stats ak je prihlásený */}
      {user && (
        <div className="user-comparison">
          <div className="section-header">
            <h3>📊 Vaše štatistiky</h3>
            <p>Ako si stojíte v porovnaní s ostatnými?</p>
          </div>
          <div className="comparison-cards">
            <div className="comparison-card">
              <div className="comparison-icon">📚</div>
              <div className="comparison-value">{user.readBooks?.length || 0}</div>
              <div className="comparison-label">Prečítaných kníh</div>
              <div className="comparison-percentage">
                {((user.readBooks?.length || 0) / stats.totalBooks * 100).toFixed(1)}% z celku
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-icon">🌍</div>
              <div className="comparison-value">
                {new Set(books.filter(b => user.readBooks?.includes(b.id)).map(b => b.country)).size}
              </div>
              <div className="comparison-label">Navštívených krajín</div>
              <div className="comparison-percentage">
                {(new Set(books.filter(b => user.readBooks?.includes(b.id)).map(b => b.country)).size / stats.totalCountries * 100).toFixed(1)}% z celku
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-icon">⭐</div>
              <div className="comparison-value">{user.wishlist?.length || 0}</div>
              <div className="comparison-label">Vo wishlist-e</div>
              <div className="comparison-percentage">
                Ďalšie dobrodružstvá čakajú!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;