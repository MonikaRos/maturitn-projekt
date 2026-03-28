// src/utils/seedDatabase.js
// TENTO SCRIPT SPUSTI LEN RAZ aby si naplnila databázu testovacími dátami

import { db, auth } from '../firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER_URL = 'https://covers.openlibrary.org/b/id';

const getFallbackCoverUrl = (title) =>
  `https://dummyimage.com/200x300/f4efe6/2e2e2e&text=${encodeURIComponent(title || 'Kniha')}`;

const getOpenLibraryCoverUrl = (coverId, size = 'L') => `${OPEN_LIBRARY_COVER_URL}/${coverId}-${size}.jpg`;

const fetchRealCoverUrl = async (book) => {
  try {
    const params = new URLSearchParams({
      title: book.title,
      author: book.author,
      limit: '10'
    });

    const response = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`);
    if (!response.ok) {
      return getFallbackCoverUrl(book.title);
    }

    const data = await response.json();
    const docs = data?.docs || [];

    const normalizedTitle = (book.title || '').toLowerCase().trim();
    const normalizedAuthor = (book.author || '').toLowerCase().trim();

    const exactMatch = docs.find((doc) => {
      const docTitle = (doc.title || '').toLowerCase().trim();
      const docAuthor = (doc.author_name?.[0] || '').toLowerCase().trim();
      return doc.cover_i && docTitle === normalizedTitle && docAuthor.includes(normalizedAuthor);
    });

    if (exactMatch?.cover_i) {
      return getOpenLibraryCoverUrl(exactMatch.cover_i);
    }

    const withCover = docs.find((doc) => doc.cover_i);
    if (withCover?.cover_i) {
      return getOpenLibraryCoverUrl(withCover.cover_i);
    }

    return getFallbackCoverUrl(book.title);
  } catch (error) {
    console.warn(`⚠️ Nepodarilo sa načítať obálku pre: ${book.title}`, error);
    return getFallbackCoverUrl(book.title);
  }
};

// Všetky súradnice sú hardcoded — žiadne volanie Nominatim API
// Formát: [lat, lon]
const BOOK_COORDINATES = {
  // SLOVENSKO
  'Hybe':          [49.0469, 19.7456],
  'Nitra':         [48.3069, 18.0857],
  'Bratislava':    [48.1486, 17.1077],
  'Piešťany':      [48.5875, 17.8264],
  'Orava':         [49.3667, 19.2833],
  'Košice':        [48.7164, 21.2611],
  'Ábelová':       [48.3564, 19.6022],
  'Banská Štiavnica': [48.4584, 18.8910],


  // ČESKO
  'Praha':         [50.0755, 14.4378],
  'Ratibořice':    [50.4033, 16.0650],
  'Miletín':       [50.4528, 15.6789],

  // FRANCÚZSKO
  'Paríž':         [48.8566,  2.3522],
  'Rouen':         [49.4431,  1.0993],
  'Grasse':        [43.6597,  6.9228],
  'Lille':         [50.6292,  3.0573],
  'Carcassonne':   [43.2130,  2.3491],

  // VEĽKÁ BRITÁNIA
  'Londýn':        [51.5074, -0.1278],
  'Hertfordshire': [51.8062, -0.2383],
  'Yorkshire':     [54.0000, -1.5000],
  'Whitby':        [54.4858, -0.6206],
  'Edinburgh':     [55.9533, -3.1883],
  'Hull':          [53.7457, -0.3367],

  // ÍRSKO
  'Dublin':        [53.3498, -6.2603],

  // USA
  'New York':      [40.7128, -74.0060],
  'Monroeville':   [31.5188, -87.3247],
  'Denver':        [39.7392,-104.9903],
  'Nantucket':     [41.2835, -70.0995],
  'Estes Park':    [40.3772,-105.5217],
  'Los Angeles':   [34.0522,-118.2437],
  'Chicago':       [41.8781, -87.6298],

  // RUSKO
  'Petrohrad':        [59.9343,  30.3351],
  'Sankt Peterburg':  [59.9343,  30.3351],
  'Moskva':           [55.7558,  37.6173],
  'Magadan':          [59.5683, 150.7924],
  'Omsk':             [54.9885,  73.3242],

  // TALIANSKO
  'Rím':       [41.9028, 12.4964],
  'Neapol':    [40.8518, 14.2681],
  'Palermo':   [38.1157, 13.3615],
  'Florencia': [43.7696, 11.2558],
  'Benátky':   [45.4408, 12.3155],
  'Turín':     [45.0703,  7.6869],

  // NEMECKO
  'Lübeck':    [53.8655, 10.6866],
  'Berlín':    [52.5200, 13.4050],
  'Mníchov':   [48.1351, 11.5820],
  'Osnabrück': [52.2799,  8.0472],
  'Weimar':    [50.9795, 11.3235],

  // JAPONSKO
  'Tokio':     [35.6762, 139.6503],
  'Kjóto':     [35.0116, 135.7681],
  'Matsuyama': [33.8395, 132.7657],

  // INDIA
  'Kalkata':   [22.5726,  88.3639],
  'Bombaj':    [19.0760,  72.8777],

  // POĽSKO
  'Krakov':    [50.0647, 19.9450],
  'Varšava':   [52.2297, 21.0122],

  // MAĎARSKO
  'Eger':      [47.9025, 20.3772],
  'Budapešť':  [47.4979, 19.0402],

  // RAKÚSKO
  'Viedeň':    [48.2082, 16.3738],

  // HOLANDSKO
  'Amsterdam': [52.3676,  4.9041],

  // DÁNSKO
  'Kodaň':     [55.6761, 12.5683],

  // ŠPANIELSKO
  'Barcelona': [41.3851,  2.1734],
  'La Mancha': [39.3780, -2.8832],

  // EGYPT
  'Luxor':     [25.6872, 32.6396],

  // AFGANISTAN
  'Kábul':     [34.5553, 69.2075],

  // MAROKO
  'Tangier':   [35.7595, -5.8340],

  // ŠVÉDSKO
  'Štokholm':  [59.3293, 18.0686],

  // ŠVAJČIARSKO
  'Zürich':    [47.3769,  8.5417],

  // KOLUMBIA
  'Aracataca': [10.5919, -74.1961],

  // TURECKO
  'Kars':      [40.6078, 43.0958],
  'Istanbul':  [41.0082, 28.9784],

  // BRAZÍLIA
  'Petrópolis': [-22.5049, -43.1785],

  // PORTUGALSKO
  'Lisabon':   [38.7223, -9.1393],

  // NIGÉRIA
  'Lagos':     [6.5244, 3.3792],

  // HONDURAS
  'La Ceiba':  [15.7526, -86.7998],

  // GRÉCKO
  'Atény':     [37.9838, 23.7275],

  // USA - ďalšie mestá
  'Atlanta':   [33.7490, -84.3880],
  'Oakland':   [37.8044, -122.2712],
  'San Francisco': [37.7749, -122.4194],
  'Palo Alto': [37.4419, -122.1430],
  'Tallahassee': [30.4383, -84.2807],
  'Philadelphia': [39.9526, -75.1652],
  'Seattle':   [47.6062, -122.3321],
  'Boston':    [42.3601, -71.0589],
  'New Orleans': [29.9511, -90.2623],
  'Washington': [38.9072, -77.0369],
  'Houston':   [29.7604, -95.3698],
  'Salem':     [44.7646, -123.2695],
  'Columbus':  [39.9612, -82.9988],
  'Topeka':    [39.0473, -95.6752],
  'Hilo':      [19.7297, -155.0900],
  'Stanford':  [37.4275, -122.1697],
  'Sault Ste. Marie': [46.4917, -84.3497],

  // KANADA
  'Montreal':  [45.5017, -73.5673],
  'Vancouver': [49.2827, -123.1207],
  'Churchill': [58.7691, -94.1787],
  'Toronto':   [43.6532, -79.3832],
  'Fort McMurray': [56.7265, -111.3860],
  'Shelburne': [43.7654, -65.3194],
  'Edmonton':  [53.5461, -113.4938],
  'Vancouver Island': [49.2827, -123.1207],

  // KOLUMBIA
  'Bogota':    [4.7110, -74.0721],

  // PERU
  'Lima':      [-12.0464, -77.0428],

  // EKVÁDOR
  'Guayaquil': [-2.1894, -79.8627],
  'Zacatecas': [22.7709, -102.5898],

  // GHANA
  'Akkra':     [5.5600, -0.2081],
  'Kumasi':    [6.6753, -1.6236],
  'Cape Coast': [5.1136, -1.2470],

  // NIGÉRIA
  'Abeokuta':  [6.7849, 3.3436],

  // JUŽNÁ AFRIKA
  'Pretoria':  [-25.7482, 28.2293],

  // SRÍ LANKA
  'Kolombo':   [6.9271, 80.7580],

  // INDIA
  'Naí Dillí': [28.6139, 77.2090],
  'Bangalúr':  [12.9716, 77.5946],
  'Jaipur':    [26.9124, 75.7873],

  // NÓRSKO
  'Bergen':    [60.3895, 5.3221],
  'Oslo':      [59.9139, 10.7522],

  // ŠVÉDSKO
  'Fjallbacka': [58.4544, 5.3500],
  'Kiruna':    [67.8557, 20.2426],
  'Gavle':     [60.6747, 17.1453],
  'Are':       [63.4000, 13.0833],
  'Gallivare': [67.1361, 20.5556],

  // ISLAND
  'Siglufjordur': [66.2333, -18.9167],
  'Reykjavik': [64.1466, -21.9426],

  // MEXIKO
  'Mexiko':    [19.4326, -99.1332],
  'Monterrey': [25.6866, -100.3161],
  'Matamoros': [25.8375, -97.5003],

  // SALVÁDOR
  'San Salvador': [13.6929, -89.2182],

  // BRAZÍLIA
  'Rio de Janeiro': [-22.9068, -43.1729],

  // AUSTRÁLIA
  'Broome':    [-17.9553, 122.2305],

  // ŠPANIELSKO
  'Granada':   [36.7538, -3.5985],

  // ČESKO
  'Plzen':     [49.7384, 13.3736],

  // SLOVENSKO - ďalšie mestá
  'Sitno':     [48.8167, 18.9667],
  'Kremnica':  [48.7167, 18.9333],
  'Roznava':   [48.6667, 20.5167],

  // MAĎARSKO
  'Miskolc':   [48.0976, 20.7757],
  'Gyöngyös':  [47.7782, 19.9142],
  'Esztergom': [47.7833, 18.7500],

  // CHORVÁTSKO
  'Zagreb':    [45.8150, 15.9819],

  // HOLANDSKO
  'Haag':      [52.0705, 4.3007],

  // ÍRSKO
  'Bandon':    [51.7455, -8.7515],
  'Cobh':      [51.8014, -8.2958],

  // VEĽKÁ BRITÁNIA - ďalšie mestá
  'Belfast':   [54.5973, -5.9301],
  'Glasgow':   [55.8642, -4.2518],
  'Oxford':    [51.7520, -1.2577],
  'Norfolk':   [52.6309, 1.2974],

  // RUSKO
  'Petropavlovsk': [53.0216, 158.6484],
  'Chita':     [52.0300, 113.5005],

  // ŠVAJČIARSKO
  'Geneva':    [46.2044, 6.1432],

  // FÍNSKO
  'Helsinki':  [60.1695, 24.9354],

  // Vietnam
  'Hanoi':     [21.0285, 105.8542],

  // THAJSKO
  'Bangkok':   [13.7563, 100.5018],

  // MALAJZIA
  'Kuala Lumpur': [3.1390, 101.6869],

  // MJANMARSKO
  'Yangon':    [16.8661, 96.1951],

  // LAO
  'Vientiane': [17.9757, 102.6331],

  // KAMBODŽA
  'Phnom Penh': [11.5564, 104.9282],

  // LITVA
  'Vilna':     [54.6872, 25.2797],

  // LOTYŠSKO
  'Riga':      [56.9496, 24.1052],

  // ESTÓNSKO
  'Tallinn':   [59.4370, 24.7536],

  // UKRAJINA
  'Kyjev':     [50.4501, 30.5234],

  // RUMUNSKO
  'Bukurešť':  [44.4268, 26.1025],

  // SRBSKO
  'Belehrad':  [44.8176, 20.4762],

  // BOSNA
  'Sarajevo':  [43.8564, 18.4131],

  // GRUZÍNSKO
  'Tbilisi':   [41.7151, 44.8271],

  // ARMÉNSKO
  'Yerevan':   [40.1792, 44.5086],

  // AZERBAIJAN
  'Baku':      [40.3856, 49.8671],

  // KAZACHSTAN
  'Almaty':    [43.2380, 76.9502],

  // USA - Havaj
  'Honolulu':  [21.3099, -157.8581],

  // USA - ďalšie mestá (dopĺňanie)
  'Richmond':  [37.5407, -77.4360],

  // INDIE - dopĺňanie
  'Puné':      [18.5204, 73.8567],
  'Džajpur':   [26.9124, 75.7873],

  // JUŽNÁ KÓREA
  'Soul':      [37.5665, 126.9780],

  // ARGENTÍNA
  'Buenos Aires': [-34.6037, -58.3816],

  // VENEZUELA
  'Caracas':   [10.4806, -66.9036],

  // ÍRSKO - dopĺňanie
  'Cork':      [51.8969, -8.4863],

  // ÍRSKO - dopĺňanie (mestečko)
  'New Ross':  [52.4081, -6.9436],

  // ETIÓPIA
  'Addis Abeba': [9.0320, 38.7469],

  // PAKISTAN
  'Rávalpindí': [33.5731, 73.1898],

  // TIBET/ČÍNA
  'Lhasa':     [29.6470, 91.1132],
  'Chej-lung-ťiang': [47.8050, 127.5349],

  // JUŽNÁ KÓREA - dopĺňanie (iný zápis)
  'Hanguk':    [37.5665, 126.9780],

  // AUSTRÁLIA - dopĺňanie
  'Sydney':    [-33.8688, 151.2093],

  // FÍNSKO
  'Turku':     [60.4518, 22.2666],

  // ČESKÖ - dopĺňanie
  'Brno':      [49.1950, 16.6068],
};

const SEED_BOOKS = [
  { title: "Námestie svätej Alžbety", author: "Rudolf Jašík", country: "Slovensko", city: "Nitra", genre: "Vojnový román", year: 1958, description: "Tragický príbeh lásky počas vojny v Nitre." },
  { title: "Rivers of Babylon", author: "Peter Pišťanek", country: "Slovensko", city: "Bratislava", genre: "Satira", year: 1991, description: "Krutý príbeh z prostredia bratislavského hotela." },
  { title: "Červený kapitán", author: "Dominik Dán", country: "Slovensko", city: "Bratislava", genre: "Detektívka", year: 2007, description: "Napínavý kriminálny príbeh z hlavného mesta." },
  { title: "Sklený zámok", author: "Dušan Dušek", country: "Slovensko", city: "Piešťany", genre: "Beletria", year: 2013, description: "Atmosféra kúpeľného mesta Piešťany." },
  { title: "Mäso", author: "Arpád Soltész", country: "Slovensko", city: "Košice", genre: "Thriller", year: 2017, description: "Drsné 90. roky na východnom Slovensku." },
  { title: "Prachy", author: "Michal Hvorecký", country: "Slovensko", city: "Bratislava", genre: "Beletria", year: 2001, description: "Moderná bratislavská próza." },
  { title: "Kruté radosti", author: "Janko Jesenský", country: "Slovensko", city: "Bratislava", genre: "Satira", year: 1920, description: "Satira na malomestský život v Bratislave." },
  { title: "Dobrý voják Švejk", author: "Jaroslav Hašek", country: "Česko", city: "Praha", genre: "Satira", year: 1921, description: "Osudy vojaka v Prahe počas 1. sv. vojny." },
  { title: "Obsluhoval jsem anglického krále", author: "Bohumil Hrabal", country: "Česko", city: "Praha", genre: "Beletria", year: 1971, description: "Vzostup a pád čašníka v Prahe." },
  { title: "Nesnesitelná lehkost bytí", author: "Milan Kundera", country: "Česko", city: "Praha", genre: "Filozofický román", year: 1984, description: "Život v okupovanej Prahe." },
  { title: "Spalovač mrtvol", author: "Ladislav Fuks", country: "Česko", city: "Praha", genre: "Psychologický horor", year: 1967, description: "Mrazivý príbeh z pražského krematória." },
  { title: "Krakatit", author: "Karel Čapek", country: "Česko", city: "Praha", genre: "Sci-Fi", year: 1922, description: "Vynález strašnej výbušniny v srdci Prahy." },
  { title: "Román pro ženy", author: "Michal Viewegh", country: "Česko", city: "Praha", genre: "Romantika", year: 2001, description: "Populárny súčasný český príbeh z Prahy." },
  { title: "Notre-Dame de Paris", author: "Victor Hugo", country: "Francúzsko", city: "Paríž", genre: "Historický", year: 1831, description: "Príbeh katedrály a Quasimoda." },
  { title: "Biedni", author: "Victor Hugo", country: "Francúzsko", city: "Paríž", genre: "Klasika", year: 1862, description: "Jean Valjean a parížske barikády." },
  { title: "Otec Goriot", author: "Honoré de Balzac", country: "Francúzsko", city: "Paríž", genre: "Realizmus", year: 1835, description: "Život v parížskom penzióne." },
  { title: "Madame Bovary", author: "Gustave Flaubert", country: "Francúzsko", city: "Rouen", genre: "Realizmus", year: 1856, description: "Tragédia v normandskom meste Rouen." },
  { title: "Parfum", author: "Patrick Süskind", country: "Francúzsko", city: "Grasse", genre: "Thriller", year: 1985, description: "Vražedný talent v meste parfumov." },
  { title: "Bel-Ami", author: "Guy de Maupassant", country: "Francúzsko", city: "Paríž", genre: "Beletria", year: 1885, description: "Cesta za mocou v parížskych salónoch." },
  { title: "Pohyblivý sviatok", author: "Ernest Hemingway", country: "Francúzsko", city: "Paríž", genre: "Memoáre", year: 1964, description: "Hemingwayove spomienky na Paríž." },
  { title: "Germinal", author: "Émile Zola", country: "Francúzsko", city: "Lille", genre: "Naturalizmus", year: 1885, description: "Štrajk baníkov pri meste Lille." },
  { title: "Sherlock Holmes: Štúdia v krvavočervenej", author: "A. C. Doyle", country: "Veľká Británia", city: "Londýn", genre: "Detektívka", year: 1887, description: "Začiatok legendy na Baker Street." },
  { title: "Oliver Twist", author: "Charles Dickens", country: "Veľká Británia", city: "Londýn", genre: "Klasika", year: 1837, description: "Sirota v podsvetí viktoriánskeho Londýna." },
  { title: "Dracula", author: "Bram Stoker", country: "Veľká Británia", city: "Whitby", genre: "Horor", year: 1897, description: "Príchod upíra do prístavného mesta Whitby." },
  { title: "Pani Dallowayová", author: "Virginia Woolf", country: "Veľká Británia", city: "Londýn", genre: "Modernizmus", year: 1925, description: "Jeden deň v Londýne po vojne." },
  { title: "Harry Potter a Kameň mudrcov", author: "J.K. Rowling", country: "Veľká Británia", city: "Londýn", genre: "Fantasy", year: 1997, description: "Nástupište 9 a 3/4 na stanici King's Cross." },
  { title: "The North Water", author: "Ian McGuire", country: "Veľká Británia", city: "Hull", genre: "Historický", year: 2016, description: "Veľrybárska výprava vyrážajúca z Hullu." },
  { title: "Trainspotting", author: "Irvine Welsh", country: "Veľká Británia", city: "Edinburgh", genre: "Beletria", year: 1993, description: "Drsný život v Edinburghu." },
  { title: "Ulysses", author: "James Joyce", country: "Írsko", city: "Dublin", genre: "Modernizmus", year: 1922, description: "Jeden deň Leopolda Blooma v Dubline." },
  { title: "Normal People", author: "Sally Rooney", country: "Írsko", city: "Dublin", genre: "Romantika", year: 2018, description: "Intímny príbeh vzťahu dvoch mladých ľudí v Dubline." },
  { title: "Veľký Gatsby", author: "F. Scott Fitzgerald", country: "USA", city: "New York", genre: "Klasika", year: 1925, description: "Jazzový vek v New Yorku." },
  { title: "Raňajky u Tiffanyho", author: "Truman Capote", country: "USA", city: "New York", genre: "Novela", year: 1958, description: "Holly Golightly na Manhattane." },
  { title: "Na ceste", author: "Jack Kerouac", country: "USA", city: "Denver", genre: "Beletria", year: 1957, description: "Putovanie naprieč Amerikou cez Denver." },
  { title: "Kto chytá v žite", author: "J. D. Salinger", country: "USA", city: "New York", genre: "Beletria", year: 1951, description: "Holden Caulfield blúdi New Yorkom." },
  { title: "L.A. Confidential", author: "James Ellroy", country: "USA", city: "Los Angeles", genre: "Krimi", year: 1990, description: "Korupcia v zlatom veku Hollywoodu." },
  { title: "The Devil in the White City", author: "Erik Larson", country: "USA", city: "Chicago", genre: "Historický", year: 2003, description: "Vrah na svetovej výstave v Chicagu." },
  { title: "Zločin a trest", author: "Fjodor Dostojevskij", country: "Rusko", city: "Petrohrad", genre: "Klasika", year: 1866, description: "Raskoľnikov a jeho svedomie v Petrohrade." },
  { title: "Majster a Margaréta", author: "Michail Bulgakov", country: "Rusko", city: "Moskva", genre: "Magický realizmus", year: 1967, description: "Diabol navštívi stalinskú Moskvu." },
  { title: "Vojna a mier", author: "Lev Tolstoj", country: "Rusko", city: "Moskva", genre: "Historický", year: 1869, description: "Napoleonovo ťaženie na Moskvu." },
  { title: "Doktor Živago", author: "Boris Pasternak", country: "Rusko", city: "Moskva", genre: "Klasika", year: 1957, description: "Osudy lekára v Moskve počas revolúcie." },
  { title: "Jevgenij Onegin", author: "A. S. Puškin", country: "Rusko", city: "Petrohrad", genre: "Poézia", year: 1833, description: "Veršovaný román z prostredia Petrohradu." },
  { title: "Anna Karenina", author: "Lev Tolstoj", country: "Rusko", city: "Petrohrad", genre: "Klasika", year: 1877, description: "Tragická láska v petrohradskej smotánke." },
  { title: "Zápisky z mŕtveho domu", author: "F. M. Dostojevskij", country: "Rusko", city: "Omsk", genre: "Klasika", year: 1862, description: "Spomienky na trestaneckú kolóniu v Omsku." },
  { title: "Gomora", author: "Roberto Saviano", country: "Taliansko", city: "Neapol", genre: "Reportáž", year: 2006, description: "Mrazivý pohľad na neapolskú mafiu." },
  { title: "Gepard", author: "Giuseppe Tomasi di Lampedusa", country: "Taliansko", city: "Palermo", genre: "Historický", year: 1958, description: "Zánik aristokracie v Palerme." },
  { title: "Dekameron", author: "Giovanni Boccaccio", country: "Taliansko", city: "Florencia", genre: "Klasika", year: 1353, description: "Príbehy rozprávané počas moru vo Florencii." },
  { title: "Moja geniálna priateľka", author: "Elena Ferrante", country: "Taliansko", city: "Neapol", genre: "Beletria", year: 2011, description: "Dospievanie v chudobnej štvrti Neapola." },
  { title: "Smrť v Benátkach", author: "Thomas Mann", country: "Taliansko", city: "Benátky", genre: "Novela", year: 1912, description: "Posledné dni spisovateľa v Benátkach." },
  { title: "Quo Vadis", author: "Henryk Sienkiewicz", country: "Taliansko", city: "Rím", genre: "Historický", year: 1896, description: "Kresťania v antickom Ríme." },
  { title: "Inferno", author: "Dan Brown", country: "Taliansko", city: "Florencia", genre: "Thriller", year: 2013, description: "Hádanky ukryté v pamiatkach Florencie." },
  { title: "Buddenbrookovci", author: "Thomas Mann", country: "Nemecko", city: "Lübeck", genre: "Sága", year: 1901, description: "Úpadok kupeckej rodiny v Lübecku." },
  { title: "Berlín, Alexanderplatz", author: "Alfred Döblin", country: "Nemecko", city: "Berlín", genre: "Modernizmus", year: 1929, description: "Príbeh trestanca v búrlivom Berlíne." },
  { title: "Zlodejka kníh", author: "Markus Zusak", country: "Nemecko", city: "Mníchov", genre: "Historický", year: 2005, description: "Dievča v nacistickom Mníchove." },
  { title: "Nórsky les", author: "Haruki Murakami", country: "Japonsko", city: "Tokio", genre: "Beletria", year: 1987, description: "Melancholický príbeh lásky v Tokiu." },
  { title: "Pamiatky gejše", author: "Arthur Golden", country: "Japonsko", city: "Kjóto", genre: "Historický", year: 1997, description: "Život v kjótskej štvrti Gion." },
  { title: "Kitchen", author: "Banana Yoshimoto", country: "Japonsko", city: "Tokio", genre: "Beletria", year: 1988, description: "Moderný japonský život v Tokiu." },
  { title: "Šantaram", author: "Gregory David Roberts", country: "India", city: "Bombaj", genre: "Dobrodružné", year: 2003, description: "Útek z väzenia do bombajského podsvetia." },
  { title: "Kalkata", author: "Amitav Ghosh", country: "India", city: "Kalkata", genre: "Mysteriózne", year: 1995, description: "Príbeh z horúcej Kalkaty." },
  { title: "Bábika", author: "Bolesław Prus", country: "Poľsko", city: "Varšava", genre: "Realizmus", year: 1890, description: "Panoráma Varšavy 19. storočia." },
  { title: "Egri hviezdy", author: "Géza Gárdonyi", country: "Maďarsko", city: "Eger", genre: "Historický", year: 1899, description: "Obrana hradu Eger proti Turkom." },
  { title: "Chlapci z Pavlovskej ulice", author: "Ferenc Molnár", country: "Maďarsko", city: "Budapešť", genre: "Pre deti", year: 1906, description: "Vojna detských partií v Budapešti." },
  { title: "Klavíristka", author: "Elfriede Jelinek", country: "Rakúsko", city: "Viedeň", genre: "Psychologický", year: 1983, description: "Temná strana Viedne." },
  { title: "Denník Anny Frankovej", author: "Anne Frank", country: "Holandsko", city: "Amsterdam", genre: "Denník", year: 1947, description: "Ukryté dievča v Amsterdame." },
  { title: "Tieň vetra", author: "Carlos Ruiz Zafón", country: "Španielsko", city: "Barcelona", genre: "Mysteriózne", year: 2001, description: "Cintorín zabudnutých kníh v Barcelone." },
  { title: "Smrť na Níle", author: "Agatha Christie", country: "Egypt", city: "Luxor", genre: "Detektívka", year: 1937, description: "Vražda na Níle pri Luxore." },
  { title: "Lovec drakov", author: "Khaled Hosseini", country: "Afganistan", city: "Kábul", genre: "Beletria", year: 2003, description: "Príbeh priateľstva v Kábule." },
  { title: "Alchymista", author: "Paulo Coelho", country: "Maroko", city: "Tangier", genre: "Alegória", year: 1988, description: "Santiago v uličkách mesta Tangier." },
  { title: "Muži, ktorí nenávidia ženy", author: "Stieg Larsson", country: "Švédsko", city: "Štokholm", genre: "Thriller", year: 2005, description: "Kriminálne vyšetrovanie v Štokholme." },
  { title: "Slepota", author: "José Saramago", country: "Portugalsko", city: "Lisabon", genre: "Dystopia", year: 1995, description: "Epidémia slepoty v Lisabone." },
  { title: "Nočný vlak do Lisabonu", author: "Pascal Mercier", country: "Portugalsko", city: "Lisabon", genre: "Filozofický", year: 2004, description: "Hľadanie autora v Lisabone." },
  { title: "Na dvore u mamičky", author: "C. N. Adichie", country: "Nigéria", city: "Lagos", genre: "Beletria", year: 2013, description: "Život v modernom Lagose." },
  { title: "Pobrežie moskytov", author: "Paul Theroux", country: "Honduras", city: "La Ceiba", genre: "Dobrodružné", year: 1981, description: "Pokus o vybudovanie utópie pri meste La Ceiba." },
  { title: "Prophet Song", author: "Paul Lynch", country: "Írsko", city: "Dublin", genre: "Dystopia", year: 2023, description: "Mrazivá vízia autoritárskej budúcnosti v Írsku." },
  { title: "Wellness", author: "Nathan Hill", country: "USA", city: "Chicago", genre: "Beletria", year: 2023, description: "Vzťahová kronika digitálnej éry a stredného veku." },
  { title: "Pineapple Street", author: "Jenny Jackson", country: "USA", city: "New York", genre: "Beletria", year: 2023, description: "Rodinná satira o bohatej newyorskej vrstve." },
  { title: "The Paris Apartment", author: "Lucy Foley", country: "Francúzsko", city: "Paríž", genre: "Thriller", year: 2022, description: "Mysteriózne zmiznutie v luxusnom parížskom dome." },
  { title: "The Women", author: "Kristin Hannah", country: "USA", city: "Los Angeles", genre: "Historický", year: 2024, description: "Príbeh žien, ktoré slúžili počas vojny vo Vietname." },
  { title: "Intermezzo", author: "Sally Rooney", country: "Írsko", city: "Dublin", genre: "Beletria", year: 2024, description: "Dvaja bratia a ich zložité vzťahy po rodinnej strate." },
  { title: "The Ministry of Time", author: "Kaliane Bradley", country: "Veľká Británia", city: "Londýn", genre: "Sci-Fi", year: 2024, description: "Cestovanie časom, štátna služba a nečakaná romanca." },
  { title: "Martyr!", author: "Kaveh Akbar", country: "USA", city: "New York", genre: "Beletria", year: 2024, description: "Intenzívny román o viere, smútku a identite." },
  { title: "Funny Story", author: "Emily Henry", country: "USA", city: "Chicago", genre: "Romantika", year: 2024, description: "Romantická komédia o nečakanom začiatku odznova." },
  { title: "The Fury", author: "Alex Michaelides", country: "Grécko", city: "Atény", genre: "Thriller", year: 2024, description: "Vražda na súkromnom gréckom ostrove neďaleko Atén." },
  { title: "An American Marriage", author: "Tayari Jones", country: "USA", city: "Atlanta", genre: "Dráma", year: 2018, description: "Silný román o láske a nespravodlivosti v Atlante." },
  { title: "There There", author: "Tommy Orange", country: "USA", city: "Oakland", genre: "Beletria", year: 2018, description: "Mnohovrstevný príbeh domorodej identity v Oaklande." },
  { title: "My Year of Rest and Relaxation", author: "Ottessa Moshfegh", country: "USA", city: "New York", genre: "Psychologický", year: 2018, description: "Temne ironický portrét izolácie a úniku od reality." },
  { title: "The Overstory", author: "Richard Powers", country: "USA", city: "San Francisco", genre: "Environmentálny", year: 2018, description: "Epický román o stromoch, prírode a ľuďoch." },
  { title: "Milkman", author: "Anna Burns", country: "Veľká Británia", city: "Belfast", genre: "Beletria", year: 2018, description: "Napätý príbeh dospievania počas nepokojov v Belfaste." },
  { title: "The Great Believers", author: "Rebecca Makkai", country: "USA", city: "Chicago", genre: "Historický", year: 2018, description: "Priateľstvo, strata a epidémia AIDS naprieč desaťročiami." },
  { title: "The Witch Elm", author: "Tana French", country: "Írsko", city: "Dublin", genre: "Mysteriózne", year: 2018, description: "Psychologická detektívka o pamäti a vine." },
  { title: "Transcription", author: "Kate Atkinson", country: "Veľká Británia", city: "Londýn", genre: "Historický", year: 2018, description: "Špionážny román zasadený do obdobia druhej svetovej vojny." },
  { title: "Sabrina", author: "Nick Drnaso", country: "USA", city: "Chicago", genre: "Grafický román", year: 2018, description: "Mrazivý príbeh o strate, médiách a konšpiráciách." },
  { title: "Bad Blood", author: "John Carreyrou", country: "USA", city: "Palo Alto", genre: "Reportáž", year: 2018, description: "Skutočný príbeh škandálu firmy Theranos v Silicon Valley." },
  { title: "The Mars Room", author: "Rachel Kushner", country: "USA", city: "San Francisco", genre: "Beletria", year: 2018, description: "Surový román o väzení, triede a prežití." },
  { title: "The Nickel Boys", author: "Colson Whitehead", country: "USA", city: "Tallahassee", genre: "Historický", year: 2019, description: "Tvrdý román o rasizme v nápravnom zariadení na Floride." },
  { title: "Fleishman Is in Trouble", author: "Taffy Brodesser-Akner", country: "USA", city: "New York", genre: "Beletria", year: 2019, description: "Súčasný príbeh manželstva, rozvodu a identity." },
  { title: "Ask Again, Yes", author: "Mary Beth Keane", country: "USA", city: "New York", genre: "Rodinná dráma", year: 2019, description: "Dve rodiny, jedno trauma a dlhá cesta k zmiereniu." },
  { title: "Red at the Bone", author: "Jacqueline Woodson", country: "USA", city: "New York", genre: "Beletria", year: 2019, description: "Generačný román o pamäti a dedičstve v Brooklyne." },
  { title: "Lost Children Archive", author: "Valeria Luiselli", country: "USA", city: "New York", genre: "Beletria", year: 2019, description: "Cesta autom a príbeh o migrácii a rodine." },
  { title: "Ducks, Newburyport", author: "Lucy Ellmann", country: "USA", city: "Columbus", genre: "Experimentálny román", year: 2019, description: "Odvážny prúd vedomia americkej matky v Ohiu." },
  { title: "Disappearing Earth", author: "Julia Phillips", country: "Rusko", city: "Petropavlovsk", genre: "Mysteriózne", year: 2019, description: "Zmiznutie dievčat na polostrove Kamčatka." },
  { title: "The Water Dancer", author: "Ta-Nehisi Coates", country: "USA", city: "Richmond", genre: "Historický", year: 2019, description: "Magický realizmus zasadený do éry otroctva." },
  { title: "The Topeka School", author: "Ben Lerner", country: "USA", city: "Topeka", genre: "Beletria", year: 2019, description: "Román o maskulinite, politike a jazyku v Kansase." },
  { title: "Exhalation", author: "Ted Chiang", country: "USA", city: "New York", genre: "Sci-Fi", year: 2019, description: "Premyslené poviedky o čase, vedomí a technológiách." },
  { title: "A Burning", author: "Megha Majumdar", country: "India", city: "Kalkata", genre: "Dráma", year: 2020, description: "Spoločenský román o nespravodlivosti a moci." },
  { title: "Real Life", author: "Brandon Taylor", country: "USA", city: "Chicago", genre: "Beletria", year: 2020, description: "Intímny campus román o identite a osamelosti." },
  { title: "Such a Fun Age", author: "Kiley Reid", country: "USA", city: "Philadelphia", genre: "Satira", year: 2020, description: "Ostrý pohľad na rasu, privilégium a sociálne siete." },
  { title: "Deacon King Kong", author: "James McBride", country: "USA", city: "New York", genre: "Beletria", year: 2020, description: "Živý komunitný román z Brooklynu 60. rokov." },
  { title: "Leave the World Behind", author: "Rumaan Alam", country: "USA", city: "New York", genre: "Thriller", year: 2020, description: "Nepokojný príbeh o neistote počas globálnej krízy." },
  { title: "Luster", author: "Raven Leilani", country: "USA", city: "New York", genre: "Beletria", year: 2020, description: "Provokatívny debut o túžbe, práci a sebahodnote." },
  { title: "Memorial", author: "Bryan Washington", country: "USA", city: "Houston", genre: "Beletria", year: 2020, description: "Vzťahový román o rodine, odchode a návrate." },
  { title: "Burnt Sugar", author: "Avni Doshi", country: "India", city: "Puné", genre: "Psychologický", year: 2020, description: "Napätý príbeh matky, dcéry a pamäti v Indii." },
  { title: "The City We Became", author: "N. K. Jemisin", country: "USA", city: "New York", genre: "Fantasy", year: 2020, description: "Mestská fantasy oslavujúca chaos New Yorku." },
  { title: "Piranesi", author: "Susanna Clarke", country: "Veľká Británia", city: "Londýn", genre: "Fantasy", year: 2020, description: "Atmosférický labyrintový príbeh o pamäti a realite." },
  { title: "The Invisible Life of Addie LaRue", author: "V. E. Schwab", country: "Francúzsko", city: "Paríž", genre: "Fantasy", year: 2020, description: "Príbeh ženy, na ktorú si nikto nepamätá." },
  { title: "Mexican Gothic", author: "Silvia Moreno-Garcia", country: "Mexiko", city: "Mexiko", genre: "Horor", year: 2020, description: "Gotický horor v odľahlom mexickom sídle." },
  { title: "Harlem Shuffle", author: "Colson Whitehead", country: "USA", city: "New York", genre: "Krimi", year: 2021, description: "Krimi román z pulzujúceho Harlemu 60. rokov." },
  { title: "Intimacies", author: "Katie Kitamura", country: "Holandsko", city: "Haag", genre: "Psychologický", year: 2021, description: "Napätý príbeh tlmočníčky na Medzinárodnom trestnom súde." },
  { title: "Small Things Like These", author: "Claire Keegan", country: "Írsko", city: "New Ross", genre: "Novela", year: 2021, description: "Krátky, silný príbeh o odvahe v írskom mestečku." },
  { title: "Young Mungo", author: "Douglas Stuart", country: "Veľká Británia", city: "Glasgow", genre: "Dráma", year: 2022, description: "Silný román o láske a násilí v Glasgowe." },
  { title: "The Little Paris Patisserie", author: "Julie Caplin", country: "Francúzsko", city: "Paríž", genre: "Romantika", year: 2018, description: "Oddychová romantika v parížskom prostredí." },
  { title: "The Little Café in Copenhagen", author: "Julie Caplin", country: "Dánsko", city: "Kodaň", genre: "Romantika", year: 2018, description: "Cestovateľská romantika v Kodani." },
  { title: "Binding 13", author: "Chloe Walsh", country: "Írsko", city: "Cork", genre: "Romantika", year: 2018, description: "Emotívny YA príbeh z írskeho mesta Cork." },
  { title: "Mŕtvy na Pekelnom vrchu", author: "Juraj Červenák", country: "Slovensko", city: "Banská Štiavnica", genre: "Historická detektívka", year: 2012, description: "Prvý prípad Steina a Barbariča v Banskej Štiavnici." },
  { title: "The Love Hypothesis", author: "Ali Hazelwood", country: "USA", city: "Stanford", genre: "Romantika", year: 2021, description: "Vedecká romanca zo Stanfordovej univerzity." },
  { title: "The Seven Sisters", author: "Lucinda Riley", country: "Brazília", city: "Rio de Janeiro", genre: "Historická sága", year: 2014, description: "Hľadanie pôvodu v tieni sochy Krista Spasiteľa." },
  { title: "The Storm Sister", author: "Lucinda Riley", country: "Nórsko", city: "Oslo", genre: "Historická sága", year: 2015, description: "Hudobné dedičstvo a cesta do nórskeho Osla." },
  { title: "The Shadow Sister", author: "Lucinda Riley", country: "Veľká Británia", city: "Londýn", genre: "Historická sága", year: 2016, description: "Príbeh tretej sestry v prostredí londýnskych antikvariátov." },
  { title: "The Pearl Sister", author: "Lucinda Riley", country: "Austrália", city: "Broome", genre: "Historická sága", year: 2017, description: "Cesta za perlami do austrálskeho mesta Broome." },
  { title: "The Moon Sister", author: "Lucinda Riley", country: "Španielsko", city: "Granada", genre: "Historická sága", year: 2018, description: "Príbeh z rímskych jaskýň nad španielskou Granadou." },
  { title: "The Love Letter", author: "Lucinda Riley", country: "Veľká Británia", city: "Londýn", genre: "Thriller", year: 2018, description: "Nebezpečné tajomstvo ukryté v srdci Londýna." },
  { title: "Twisted Games", author: "Ana Huang", country: "USA", city: "Washington", genre: "Romantika", year: 2021, description: "Zakázaná láska medzi princeznou a jej bodyguardom." },
  { title: "Twisted Hate", author: "Ana Huang", country: "USA", city: "Washington", genre: "Romantika", year: 2022, description: "Príbeh od nenávisti k láske v prostredí nemocnice." },
  { title: "Twisted Lies", author: "Ana Huang", country: "USA", city: "Washington", genre: "Romantika", year: 2022, description: "Falošný vzťah a temná minulosť vo Washingtone." },
  { title: "King of Pride", author: "Ana Huang", country: "USA", city: "New York", genre: "Romantika", year: 2023, description: "Príbeh o protikladoch v exkluzívnom prostredí New Yorku." },
  { title: "King of Greed", author: "Ana Huang", country: "USA", city: "New York", genre: "Romantika", year: 2023, description: "Manželská kríza miliardára v New Yorku." },
  { title: "King of Sloth", author: "Ana Huang", country: "USA", city: "New York", genre: "Romantika", year: 2024, description: "Štvrtý diel série Kings of Sin." },
  { title: "Krv prvorodených", author: "Juraj Červenák", country: "Česko", city: "Praha", genre: "Historická detektívka", year: 2014, description: "Vyšetrovanie rituálnych vrážd v renesančnej Prahe." },
  { title: "Ohnivé znamenie", author: "Juraj Červenák", country: "Slovensko", city: "Bratislava", genre: "Historická detektívka", year: 2015, description: "Zločin v Prešporku počas korunovačných slávností." },
  { title: "Diabol v zrkadle", author: "Juraj Červenák", country: "Rakúsko", city: "Viedeň", genre: "Historická detektívka", year: 2016, description: "Stein a Barbarič pátrajú po sprisahaní vo Viedni." },
  { title: "Vlk a dýka", author: "Juraj Červenák", country: "Slovensko", city: "Sitno", genre: "Historická detektívka", year: 2017, description: "Dobrodružstvo na hrade Vyšehrad pri Dunaji." },
  { title: "Pre hrsť dukátov", author: "Juraj Červenák", country: "Slovensko", city: "Kremnica", genre: "Historická detektívka", year: 2019, description: "Záhady mincovne v slobodnom kráľovskom meste Kremnica." },
  { title: "Anjel v podsvetí", author: "Juraj Červenák", country: "Česko", city: "Plzeň", genre: "Historická detektívka", year: 2020, description: "Prípad z mesta Plzeň, vtedajšieho sídla cisára." },
  { title: "The 24-Hour Wine Expert", author: "Jancis Robinson", country: "Veľká Británia", city: "Londýn", genre: "Náučná", year: 2024, description: "Sprievodca svetom vína priamo z londýnskych pivoték." },
  { title: "The Waiting", author: "Michael Connelly", country: "USA", city: "Los Angeles", genre: "Krimi", year: 2024, description: "Renée Ballardová rieši odložený prípad v LA." },
  { title: "Precipice", author: "Robert Harris", country: "Veľká Británia", city: "Londýn", genre: "Historický thriller", year: 2024, description: "Politické intrigy v Londýne na prahu prvej svetovej vojny." },
  { title: "Blue Sisters", author: "Coco Mellors", country: "USA", city: "New York", genre: "Beletria", year: 2024, description: "Tri sestry sa vracajú do New Yorku po rodinnej tragédii." },
  { title: "Long Island", author: "Colm Tóibín", country: "USA", city: "New York", genre: "Beletria", year: 2024, description: "Pokračovanie slávneho Brooklynu zasadené na Long Island." },
  { title: "The City and Its Uncertain Walls", author: "Haruki Murakami", country: "Japonsko", city: "Tokio", genre: "Magický realizmus", year: 2024, description: "Murakamiho návrat k snovému Tokiu." },
  { title: "Eruption", author: "Michael Crichton & James Patterson", country: "USA", city: "Hilo", genre: "Thriller", year: 2024, description: "Katastrofa na Havaji v blízkosti mesta Hilo." },
  { title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", country: "Španielsko", city: "Barcelona", genre: "Mysteriózne", year: 2001, description: "Tajomná knižnica v gotickej štvrti Barcelony." },
  { title: "Inferno", author: "Dan Brown", country: "Taliansko", city: "Florencia", genre: "Thriller", year: 2013, description: "Robert Langdon zachraňuje svet cez symboly Florencie." },
  { title: "Beautiful World, Where Are You", author: "Sally Rooney", country: "Írsko", city: "Dublin", genre: "Beletria", year: 2021, description: "Moderné vzťahy a maily medzi Dublinom a vidiekom." },
  { title: "Shuggie Bain", author: "Douglas Stuart", country: "Veľká Británia", city: "Glasgow", genre: "Dráma", year: 2020, description: "Dojímavý príbeh o chudobe a láske v Glasgowe." },
  { title: "Atlas: The Story of Pa Salt", author: "Lucinda Riley & Harry Whittaker", country: "Francúzsko", city: "Paríž", genre: "Historická sága", year: 2023, description: "Veľkolepé finále série odhaľujúce identitu adoptívneho otca v Paríži." },
  { title: "The Hidden Girl", author: "Lucinda Riley", country: "Poľsko", city: "Varšava", genre: "Historická dráma", year: 2024, description: "Príbeh slávnej modelky prepletený s osudmi detí v okupovanom Poľsku." },
  { title: "The Murders at Fleat House", author: "Lucinda Riley", country: "Veľká Británia", city: "Norfolk", genre: "Krimi", year: 2022, description: "Napínavá detektívka zo súkromnej internátnej školy v anglickom Norfolku." },
  { title: "The Last Love Song", author: "Lucinda Riley", country: "Írsko", city: "Dublin", genre: "Romantická sága", year: 2025, description: "Príbeh o sláve a tajomstvách írskej hudobnej scény 60. rokov." },
  { title: "King of Envy", author: "Ana Huang", country: "USA", city: "New York", genre: "Romantika", year: 2025, description: "Piaty diel série Kings of Sin o majiteľovi exkluzívnych klubov." },
  { title: "King of Gluttony", author: "Ana Huang", country: "USA", city: "New York", genre: "Romantika", year: 2026, description: "Najnovší prírastok do série o hriešnych miliardároch z Manhattanu." },
  { title: "The Defender", author: "Ana Huang", country: "Veľká Británia", city: "Londýn", genre: "Športová romantika", year: 2025, description: "Vášnivý príbeh z prostredia profesionálneho futbalu v Londýne." },
  { title: "The Keeper", author: "Ana Huang", country: "Veľká Británia", city: "Londýn", genre: "Športová romantika", year: 2026, description: "Pokračovanie série Gods of the Game o rivalite a túžbe." },
  { title: "Prekliata kniha", author: "Juraj Červenák", country: "Slovensko", city: "Košice", genre: "Historická detektívka", year: 2024, description: "Stein a Barbarič pátrajú po vzácnom rukopise v renesančných Košiciach." },
  { title: "Zlatá truhla", author: "Juraj Červenák", country: "Slovensko", city: "Rožňava", genre: "Historické fantasy", year: 2025, description: "Dobrodružstvá Adama Šarkana v tajomnom prostredí Gemera." },
  { title: "Železný polmesiac", author: "Juraj Červenák", country: "Maďarsko", city: "Ostrihom", genre: "Historický román", year: 2026, description: "Kapitán Báthory čelí osmanskej hrozbe v pohraničných pevnostiach." },
  { title: "Diablova pevnosť", author: "Juraj Červenák", country: "Chorvátsko", city: "Záhreb", genre: "Historický román", year: 2026, description: "Nové dobrodružstvo Kornélia Báthoryho na krvavom pomedzí Balkánu." },
  { title: "The Fortune Tellers of Rue Daru", author: "Olesya Salnikova Gilmore", country: "Francúzsko", city: "Paríž", genre: "Mystická história", year: 2026, description: "Ruskí emigranti a špiritistické seansy v Paríži po revolúcii." },
  { title: "Land", author: "Maggie O’Farrell", country: "Írsko", city: "Dublin", genre: "Historická dráma", year: 2026, description: "Epický príbeh o prežití a rodine počas mapovania Írska v 19. storočí." },
  { title: "The School of Night", author: "Karl Ove Knausgaard", country: "Veľká Británia", city: "Londýn", genre: "Literárna fikcia", year: 2026, description: "Mystický príbeh o fotografovi, ktorý v Londýne uzavrie nebezpečnú dohodu." },
  { title: "Cool Machine", author: "Colson Whitehead", country: "USA", city: "New York", genre: "Krimi", year: 2026, description: "Zavŕšenie harlemskej trilógie od dvojnásobného držiteľa Pulitzerovej ceny." },
  { title: "Dear Debbie", author: "Freida McFadden", country: "USA", city: "Boston", genre: "Psychologický thriller", year: 2026, description: "Bývalá poradkyňa v novinách berie spravodlivosť do vlastných rúk v Bostone." },
  { title: "Anatomy of an Alibi", author: "Ashley Elston", country: "USA", city: "New Orleans", genre: "Právnický thriller", year: 2026, description: "Dve ženy si vymenia identity, no ráno po výmene dôjde k vražde v Louisiane." },
  { title: "My Husband's Wife", author: "Alice Feeney", country: "Veľká Británia", city: "Londýn", genre: "Psychologický thriller", year: 2026, description: "Umelkyňa na pokraji úspechu musí čeliť pomste a klamstvám v Londýne." },
  { title: "The Keeper", author: "Tana French", country: "Írsko", city: "Dublin", genre: "Krimi/Detektívka", year: 2026, description: "Zavŕšenie trilógie o Calovi Hooperovi v drsnej írskej divočine." },
  { title: "The Midnight Train", author: "Matt Haig", country: "Veľká Británia", city: "Edinburgh", genre: "Magický realizmus", year: 2026, description: "Časovo-cestovateľský príbeh o láske a šanci napraviť minulosť." },
  { title: "Sisters in Yellow", author: "Mieko Kawakami", country: "Japonsko", city: "Tokio", genre: "Spoločenský román", year: 2026, description: "Temné a realistické skúmanie zrady medzi tromi ženami v Tokiu." },
  { title: "Intermezzo", author: "Sally Rooney", country: "Írsko", city: "Dublin", genre: "Beletria", year: 2024, description: "Komplexný príbeh dvoch bratov vyrovnávajúcich sa so stratou v Dubline." },
  { title: "Two Can Play", author: "Ali Hazelwood", country: "USA", city: "Seattle", genre: "Romantika", year: 2026, description: "Rivalita medzi vývojármi videohier v technologickom centre Seattlu." },
  { title: "Alchemised", author: "SenLinYu", country: "Veľká Británia", city: "Oxford", genre: "Temná fantasy", year: 2025, description: "Epický príbeh o mágii, vojne a osudovom pute v akademickom Oxforde." },
  { title: "The Witch's Orchard", author: "Archer Sullivan", country: "USA", city: "Salem", genre: "Mysteriózne fantasy", year: 2025, description: "Súkromná vyšetrovateľka pátra po zmiznutom dieťati v tajomnom Saleme." },
  { title: "Green and Deadly Things", author: "Jenn Lyons", country: "Taliansko", city: "Rím", genre: "Fantasy", year: 2026, description: "Nekromancia a staroveké prekliatia ožívajú v uliciach večného mesta." },
  { title: "Katabasis", author: "R.F. Kuang", country: "Japonsko", city: "Tokio", genre: "Fantasy/Horor", year: 2025, description: "Temný zostup do nadprirodzeného podsvetia inšpirovaný východnou mytológiou." },
  { title: "The South", author: "Tash Aw", country: "Malajzia", city: "Kuala Lumpur", genre: "Historická dráma", year: 2025, description: "Epický príbeh o rodine a identite v meniacej sa povojnovej Malajzii." },
  { title: "The Loneliness of Sonia and Sunny", author: "Kiran Desai", country: "India", city: "Bombaj", genre: "Beletria", year: 2025, description: "Prvý román autorky po takmer 20 rokoch, skúmajúci modernú izoláciu v Indii." },
  { title: "We Do Not Part", author: "Han Kang", country: "Južná Kórea", city: "Soul", genre: "Historická fikcia", year: 2024, description: "Hlboká reflexia o priateľstve a tragickej histórii ostrova Čedžu." },
  { title: "Wolf Hour", author: "Jo Nesbø", country: "Nórsko", city: "Oslo", genre: "Krimi", year: 2026, description: "Najnovší triler od majstra severského noir, odohrávajúci sa v temnom Osle." },
  { title: "The Fresh Cut", author: "Antti Tuomainen", country: "Fínsko", city: "Helsinki", genre: "Čierna komédia/Krimi", year: 2026, description: "Absurdný a napínavý príbeh majiteľa píly v nebezpečnom fínskom podsvetí." },
  { title: "Stolen", author: "Ann-Helén Laestadius", country: "Švédsko", city: "Kiruna", genre: "Spoločenská dráma", year: 2023, description: "Príbeh o komunite Sámov bojujúcich o svoje tradície na severe Švédska." },
  { title: "Under the Blazing Sun", author: "Jenny Lund Madsen", country: "Dánsko", city: "Kodaň", genre: "Meta-detektívka", year: 2026, description: "Dánska spisovateľka sa zapletie do skutočnej vraždy počas hľadania inšpirácie." },
  { title: "A Minor Chorus", author: "Billy-Ray Belcourt", country: "Kanada", city: "Edmonton", genre: "Literárna fikcia", year: 2026, description: "Introspektívny pohľad na život domorodého kvír muža v severnej Alberte." },
  { title: "We, the Kindling", author: "Juliane Okot Bitek", country: "Kanada", city: "Vancouver", genre: "Beletria", year: 2025, description: "Poetický román o imigrácii a hľadaní koreňov v modernom Vancouveri." },
  { title: "No Place to Bury the Dead", author: "Karina Sainz Borgo", country: "Venezuela", city: "Caracas", genre: "Dystopický thriller", year: 2024, description: "Dramatický útek rodiny z krajiny zasiahnutej tajomnou nákazou a chaosom." },
  { title: "The Possession of Alba Díaz", author: "Isabel Cañas", country: "Mexiko", city: "Zacatecas", genre: "Historický horor", year: 2025, description: "Démonická prítomnosť v strieborných baniach koloniálneho Mexika 18. storočia." },
  { title: "Good and Evil", author: "Samanta Schweblin", country: "Argentína", city: "Buenos Aires", genre: "Mysteriózne poviedky", year: 2025, description: "Zbierka znepokojivých príbehov z predmestí argentínskej metropoly." },
  { title: "Dream Count", author: "Chimamanda Ngozi Adichie", country: "Nigéria", city: "Lagos", genre: "Beletria", year: 2025, description: "Dlhoočakávaný román o štyroch ženách a ich osudoch medzi Lagosom a USA." },
  { title: "And So I Roar", author: "Abi Daré", country: "Nigéria", city: "Abeokuta", genre: "Spoločenský román", year: 2024, description: "Pokračovanie silného príbehu o boji za vzdelanie a slobodu v nigérijskej dedine." },
  { title: "Pillaging the Dead", author: "Degol Hailu", country: "Etiópia", city: "Addis Abeba", genre: "Politická satira", year: 2024, description: "Ostrý pohľad na korupciu a pouličný život v súčasnej Etiópii." },
  { title: "American Hagwon", author: "Min Jin Lee", country: "Južná Kórea", city: "Soul", genre: "Epická sága", year: 2026, description: "Završenie trilógie o kórejskej diaspóre, začínajúce v Soule počas krízy v roku 1997." },
  { title: "The Last of Earth", author: "Deepa Anappara", country: "Tibet", city: "Lhasa", genre: "Historický román", year: 2026, description: "Atmosférický príbeh z 19. storočia o politických intrigách a duchovnom tajomstve." },
  { title: "This Is Where the Serpent Lives", author: "Daniyal Mueenuddin", country: "Pakistan", city: "Rávalpindí", genre: "Multigeneračná sága", year: 2026, description: "Majstrovský debut o osudoch bohatej rodiny a ich sluhov v súčasnom Pakistane." },
  { title: "The Last Quarter of the Moon", author: "Chi Zijian", country: "Čína", city: "Chej-lung-ťiang", genre: "Historická beletria", year: 2026, description: "Dojímavý príbeh o poslednom kočovnom kmeni sobov na severe Číny." },
  { title: "Wolf Hour", author: "Jo Nesbø", country: "Nórsko", city: "Oslo", genre: "Krimi", year: 2026, description: "Nový triler z temných uličiek Osla, kde sa minulosť stretáva s brutálnou prítomnosťou." },
  { title: "The Secret of Saint Olaf's Church", author: "Indrek Hargla", country: "Lotyšsko/Sever", city: "Riga", genre: "Historická detektívka", year: 2026, description: "Lekárnik Melchior rieši vraždu rytiera v stredovekej Rige." },
  { title: "The Fresh Cut", author: "Antti Tuomainen", country: "Fínsko", city: "Helsinki", genre: "Čierna komédia", year: 2026, description: "Absurdný a nebezpečný príbeh z fínskeho podsvetia plný suchého humoru." },
  { title: "Under the Blazing Sun", author: "Jenny Lund Madsen", country: "Dánsko", city: "Kodaň", genre: "Severské noir", year: 2026, description: "Spisovateľka sa v Kodani zapletie do vyšetrovania skutočného zločinu." },
  { title: "White River Crossing", author: "Ian McGuire", country: "Kanada", city: "Churchill", genre: "Historický thriller", year: 2026, description: "Brutálna expedícia do zamrznutej kanadskej divočiny v roku 1766." },
  { title: "A Good Animal", author: "Sara Maurer", country: "Kanada", city: "Sault Ste. Marie", genre: "Coming-of-age", year: 2026, description: "Príbeh o dospievaní a drsnej realite života na vidieku pri hraniciach s Michiganom." },
  { title: "Autobiography of Cotton", author: "Cristina Rivera Garza", country: "Mexiko", city: "Matamoros", genre: "Autofikcia", year: 2026, description: "Príbeh o práci na bavlníkových poliach na hraniciach Mexika a Texasu." },
  { title: "The News from Dublin", author: "Colm Tóibín", country: "Argentína", city: "Buenos Aires", genre: "Beletria", year: 2026, description: "Poviedky skúmajúce životy emigrantov od Dublinu až po Argentínu." },
  { title: "Dream Count", author: "Chimamanda Ngozi Adichie", country: "Nigéria", city: "Lagos", genre: "Beletria", year: 2025, description: "Štyri ženy a ich túžby v modernom Lagose od autorky hitu Americanah." },
  { title: "Leave Your Mess at Home", author: "Tolani Akinola", country: "Nigéria", city: "Abeokuta", genre: "Rodinná dráma", year: 2026, description: "Súrodenci odhaľujú rodinné tajomstvá počas nezabudnuteľných sviatkov." },
  { title: "The Mountains Sing", author: "Nguyễn Phan Quế Mai", country: "Vietnam", city: "Hanoj", genre: "Historická sága", year: 2020, description: "Epický príbeh rodiny prežívajúcej vojnu vo Vietname." },
  { title: "Beasts of a Little Land", author: "Juhea Kim", country: "Južná Kórea", city: "Soul", genre: "Historická dráma", year: 2021, description: "Osudové stretnutie lovca a japonského dôstojníka v okupovanej Kórei." },
  { title: "The Henna Artist", author: "Alka Joshi", country: "India", city: "Džajpur", genre: "Beletria", year: 2020, description: "Cesta mladej umelkyne v indickom „ružovom meste“ v 50. rokoch." },
  { title: "Bullet Train", author: "Kōtarō Isaka", country: "Japonsko", city: "Tokio", genre: "Thriller", year: 2010, description: "Päť nájomných vrahov v šinkansene smerujúcom z Tokia do Morioky." },
  { title: "The Chestnut Man", author: "Søren Sveistrup", country: "Dánsko", city: "Kodaň", genre: "Severské noir", year: 2018, description: "Mrazivé vyšetrovanie vrážd spojených s postavičkami z gaštanov." },
  { title: "Stolen", author: "Ann-Helén Laestadius", country: "Švédsko", city: "Kiruna", genre: "Spoločenská dráma", year: 2023, description: "Boj mladej sámskej ženy za spravodlivosť v arktickom Švédsku." },
  { title: "The Ice Princess", author: "Camilla Läckberg", country: "Švédsko", city: "Fjällbacka", genre: "Krimi", year: 2003, description: "Nález mŕtvej priateľky odhalí temné tajomstvá malého mesta." },
  { title: "Winterkill", author: "Ragnar Jónasson", country: "Island", city: "Siglufjörður", genre: "Krimi", year: 2021, description: "Klaustrofobický thriller z najsevernejšieho mesta Islandu." },
  { title: "Five Little Indians", author: "Michelle Good", country: "Kanada", city: "Vancouver", genre: "Historická fikcia", year: 2020, description: "Príbeh piatich preživších z cirkevného internátneho systému v BC." },
  { title: "Greenwood", author: "Michael Christie", country: "Kanada", city: "Vancouver Island", genre: "Epická sága", year: 2019, description: "Generačný príbeh rodiny úzko spätý s kanadskými lesmi." },
  { title: "The Book of Negroes", author: "Lawrence Hill", country: "Kanada", city: "Shelburne", genre: "Historický román", year: 2007, description: "Putovanie Aminaty z Afriky cez USA až do Nového Škótska." },
  { title: "Fruit of the Drunken Tree", author: "Ingrid Rojas Contreras", country: "Kolumbia", city: "Bogota", genre: "Dráma", year: 2018, description: "Priateľstvo dvoch dievčat v nebezpečnej Kolumbii 90. rokov." },
  { title: "Lost City Radio", author: "Daniel Alarcón", country: "Peru", city: "Lima", genre: "Dystopia", year: 2007, description: "Hlas z rádiovej show spája ľudí po občianskej vojne v juhoamerickej krajine." },
  { title: "The Spanish Daughter", author: "Lorena Hughes", country: "Ekvádor", city: "Guayaquil", genre: "Historická dráma", year: 2022, description: "Mladá žena bojuje o svoje dedičstvo na kakaovej plantáži." },
  { title: "Half of a Yellow Sun", author: "Chimamanda Ngozi Adichie", country: "Nigéria", city: "Lagos", genre: "Historický román", year: 2006, description: "Osudy ľudí počas občianskej vojny v Biafre." },
  { title: "Homegoing", author: "Yaa Gyasi", country: "Ghana", city: "Cape Coast", genre: "Historická sága", year: 2016, description: "Príbeh dvoch sestier a ôsmich generácií ich potomkov." },
  { title: "The Death of Vivek Oji", author: "Akwaeke Emezi", country: "Nigéria", city: "Owerri", genre: "Beletria", year: 2020, description: "Hľadanie pravdy o živote a smrti mladého muža v Nigérii." },
  { title: "The Promise", author: "Damon Galgut", country: "Južná Afrika", city: "Pretória", genre: "Dráma", year: 2021, description: "Rozpad rodiny farmárov počas troch dekád po páde apartheidu." },
  { title: "American Hagwon", author: "Min Jin Lee", country: "Južná Kórea", city: "Soul", genre: "Epická sága", year: 2026, description: "Príbeh o kórejskom vzdelávacom systéme a rodinných ambíciách v Soule." },
  { title: "The Seven Moons of Maali Almeida", author: "Shehan Karunatilaka", country: "Srí Lanka", city: "Kolombo", genre: "Magický realizmus", year: 2022, description: "Zavraždený fotograf hľadá pravdu v posmrtnom živote počas občianskej vojny." },
  { title: "Djinn Patrol on the Purple Line", author: "Deepa Anappara", country: "India", city: "Naí Dillí", genre: "Mysteriózne", year: 2020, description: "Traja kamaráti pátrajú po zmiznutých deťoch v indickom slume." },
  { title: "The Bangalore Detectives Club", author: "Harini Nagendra", country: "India", city: "Bangalúr", genre: "Historická detektívka", year: 2022, description: "Mladá nevesta v 20. rokoch 20. storočia rieši vraždu v koloniálnom Bangalúre." },
  { title: "The Bird Tribunal", author: "Agnes Ravatn", country: "Nórsko", city: "Bergen", genre: "Psychologický thriller", year: 2016, description: "Mrazivý príbeh o vine a izolácii vo fjorde neďaleko Bergenu." },
  { title: "The Chestnut Man", author: "Søren Sveistrup", country: "Dánsko", city: "Kodaň", genre: "Severské noir", year: 2018, description: "Brutálne vraždy v Kodani spojené so záhadnými figúrkami z gaštanov." },
  { title: "The Rabbit Hunter", author: "Lars Kepler", country: "Švédsko", city: "Štokholm", genre: "Thriller", year: 2016, description: "Detektív Joona Linna pátra po vrahovi útočiacom na švédsku elitu." },
  { title: "Hotel Silence", author: "Auður Ava Ólafsdóttir", country: "Island", city: "Reykjavík", genre: "Beletria", year: 2018, description: "Muž odchádza z Reykjavíku do vojnou zničenej krajiny, aby našiel zmysel života." },
  { title: "The Tiger and the Cosmonaut", author: "Eddy Boudel Tan", country: "Kanada", city: "Churchill", genre: "Mysteriózna dráma", year: 2025, description: "Návrat do rodného mesta v Arktíde kvôli zmiznutiu otca." },
  { title: "Black Rock", author: "John McFetridge", country: "Kanada", city: "Montreal", genre: "Krimi", year: 2022, description: "Detektívny príbeh zasadený do búrlivého Montrealu počas krízy v 70. rokoch." },
  { title: "Station Eleven", author: "Emily St. John Mandel", country: "Kanada", city: "Toronto", genre: "Dystopia", year: 2014, description: "Umelecká skupina putuje krajinou po kolapse civilizácie (začína v Toronte)." },
  { title: "The Ex-Perimento", author: "Maria J. Morillo", country: "Venezuela", city: "Caracas", genre: "Romantika", year: 2026, description: "Lifestyle novinárka a jej nečakané milostné experimenty v Caracase." },
  { title: "The Night We Became Strangers", author: "Lorena Hughes", country: "Ekvádor", city: "Quito", genre: "Historický román", year: 2025, description: "Následky tragického rozhlasového vysielania v Quite v roku 1949." },
  { title: "The Year of the Wind", author: "Karina Pacheco Medrano", country: "Peru", city: "Lima", genre: "Beletria", year: 2021, description: "Hľadanie rodinnej histórie uprostred politických nepokojov v Peru." },
  { title: "Fela: Music is the Weapon", author: "McCreery & Fagbamiye", country: "Nigéria", city: "Lagos", genre: "Grafický román / Biografia", year: 2025, description: "Život nigérijskej legendy Fela Kutiho v búrlivom Lagose." },
  { title: "The Dragonfly Sea", author: "Yvonne Adhiambo Owuor", country: "Keňa", city: "Lamu", genre: "Epická sága", year: 2019, description: "Dievča z kenského ostrova hľadá svoju identitu až v ďalekej Číne." },
  { title: "Dust", author: "Yvonne Adhiambo Owuor", country: "Keňa", city: "Nairobi", genre: "Beletria", year: 2014, description: "Rodina v Nairobi sa vyrovnáva so stratou a národnou históriou Kene." },
  { title: "A Long Way Gone", author: "Ishmael Beah", country: "Sierra Leone", city: "Freetown", genre: "Memoáre", year: 2007, description: "Skutočný príbeh detského vojaka v uliciach Freetownu." },
  { title: "Hot Chocolate on Thursday", author: "Michiko Aoyama", country: "Japonsko", city: "Tokio", genre: "Beletria", year: 2026, description: "Dvanásť prepletených príbehov z mestskej štvrte, ktoré spája jedna kaviareň." },
  { title: "The Soul-Catchers", author: "Naoko Higashi", country: "Japonsko", city: "Kjóto", genre: "Magický realizmus", year: 2026, description: "Zosnulí ľudia sa vracajú k blízkym v podobe predmetov, aby ich strážili." },
  { title: "I Deliver Parcels in Beijing", author: "Hu Anyan", country: "Čína", city: "Peking", genre: "Memoáre/Sociálna sonda", year: 2025, description: "Surový pohľad na život kuriéra v pulzujúcom a neúprosnom Pekingu." },
  { title: "The Seven Daughters of Dupree", author: "Nikesha Elise Williams", country: "Rôzne/Afrika", city: "Freetown", genre: "Historická sága", year: 2026, description: "Epický príbeh siedmich generácií žien prepletený s históriou a mýtmi." },
  { title: "A Far-Flung Life", author: "M.L. Stedman", country: "Austrália/Nórsko", city: "Bergen", genre: "Historická dráma", year: 2026, description: "Rodinná tragédia mení životy naprieč kontinentmi od fjordov po Austráliu." },
  { title: "The Shadow of the North", author: "Viveca Sten", country: "Švédsko", city: "Åre", genre: "Severské noir", year: 2025, description: "Detektívka z lyžiarskeho strediska, kde sneh ukrýva staré hriechy." },
  { title: "The Girl in the Eagle's Talons", author: "Karin Smirnoff", country: "Švédsko", city: "Gasskas", genre: "Krimi thriller", year: 2023, description: "Pokračovanie kultovej série Millennium v drsnom prostredí severného Švédska." },
  { title: "The Tiger and the Cosmonaut", author: "Eddy Boudel Tan", country: "Kanada", city: "Churchill", genre: "Mysteriózna dráma", year: 2025, description: "Pátranie po otcovi v arktickom meste známom ľadovými medveďmi." },
  { title: "Ducks: Two Years in the Oil Sands", author: "Kate Beaton", country: "Kanada", city: "Fort McMurray", genre: "Grafický román", year: 2022, description: "Autentický príbeh o práci v ropných pieskoch a samote na severe Kanady." },
  { title: "200 Monas", author: "Jan Saenz", country: "Mexiko", city: "Monterrey", genre: "Čierna komédia", year: 2026, description: "Študentka musí za 48 hodín predať tajné zásoby liekov svojej matky." },
  { title: "The Night We Met", author: "Abby Jimenez", country: "Austrália/Ekvádor", city: "Quito", genre: "Romantika", year: 2026, description: "Príbeh o osudových rozhodnutiach a náhode v malebnom Quite." },
  { title: "The Wind Knows My Name", author: "Isabel Allende", country: "Salvádor/Rakúsko", city: "Viedeň/San Salvador", genre: "Historická fikcia", year: 2023, description: "Paralelné príbehy detí utekajúcich pred násilím v dvoch rôznych storočiach." },
  { title: "The Rest of You", author: "Maame Blue", country: "Ghana", city: "Akkra", genre: "Psychologická dráma", year: 2025, description: "Mladá žena sa vracia do Ghany, aby čelila potlačenej traume z detstva." },
  { title: "The Death of Vivek Oji", author: "Akwaeke Emezi", country: "Nigéria", city: "Owerri", genre: "Beletria", year: 2020, description: "Záhadná smrť mladého muža a hľadanie jeho skutočnej identity v Nigérii." },
  { title: "Small Joys", author: "Elvin James Mensah", country: "Ghana", city: "Kumasi", genre: "Coming-of-age", year: 2023, description: "Oslava priateľstva a hľadania šťastia napriek životným skúškam." }
];



const SEED_USERS = [
  { email: "emma.nova@test.sk",      password: "test123", displayName: "Emma Nová",      readBooksIds: [100, 102, 105, 109, 113, 118, 123, 129, 134, 141, 148, 155] },
  { email: "lukas.moderny@test.sk",  password: "test123", displayName: "Lukáš Moderný",  readBooksIds: [100, 102, 108,105,101, 112, 117, 121, 126, 132, 138, 144, 151, 159] },
  { email: "nina.reads@test.sk",     password: "test123", displayName: "Nina Reads",     readBooksIds: [100, 106, 110, 114, 119, 124, 128, 133, 139, 145, 152, 157, 159] },
  { email: "adam.booker@test.sk",    password: "test123", displayName: "Adam Booker",    readBooksIds: [107, 111, 115, 120, 125, 130, 135, 140, 146, 149, 153, 158, 159] },
  { email: "sofia.next@test.sk",     password: "test123", displayName: "Sofia Next",     readBooksIds: [116, 122, 127, 131, 136, 137, 142, 143, 147, 150, 154, 156, 159] },
];

export const seedDatabase = async () => {
  console.log('🌱 Začínam naplňovať databázu...');

  try {
    // 0. VYMAŽ EXISTUJÚCE KNIHY
    console.log('🗑️ Mažem staré knihy...');
    const booksCollection = collection(db, 'books');
    const booksSnapshot = await getDocs(booksCollection);
    const deletePromises = [];
    booksSnapshot.forEach(docSnapshot => deletePromises.push(deleteDoc(docSnapshot.ref)));
    await Promise.all(deletePromises);
    console.log(`✅ Zmazaných ${booksSnapshot.size} kníh`);

    // 1. PRIDAJ KNIHY — všetky súradnice sú hardcoded, žiadne API volanie
    console.log('📚 Pridávam nové knihy...');
    let added = 0;

    for (let index = 0; index < SEED_BOOKS.length; index++) {
      const book = SEED_BOOKS[index];
      const bookId = index + 1;

      const coordinates = BOOK_COORDINATES[book.city];

      if (!coordinates) {
        console.error(`❌ CHÝBAJÚ súradnice pre mesto: "${book.city}" (${book.title})`);
        continue;
      }

      const bookDocRef = doc(db, 'books', `book_${bookId}`);
      const coverUrl = await fetchRealCoverUrl(book);
      await setDoc(bookDocRef, {
        id: bookId,
        title: book.title,
        author: book.author,
        country: book.country,
        city: book.city,
        coordinates: coordinates,
        genre: book.genre,
        year: book.year,
        description: book.description,
        cover: coverUrl,
        image: coverUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ ${bookId}/${SEED_BOOKS.length}: ${book.title} → [${coordinates[0]}, ${coordinates[1]}]`);
      added++;
    }

    console.log(`✅ Pridaných ${added} kníh!`);

    // 2. VYTVOR POUŽÍVATEĽOV
    console.log('👥 Vytváram používateľov...');

    for (const userData of SEED_USERS) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
          email: userData.email,
          displayName: userData.displayName,
          readBooks: userData.readBooksIds,
          wishlist: [],
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ ${userData.displayName} (${userData.readBooksIds.length} kníh)`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️ ${userData.email} už existuje, preskakujem...`);
        } else {
          console.error(`❌ Chyba: ${userData.email}:`, error);
        }
      }
    }

    console.log('🎉 Hotovo!');
    alert(`✅ Pridaných ${added} kníh a ${SEED_USERS.length} používateľov. Obnovte stránku (F5).`);
    return { success: true };

  } catch (error) {
    console.error('❌ Chyba:', error);
    return { success: false, error };
  }
};

export const clearSeedData = async () => {
  try {
    const booksCollection = collection(db, 'books');
    const booksSnapshot = await getDocs(booksCollection);
    const deletePromises = [];
    booksSnapshot.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    await Promise.all(deletePromises);
    console.log('✅ Všetky knihy zmazané');
    return { success: true };
  } catch (error) {
    console.error('❌ Chyba:', error);
    return { success: false, error };
  }
};