// src/components/AdminPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { addBook, updateBook, deleteBook, getAllBooks } from '../firebase/firestore';
import { getCoordinates, formatCoordinates } from '../utils/geocoding';
import { searchBooks, getCoverUrl, extractGenre, formatAuthors, getAvailableGenres, getLanguageName } from '../utils/openLibraryApi';

const getBookImage = (book) => {
  const fallbackImage = `https://dummyimage.com/200x300/f4efe6/2e2e2e&text=${encodeURIComponent(book?.title || 'Kniha')}`;
  return {
    src: book?.cover || book?.image || fallbackImage,
    fallback: fallbackImage
  };
};

function AdminPage({ user, onBooksChange }) {
  // Stavy
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [foundCoordinates, setFoundCoordinates] = useState(null);
  
  // Nové stavy pre OpenLibrary API
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState('all'); // 'all', 'title', 'author'
  const [searchLanguage, setSearchLanguage] = useState('all'); // 'all', 'slo', 'eng', 'ces'

  // Formulárové polia
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    country: '',
    city: '',
    description: '',
    genre: '',
    year: '',
    image: ''
  });

  // Načítanie kníh - používame useCallback aby sa funkcia nemenila
  const loadBooks = useCallback(async (notifyParent = false) => {
    setIsLoading(true);
    const result = await getAllBooks();
    if (result.success) {
      setBooks(result.books);
      // Informuj parent komponent len ak sa niečo zmenilo (pridalo/upravilo/zmazalo)
      if (notifyParent && onBooksChange) {
        onBooksChange(result.books);
      }
    }
    setIsLoading(false);
  }, [onBooksChange]);

  // Načítanie všetkých kníh pri načítaní stránky
  useEffect(() => {
    loadBooks(false); // false = neinformuj parent, len načítaj
  }, [loadBooks]);

  // Automatické vyhľadanie súradníc keď admin zmení mesto alebo krajinu
  const handleCityCountryChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    const newCity = name === 'city' ? value : formData.city;
    const newCountry = name === 'country' ? value : formData.country;

    if (newCity && newCountry && newCity.length > 2 && newCountry.length > 2) {
      if (window.geocodeTimeout) {
        clearTimeout(window.geocodeTimeout);
      }
      window.geocodeTimeout = setTimeout(async () => {
        setIsLoadingCoordinates(true);
        const result = await getCoordinates(newCity, newCountry);
        setFoundCoordinates(result);
        setIsLoadingCoordinates(false);
      }, 500);
    }
  };

  // Spracovanie zmeny ostatných polí vo formulári
  const handleOtherFieldsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Vyhľadávanie kníh cez OpenLibrary API
  const handleBookSearch = async () => {
    if (!bookSearchQuery || bookSearchQuery.length < 2) {
      setMessage({ text: 'Zadajte aspoň 2 znaky', type: 'warning' });
      return;
    }

    setIsSearching(true);
    const result = await searchBooks(bookSearchQuery, searchType, searchLanguage);
    
    if (result.success) {
      setSearchResults(result.books);
      if (result.books.length === 0) {
        setMessage({ text: 'Žiadne knihy sa nenašli. Skúste iný dotaz alebo jazyk.', type: 'info' });
      } else {
        setMessage({ text: `✅ Našlo sa ${result.books.length} kníh`, type: 'success' });
      }
    } else {
      setMessage({ text: 'Chyba pri vyhľadávaní: ' + result.message, type: 'error' });
    }
    
    setIsSearching(false);
  };

  // Výber knihy z výsledkov vyhľadávania
  const handleSelectBook = (book) => {
    console.log('📖 Vybraná kniha:', book);
    console.log('📚 Subjects:', book.subjects);
    
    // Inteligentná detekcia žánru
    const detectedGenre = extractGenre(book.subjects);
    console.log('🏷️ Detekovaný žáner:', detectedGenre);
    
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: formatAuthors(book.authors),
      year: book.firstPublishYear || '',
      genre: detectedGenre,
      description: book.description || `${book.title} od ${formatAuthors(book.authors)}`,
      image: book.coverId ? getCoverUrl(book.coverId, 'L') : ''
    }));
    
    setShowBookSearch(false);
    setBookSearchQuery('');
    setSearchResults([]);
    setMessage({ 
      text: `✅ Informácie o knihe načítané. Žáner: ${detectedGenre}`, 
      type: 'success' 
    });
  };

  // Odoslanie formulára
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.title || !formData.author || !formData.country || !formData.city) {
      setMessage({ text: 'Vyplňte povinné polia (názov, autor, krajina, mesto)', type: 'error' });
      return;
    }

    setIsLoading(true);

    let coordinates = foundCoordinates?.coordinates;
    
    if (!coordinates) {
      setMessage({ text: 'Hľadám súradnice...', type: 'info' });
      const result = await getCoordinates(formData.city, formData.country);
      coordinates = result.coordinates;
      
      if (!result.success) {
        setMessage({ text: result.message, type: 'warning' });
      }
    }

    const bookData = {
      title: formData.title,
      author: formData.author,
      country: formData.country,
      city: formData.city,
      coordinates: coordinates,
      description: formData.description,
      genre: formData.genre || 'Nezaradené',
      year: parseInt(formData.year) || new Date().getFullYear(),
      image: formData.image || 'https://via.placeholder.com/200x300?text=' + encodeURIComponent(formData.title)
    };

    let result;
    if (editingBook) {
      result = await updateBook(editingBook.id, bookData);
    } else {
      result = await addBook(bookData);
    }

    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      resetForm();
      await loadBooks(true); // true = informuj parent o zmene
    } else {
      setMessage({ text: 'Chyba: ' + result.error, type: 'error' });
    }
    
    setIsLoading(false);
  };

  // Začať úpravu knihy
  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      country: book.country,
      city: book.city,
      description: book.description,
      genre: book.genre,
      year: book.year,
      image: book.image || book.cover || ''
    });
    setFoundCoordinates({ coordinates: book.coordinates, success: true });
    setShowForm(true);
  };

  // Zmazať knihu
  const handleDelete = async (bookId) => {
    if (!window.confirm('Naozaj chcete zmazať túto knihu?')) {
      return;
    }

    const result = await deleteBook(bookId);
    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      await loadBooks(true); // true = informuj parent o zmene
    } else {
      setMessage({ text: 'Chyba: ' + result.error, type: 'error' });
    }
  };

  // Resetovať formulár
  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      country: '',
      city: '',
      description: '',
      genre: '',
      year: '',
      image: ''
    });
    setEditingBook(null);
    setShowForm(false);
    setFoundCoordinates(null);
  };

  // Ak používateľ nie je admin
  if (!user || !user.isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <h2>🚫 Prístup zamietnutý</h2>
          <p>Na túto stránku majú prístup len administrátori.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>👨‍💼 Admin Panel</h1>
        <p>Spravujte knihy v aplikácii</p>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {!showForm && (
        <button className="admin-add-button" onClick={() => setShowForm(true)}>
          ➕ Pridať novú knihu
        </button>
      )}

      {showForm && (
        <div className="admin-form-container">
          <div className="admin-form-header">
            <h2>{editingBook ? '✏️ Upraviť knihu' : '➕ Pridať novú knihu'}</h2>
            <button onClick={resetForm} className="admin-cancel-button">✕ Zrušiť</button>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            {/* OpenLibrary vyhľadávanie */}
            {!showBookSearch ? (
              <div className="book-search-trigger">
                <button 
                  type="button" 
                  onClick={() => setShowBookSearch(true)}
                  className="search-api-button"
                >
                  🔍 Vyhľadať knihu v OpenLibrary API
                </button>
                <p className="helper-text">alebo vyplňte údaje manuálne:</p>
              </div>
            ) : (
              <div className="book-search-container">
                <div className="search-header">
                  <h3>🔍 Vyhľadávanie v OpenLibrary</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowBookSearch(false);
                      setSearchResults([]);
                      setBookSearchQuery('');
                    }}
                    className="close-search"
                  >
                    ✕ Zavrieť
                  </button>
                </div>
                
                {/* Filtre vyhľadávania */}
                <div className="search-filters">
                  <div className="filter-group">
                    <label>Hľadať podľa:</label>
                    <select 
                      value={searchType} 
                      onChange={(e) => setSearchType(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Všetko</option>
                      <option value="title">Názov knihy</option>
                      <option value="author">Autor</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Jazyk:</label>
                    <select 
                      value={searchLanguage} 
                      onChange={(e) => setSearchLanguage(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Všetky jazyky</option>
                      <option value="slo">🇸🇰 Slovenčina</option>
                      <option value="ces">🇨🇿 Čeština</option>
                      <option value="eng">🇬🇧 Angličtina</option>
                      <option value="ger">🇩🇪 Nemčina</option>
                      <option value="fre">🇫🇷 Francúzština</option>
                    </select>
                  </div>
                </div>
                
                <div className="search-input-group">
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleBookSearch())}
                    placeholder="Zadajte názov knihy..."
                    className="api-search-input"
                  />
                  <button 
                    type="button"
                    onClick={handleBookSearch}
                    disabled={isSearching}
                    className="search-button"
                  >
                    {isSearching ? '⏳' : '🔍'} Hľadať
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    <p className="results-count">Našlo sa {searchResults.length} kníh:</p>
                    <div className="results-list">
                      {searchResults.map((book, index) => (
                        <div 
                          key={index} 
                          className="result-item"
                          onClick={() => handleSelectBook(book)}
                        >
                          {book.coverId && (
                            <img 
                              src={getCoverUrl(book.coverId, 'S')} 
                              alt={book.title}
                              className="result-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/60x90?text=?';
                              }}
                            />
                          )}
                          <div className="result-info">
                            <h4>{book.title}</h4>
                            <p className="result-author">✍️ {formatAuthors(book.authors)}</p>
                            {book.firstPublishYear && (
                              <p className="result-year">📅 {book.firstPublishYear}</p>
                            )}
                            {book.language && book.language !== 'unknown' && (
                              <p className="result-language">{getLanguageName(book.language)}</p>
                            )}
                            {book.subjects && book.subjects.length > 0 && (
                              <p className="result-subjects">
                                🏷️ {extractGenre(book.subjects)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Názov knihy *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleOtherFieldsChange}
                  placeholder="Názov knihy"
                  required
                />
              </div>

              <div className="form-group">
                <label>Autor *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleOtherFieldsChange}
                  placeholder="Meno autora"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Krajina *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleCityCountryChange}
                  placeholder="Slovensko"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mesto *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleCityCountryChange}
                  placeholder="Bratislava"
                  required
                />
              </div>
            </div>

            {isLoadingCoordinates && (
              <div className="coordinates-info loading">
                🔍 Hľadám súradnice...
              </div>
            )}
            
            {foundCoordinates && !isLoadingCoordinates && (
              <div className={`coordinates-info ${foundCoordinates.success ? 'success' : 'warning'}`}>
                {foundCoordinates.success ? (
                  <>
                    ✅ Súradnice nájdené: {formatCoordinates(foundCoordinates.coordinates)}
                    {foundCoordinates.displayName && (
                      <div className="location-name">{foundCoordinates.displayName}</div>
                    )}
                  </>
                ) : (
                  <>⚠️ {foundCoordinates.message}</>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Žáner</label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleOtherFieldsChange}
                  className="genre-select"
                >
                  <option value="">Vyberte žáner...</option>
                  {getAvailableGenres().map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rok vydania</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleOtherFieldsChange}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Popis</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleOtherFieldsChange}
                placeholder="Stručný popis knihy..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>URL obrázka obálky</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleOtherFieldsChange}
                placeholder="https://example.com/obalka.jpg"
              />
            </div>

            <button type="submit" className="admin-submit-button" disabled={isLoading}>
              {isLoading ? '⏳ Ukladám...' : (editingBook ? '💾 Uložiť zmeny' : '➕ Pridať knihu')}
            </button>
          </form>
        </div>
      )}

      <div className="admin-books-list">
        <h2>📚 Všetky knihy ({books.length})</h2>
        
        {isLoading ? (
          <div className="admin-loading">Načítavam knihy...</div>
        ) : books.length === 0 ? (
          <div className="admin-empty">Zatiaľ nie sú pridané žiadne knihy</div>
        ) : (
          <div className="admin-books-grid">
            {books.map(book => (
              <div key={book.id} className="admin-book-card">
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
                <div className="admin-book-info">
                  <h3>{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <p className="book-location">📍 {book.city}, {book.country}</p>
                  <p className="book-genre">🏷️ {book.genre}</p>
                </div>
                <div className="admin-book-actions">
                  <button onClick={() => handleEdit(book)} className="edit-btn">
                    ✏️ Upraviť
                  </button>
                  <button onClick={() => handleDelete(book.id)} className="delete-btn">
                    🗑️ Zmazať
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;