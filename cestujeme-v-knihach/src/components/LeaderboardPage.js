// src/components/LeaderboardPage.js
import React, { useMemo, useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './LeaderboardPage.css';

const getBookImage = (book) => {
  const fallbackImage = `https://dummyimage.com/200x300/f4efe6/2e2e2e&text=${encodeURIComponent(book?.title || 'Kniha')}`;
  return {
    src: book?.cover || book?.image || fallbackImage,
    fallback: fallbackImage
  };
};

function LeaderboardPage({ books, user }) {
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        usersSnapshot.forEach(doc => {
          users.push({ id: doc.id, ...doc.data() });
        });
        console.log('👥 Načítaní používatelia:', users.length);
        users.forEach(u => {
          console.log(`  ${u.displayName}: readBooks =`, u.readBooks);
        });
        setAllUsers(users);
      } catch (error) {
        console.error('❌ Chyba pri načítaní používateľov:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    if (!books || books.length === 0 || isLoadingUsers) return null;

    // Kľúč je vždy číslo (Number) – normalizuj obe strany
    // book.id je číslo, readBooks môže obsahovať čísla alebo stringy
    const bookReadCounts = {};
    books.forEach(book => {
      bookReadCounts[Number(book.id)] = 0;
    });

    allUsers.forEach(u => {
      const readBooks = u.readBooks || [];
      readBooks.forEach(bookId => {
        const normalizedId = Number(bookId);
        if (bookReadCounts[normalizedId] !== undefined) {
          bookReadCounts[normalizedId]++;
        }
      });
    });

    console.log('📊 bookReadCounts:', bookReadCounts);

    // 1. Top knihy podľa počtu prečítaní
    const topBooks = books
      .map(book => ({
        ...book,
        readCount: bookReadCounts[Number(book.id)] || 0
      }))
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 10);

    console.log('📖 Top knihy:', topBooks.map(b => `${b.title}: ${b.readCount}`));

    // 2. Top krajiny
    const countryMap = {};
    books.forEach(book => {
      if (!countryMap[book.country]) {
        countryMap[book.country] = { country: book.country, bookCount: 0, readCount: 0, cities: new Set() };
      }
      countryMap[book.country].bookCount++;
      countryMap[book.country].readCount += bookReadCounts[Number(book.id)] || 0;
      countryMap[book.country].cities.add(book.city);
    });

    const topCountries = Object.values(countryMap)
      .map(c => ({ ...c, citiesCount: c.cities.size }))
      .sort((a, b) => b.bookCount - a.bookCount)
      .slice(0, 10);

    // 3. Top žánre
    const genreMap = {};
    books.forEach(book => {
      if (!genreMap[book.genre]) {
        genreMap[book.genre] = { genre: book.genre, count: 0, readCount: 0 };
      }
      genreMap[book.genre].count++;
      genreMap[book.genre].readCount += bookReadCounts[Number(book.id)] || 0;
    });

    const topGenres = Object.values(genreMap)
      .sort((a, b) => b.readCount - a.readCount || b.count - a.count)
      .slice(0, 8);

    // 4. Top mestá
    const cityMap = {};
    books.forEach(book => {
      const key = `${book.city}||${book.country}`;
      if (!cityMap[key]) {
        cityMap[key] = { city: book.city, country: book.country, count: 0, readCount: 0 };
      }
      cityMap[key].count++;
      cityMap[key].readCount += bookReadCounts[Number(book.id)] || 0;
    });

    const topCities = Object.values(cityMap)
      .sort((a, b) => b.readCount - a.readCount || b.count - a.count)
      .slice(0, 8);

    // 5. Top čitatelia
    const topReaders = allUsers
      .map(u => ({
        id: u.id,
        displayName: u.displayName || u.email || 'Anonymný',
        readCount: (u.readBooks || []).length,
        wishlistCount: (u.wishlist || []).length
      }))
      .filter(u => u.readCount > 0)
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 5);

    // 6. Celkové štatistiky
    const totalReads = Object.values(bookReadCounts).reduce((s, c) => s + c, 0);
    const totalCountries = new Set(books.map(b => b.country)).size;
    const totalCities = new Set(books.map(b => `${b.city}||${b.country}`)).size;
    const totalGenres = new Set(books.map(b => b.genre)).size;

    return {
      topBooks,
      topCountries,
      topGenres,
      topCities,
      topReaders,
      totalBooks: books.length,
      totalReads,
      totalCountries,
      totalCities,
      totalGenres,
      totalUsers: allUsers.length
    };
  }, [books, allUsers, isLoadingUsers]);

  // Štatistiky aktuálneho používateľa
  const userStats = useMemo(() => {
    if (!user || !books || !stats) return null;
    const readList = books.filter(b => (user.readBooks || []).map(Number).includes(Number(b.id)));
    const visitedCountries = new Set(readList.map(b => b.country)).size;
    const visitedCities = new Set(readList.map(b => `${b.city}||${b.country}`)).size;
    const readCount = user.readBooks?.length || 0;
    const usersAhead = allUsers.filter(u => (u.readBooks || []).length > readCount).length;
    return {
      readCount,
      visitedCountries,
      visitedCities,
      wishlistCount: user.wishlist?.length || 0,
      userRank: usersAhead + 1
    };
  }, [user, books, stats, allUsers]);

  if (isLoadingUsers) {
    return (
      <div className="leaderboard-page">
        <div className="page-header">
          <h2>🏆 Rebríčky a štatistiky</h2>
          <p>Načítavam dáta...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="leaderboard-page">
        <div className="page-header">
          <h2>🏆 Rebríčky a štatistiky</h2>
          <p>Žiadne dáta na zobrazenie.</p>
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
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalReads}</div>
            <div className="stat-label">Celkom prečítaní</div>
          </div>
        </div>
      </div>

      {/* Hlavné rebríčky */}
      <div className="leaderboards-container">

        {/* Top knihy */}
        <div className="leaderboard-section">
          <div className="section-header">
            <h3>📖 Najpopulárnejšie knihy</h3>
            <p>Zoradené podľa skutočného počtu prečítaní</p>
          </div>
          <div className="leaderboard-list">
            {stats.topBooks.map((book, index) => (
              <div key={book.id} className="leaderboard-item">
                <div className="rank-badge" data-rank={index + 1}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                <div className="item-image">
                  <img
                    src={getBookImage(book).src}
                    alt={book.title}
                    onError={(e) => {
                      const { fallback } = getBookImage(book);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </div>
                <div className="item-info">
                  <h4>{book.title}</h4>
                  <p className="item-subtitle">{book.author}</p>
                  <p className="item-meta">📍 {book.city}, {book.country}</p>
                </div>
                <div className="item-score">
                  <div className="score-value">{book.readCount}</div>
                  <div className="score-label">
                    {book.readCount === 1 ? 'čítanie' : book.readCount < 5 ? 'čítania' : 'čítaní'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top krajiny */}
        <div className="leaderboard-section">
          <div className="section-header">
            <h3>🌍 Najpopulárnejšie krajiny</h3>
            <p>Zoradené podľa počtu kníh</p>
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
                  <p className="item-meta">
                    {country.citiesCount} {country.citiesCount === 1 ? 'mesto' : 'mestá'} · {country.readCount} prečítaní
                  </p>
                </div>
                <div className="item-score">
                  <div className="score-value">{country.bookCount}</div>
                  <div className="score-label">kníh</div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(country.bookCount / stats.topCountries[0].bookCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Žánre a mestá */}
      <div className="secondary-stats">
        <div className="leaderboard-section compact">
          <div className="section-header">
            <h3>🎭 Najpopulárnejšie žánre</h3>
            <p>Zoradené podľa počtu prečítaní</p>
          </div>
          <div className="genre-grid">
            {stats.topGenres.map((genre, index) => (
              <div key={genre.genre} className="genre-card">
                <div className="genre-rank">#{index + 1}</div>
                <div className="genre-name">{genre.genre}</div>
                <div className="genre-count">
                  {genre.count} {genre.count === 1 ? 'kniha' : 'kníh'} · <strong>{genre.readCount}</strong> prečítaní
                </div>
                <div className="genre-bar">
                  <div
                    className="genre-bar-fill"
                    style={{ width: `${stats.topGenres[0].readCount > 0 ? (genre.readCount / stats.topGenres[0].readCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="leaderboard-section compact">
          <div className="section-header">
            <h3>🏙️ Najpopulárnejšie mestá</h3>
            <p>Zoradené podľa počtu prečítaní</p>
          </div>
          <div className="cities-list">
            {stats.topCities.map((city, index) => (
              <div key={`${city.city}-${city.country}`} className="city-item">
                <div className="city-rank">#{index + 1}</div>
                <div className="city-info">
                  <div className="city-name">{city.city}</div>
                  <div className="city-country">{city.country}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                  <div className="city-count">{city.readCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>prečítaní</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top čitatelia */}
      {stats.topReaders.length > 0 && (
        <div className="leaderboard-section" style={{ marginBottom: '2rem' }}>
          <div className="section-header">
            <h3>👑 Top čitatelia</h3>
            <p>Najaktívnejší čitatelia v komunite</p>
          </div>
          <div className="leaderboard-list">
            {stats.topReaders.map((reader, index) => (
              <div key={reader.id} className="leaderboard-item">
                <div className="rank-badge" data-rank={index + 1}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                <div className="item-info">
                  <h4>{reader.displayName}</h4>
                  <p className="item-meta">⭐ {reader.wishlistCount} vo wishlist-e</p>
                </div>
                <div className="item-score">
                  <div className="score-value">{reader.readCount}</div>
                  <div className="score-label">
                    {reader.readCount === 1 ? 'kniha' : reader.readCount < 5 ? 'knihy' : 'kníh'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Štatistiky prihláseného používateľa */}
      {user && userStats && (
        <div className="user-comparison">
          <div className="section-header">
            <h3>📊 Vaše štatistiky</h3>
            <p>
              {stats.totalUsers > 0
                ? `Ste na ${userStats.userRank}. mieste spomedzi ${stats.totalUsers} čitateľov`
                : 'Vaše osobné štatistiky'}
            </p>
          </div>
          <div className="comparison-cards">
            <div className="comparison-card">
              <div className="comparison-icon">📚</div>
              <div className="comparison-value">{userStats.readCount}</div>
              <div className="comparison-label">Prečítaných kníh</div>
              <div className="comparison-percentage">
                {stats.totalBooks > 0
                  ? `${((userStats.readCount / stats.totalBooks) * 100).toFixed(1)}% z celku`
                  : '–'}
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-icon">🌍</div>
              <div className="comparison-value">{userStats.visitedCountries}</div>
              <div className="comparison-label">Navštívených krajín</div>
              <div className="comparison-percentage">
                {stats.totalCountries > 0
                  ? `${((userStats.visitedCountries / stats.totalCountries) * 100).toFixed(1)}% z celku`
                  : '–'}
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-icon">🏙️</div>
              <div className="comparison-value">{userStats.visitedCities}</div>
              <div className="comparison-label">Navštívených miest</div>
              <div className="comparison-percentage">
                {stats.totalCities > 0
                  ? `${((userStats.visitedCities / stats.totalCities) * 100).toFixed(1)}% z celku`
                  : '–'}
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-icon">⭐</div>
              <div className="comparison-value">{userStats.wishlistCount}</div>
              <div className="comparison-label">Vo wishlist-e</div>
              <div className="comparison-percentage">Ďalšie dobrodružstvá čakajú!</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;