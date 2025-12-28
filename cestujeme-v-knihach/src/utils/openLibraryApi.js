// src/utils/openLibraryApi.js

/**
 * OpenLibrary API helper funkcie
 * Dokumentácia: https://openlibrary.org/developers/api
 */

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org/b';

/**
 * Vyhľadá knihy podľa názvu alebo autora
 * @param {string} query - Vyhľadávací dotaz
 * @param {string} searchType - 'title', 'author' alebo 'all'
 * @param {string} language - Filter jazyka (napr. 'slo', 'eng', 'ces') alebo 'all'
 */
export const searchBooks = async (query, searchType = 'all', language = 'all') => {
  try {
    console.log('📚 Vyhľadávam knihy:', { query, searchType, language });
    
    if (!query || query.length < 2) {
      return {
        success: false,
        books: [],
        message: 'Zadajte aspoň 2 znaky'
      };
    }

    // Vytvorenie query podľa typu vyhľadávania
    let searchQuery = '';
    if (searchType === 'title') {
      searchQuery = `title:${encodeURIComponent(query)}`;
    } else if (searchType === 'author') {
      searchQuery = `author:${encodeURIComponent(query)}`;
    } else {
      searchQuery = encodeURIComponent(query);
    }

    // OpenLibrary Search API
    let url = `${BASE_URL}/search.json?q=${searchQuery}&limit=20`;
    
    // Pridaj filter jazyka
    if (language !== 'all') {
      url += `&language=${language}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('OpenLibrary API neodpovedá');
    }
    
    const data = await response.json();
    
    if (!data.docs || data.docs.length === 0) {
      return {
        success: true,
        books: [],
        message: 'Žiadne knihy sa nenašli'
      };
    }

    // Spracuj výsledky
    const books = data.docs.map(doc => ({
      key: doc.key,
      title: doc.title,
      author: doc.author_name ? doc.author_name[0] : 'Neznámy autor',
      authors: doc.author_name || [],
      firstPublishYear: doc.first_publish_year || null,
      coverId: doc.cover_i || null,
      isbn: doc.isbn ? doc.isbn[0] : null,
      publishers: doc.publisher || [],
      subjects: doc.subject ? doc.subject.slice(0, 5) : [],
      language: doc.language ? doc.language[0] : 'unknown',
      description: doc.first_sentence ? doc.first_sentence[0] : ''
    }));

    console.log(`✅ Našlo sa ${books.length} kníh`);
    
    return {
      success: true,
      books: books
    };
    
  } catch (error) {
    console.error('❌ Chyba pri vyhľadávaní kníh:', error);
    return {
      success: false,
      books: [],
      message: error.message
    };
  }
};

/**
 * Získa URL obrázka obálky knihy
 */
export const getCoverUrl = (coverId, size = 'M') => {
  if (!coverId) {
    return 'https://via.placeholder.com/200x300?text=Bez+obálky';
  }
  
  // size: S (small), M (medium), L (large)
  return `${COVERS_URL}/id/${coverId}-${size}.jpg`;
};

/**
 * Získa detailné informácie o knihe
 */
export const getBookDetails = async (bookKey) => {
  try {
    console.log('📖 Načítavam detail knihy:', bookKey);
    
    const url = `${BASE_URL}${bookKey}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Nepodarilo sa načítať detail knihy');
    }
    
    const data = await response.json();
    
    // Spracuj popis
    let description = '';
    if (data.description) {
      if (typeof data.description === 'string') {
        description = data.description;
      } else if (data.description.value) {
        description = data.description.value;
      }
    }

    console.log('✅ Detail knihy načítaný');
    
    return {
      success: true,
      book: {
        title: data.title,
        description: description,
        subjects: data.subjects || [],
        covers: data.covers || []
      }
    };
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní detailu:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Vyhľadá knihy podľa ISBN
 */
export const searchByISBN = async (isbn) => {
  try {
    console.log('📚 Vyhľadávam knihu podľa ISBN:', isbn);
    
    const url = `${BASE_URL}/isbn/${isbn}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        message: 'Kniha s týmto ISBN nebola nájdená'
      };
    }
    
    const data = await response.json();
    
    console.log('✅ Kniha nájdená');
    
    return {
      success: true,
      book: {
        title: data.title,
        authors: data.authors || [],
        publishers: data.publishers || [],
        publishDate: data.publish_date,
        covers: data.covers || [],
        isbn: isbn
      }
    };
    
  } catch (error) {
    console.error('❌ Chyba pri vyhľadávaní ISBN:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Formátuje zoznam autorov
 */
export const formatAuthors = (authors) => {
  if (!authors || authors.length === 0) {
    return 'Neznámy autor';
  }
  
  if (authors.length === 1) {
    return authors[0];
  }
  
  if (authors.length === 2) {
    return authors.join(' a ');
  }
  
  // Viac ako 2 autori
  const last = authors[authors.length - 1];
  const others = authors.slice(0, -1).join(', ');
  return `${others} a ${last}`;
};

/**
 * Extrahovanie žánru z tém (subjects)
 * Inteligentná detekcia so slovenským a anglickým mapovaním
 */
export const extractGenre = (subjects) => {
  console.log('🔍 Extrahujem žáner z subjects:', subjects);
  
  if (!subjects || subjects.length === 0) {
    console.log('⚠️ Žiadne subjects, vraciám Beletria');
    return 'Beletria';
  }
  
  // Rozšírené mapovanie s viacerými variáciami
  const genreMap = {
    // Fantasy
    'fantasy': 'Fantasy',
    'magic': 'Fantasy',
    'wizards': 'Fantasy',
    'dragons': 'Fantasy',
    'elves': 'Fantasy',
    
    // Sci-Fi
    'science fiction': 'Sci-Fi',
    'sci-fi': 'Sci-Fi',
    'space': 'Sci-Fi',
    'aliens': 'Sci-Fi',
    'future': 'Sci-Fi',
    
    // Romantika
    'romance': 'Romantika',
    'love': 'Romantika',
    'relationships': 'Romantika',
    
    // Mysteriózne
    'mystery': 'Mysteriózne',
    'suspense': 'Mysteriózne',
    
    // Thriller
    'thriller': 'Thriller',
    'psychological thriller': 'Thriller',
    
    // Horor
    'horror': 'Horor',
    'ghost': 'Horor',
    'supernatural': 'Horor',
    
    // Historická fikcia
    'historical': 'Historická fikcia',
    'history': 'Historická fikcia',
    'historical fiction': 'Historická fikcia',
    'world war': 'Historická fikcia',
    
    // Biografia
    'biography': 'Biografia',
    'autobiography': 'Biografia',
    'memoir': 'Biografia',
    
    // Dráma
    'drama': 'Dráma',
    'tragedy': 'Dráma',
    
    // Dobrodružné
    'adventure': 'Dobrodružné',
    'action': 'Dobrodružné',
    'adventure fiction': 'Dobrodružné',
    
    // Pre deti
    'children': 'Pre deti',
    'juvenile': 'Pre deti',
    'kids': 'Pre deti',
    'picture books': 'Pre deti',
    
    // Pre mladých dospelých
    'young adult': 'Pre mladých dospelých',
    'ya fiction': 'Pre mladých dospelých',
    'teen': 'Pre mladých dospelých',
    
    // Detektívka/Krimi
    'detective': 'Detektívka',
    'crime': 'Krimi',
    'murder': 'Krimi',
    'police': 'Krimi',
    
    // Vojnové
    'war': 'Vojnové',
    'military': 'Vojnové',
    
    // Filozofické
    'philosophy': 'Filozofické',
    'philosophical': 'Filozofické',
    
    // Poézia
    'poetry': 'Poézia',
    'poems': 'Poézia',
    
    // Beletria (všeobecné)
    'fiction': 'Beletria',
    'novel': 'Beletria',
    'novels': 'Beletria',
    'literature': 'Beletria',
    
    // Klasika
    'classic': 'Beletria',
    'classics': 'Beletria',
    
    // Dystopia (zaradíme k Sci-Fi)
    'dystopia': 'Sci-Fi',
    'dystopian': 'Sci-Fi'
  };
  
  // Hľadaj prvý známy žáner (case-insensitive)
  for (const subject of subjects) {
    const subjectLower = subject.toLowerCase().trim();
    console.log('  Kontrolujem subject:', subjectLower);
    
    for (const [key, value] of Object.entries(genreMap)) {
      if (subjectLower.includes(key)) {
        console.log(`  ✅ Našiel som zhodu: "${key}" → "${value}"`);
        return value;
      }
    }
  }
  
  console.log('  ⚠️ Nenašiel som zhodu, vraciám prvý subject:', subjects[0]);
  
  // Ak sa nenájde špecifický žáner, vráť prvý subject alebo Beletria
  const firstSubject = subjects[0];
  
  // Ak prvý subject obsahuje "fiction", vráť Beletria
  if (firstSubject.toLowerCase().includes('fiction')) {
    return 'Beletria';
  }
  
  // Inak vráť prvý subject (môže byť špecifický, napr. "English literature")
  return firstSubject;
};

/**
 * Zoznam dostupných žánrov pre dropdown
 */
export const getAvailableGenres = () => {
  return [
    'Beletria',
    'Fantasy',
    'Sci-Fi',
    'Romantika',
    'Mysteriózne',
    'Thriller',
    'Horor',
    'Historická fikcia',
    'Biografia',
    'História',
    'Poézia',
    'Dráma',
    'Dobrodružné',
    'Pre deti',
    'Pre mladých dospelých',
    'Detektívka',
    'Krimi',
    'Vojnové',
    'Cestopisné',
    'Filozofické',
    'Náboženské',
    'Vedecké',
    'Sebarozvoj',
    'Kuchárska kniha',
    'Umenie',
    'Nezaradené'
  ];
};

/**
 * Získaj lokalizované názvy jazykov
 */
export const getLanguageName = (code) => {
  const languages = {
    'slo': '🇸🇰 Slovenčina',
    'ces': '🇨🇿 Čeština',
    'eng': '🇬🇧 Angličtina',
    'ger': '🇩🇪 Nemčina',
    'fre': '🇫🇷 Francúzština',
    'spa': '🇪🇸 Španielčina',
    'ita': '🇮🇹 Taliančina',
    'pol': '🇵🇱 Poľština',
    'hun': '🇭🇺 Maďarčina',
    'rus': '🇷🇺 Ruština'
  };
  
  return languages[code] || `📚 ${code.toUpperCase()}`;
};