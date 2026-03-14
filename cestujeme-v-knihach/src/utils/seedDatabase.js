// src/utils/seedDatabase.js
// TENTO SCRIPT SPUSTI LEN RAZ aby si naplnila databázu testovacími dátami

import { db, auth } from '../firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
};

const SEED_BOOKS = [
  // SLOVENSKO
  { title: "Tisícročná včela",          author: "Peter Jaroš",           country: "Slovensko",      city: "Hybe",          genre: "Sága",                year: 1979, description: "Osudy murárskeho rodu na Liptove." },
  { title: "Námestie svätej Alžbety",   author: "Rudolf Jašík",          country: "Slovensko",      city: "Nitra",         genre: "Vojnový román",        year: 1958, description: "Tragický príbeh lásky počas vojny." },
  { title: "Rivers of Babylon",         author: "Peter Pišťanek",        country: "Slovensko",      city: "Bratislava",    genre: "Beletria",             year: 1991, description: "Krutý príbeh z prostredia bratislavského hotela." },
  { title: "Červený kapitán",           author: "Dominik Dán",           country: "Slovensko",      city: "Bratislava",    genre: "Detektívka",           year: 2007, description: "Napínavý kriminálny príbeh z hlavného mesta." },
  { title: "Sklený zámok",              author: "Dušan Dušek",           country: "Slovensko",      city: "Piešťany",      genre: "Beletria",             year: 2013, description: "Atmosféra kúpeľného mesta." },
  { title: "Tri gaštanové kone",        author: "Margita Figuli",        country: "Slovensko",      city: "Orava",         genre: "Novela",               year: 1940, description: "Klasická naturistická próza z Oravy." },
  { title: "Mäso",                      author: "Arpád Soltész",         country: "Slovensko",      city: "Košice",        genre: "Thriller",             year: 2017, description: "Drsné 90. roky na východnom Slovensku." },
  { title: "Ťapákovci",                 author: "B. S. Timrava",         country: "Slovensko",      city: "Ábelová",       genre: "Klasika",              year: 1914, description: "Kritika slovenského konzervativizmu." },
  { title: "Prachy",                    author: "Michal Hvorecký",       country: "Slovensko",      city: "Bratislava",    genre: "Beletria",             year: 2001, description: "Moderná bratislavská próza." },
  { title: "Kruté radosť",              author: "Janko Jesenský",        country: "Slovensko",      city: "Bratislava",    genre: "Beletria",             year: 1920, description: "Satira na malomestský život." },

  // ČESKO
  { title: "Dobrý voják Švejk",                 author: "Jaroslav Hašek",      country: "Česko", city: "Praha",      genre: "Satira",             year: 1921, description: "Osudy vojaka v Prahe počas 1. sv. vojny." },
  { title: "Babička",                           author: "Božena Němcová",      country: "Česko", city: "Ratibořice", genre: "Klasika",            year: 1855, description: "Idylický obraz venkovského života." },
  { title: "Obsluhoval jsem anglického krále",  author: "Bohumil Hrabal",      country: "Česko", city: "Praha",      genre: "Beletria",           year: 1971, description: "Vzostup a pád čašníka v Prahe." },
  { title: "Nesnesitelná lehkost bytí",         author: "Milan Kundera",       country: "Česko", city: "Praha",      genre: "Filozofický román",  year: 1984, description: "Život v okupovanej Prahe." },
  { title: "Spalovač mrtvol",                   author: "Ladislav Fuks",       country: "Česko", city: "Praha",      genre: "Psychologický horor",year: 1967, description: "Mrazivý príbeh z pražského krematória." },
  { title: "Krakatit",                          author: "Karel Čapek",         country: "Česko", city: "Praha",      genre: "Sci-Fi",             year: 1922, description: "Vynález strašnej výbušniny v srdci Čiech." },
  { title: "Román pro ženy",                    author: "Michal Viewegh",      country: "Česko", city: "Praha",      genre: "Romantika",          year: 2001, description: "Populárny súčasný český príbeh." },
  { title: "Kytice",                            author: "Karel Jaromír Erben", country: "Česko", city: "Miletín",    genre: "Poézia",             year: 1853, description: "Balady z českého vidieka." },

  // FRANCÚZSKO
  { title: "Notre-Dame de Paris", author: "Victor Hugo",       country: "Francúzsko", city: "Paríž",       genre: "Historický",    year: 1831, description: "Príbeh katedrály a Quasimoda." },
  { title: "Biedni",              author: "Victor Hugo",       country: "Francúzsko", city: "Paríž",       genre: "Klasika",       year: 1862, description: "Jean Valjean a parížske barikády." },
  { title: "Otec Goriot",         author: "Honoré de Balzac",  country: "Francúzsko", city: "Paríž",       genre: "Realizmus",     year: 1835, description: "Život v parížskom penzióne." },
  { title: "Madame Bovary",       author: "Gustave Flaubert",  country: "Francúzsko", city: "Rouen",       genre: "Realizmus",     year: 1856, description: "Tragédia v normandskom mestečku." },
  { title: "Parfum",              author: "Patrick Süskind",   country: "Francúzsko", city: "Grasse",      genre: "Thriller",      year: 1985, description: "Vražedný talent v meste parfumov." },
  { title: "Bel-Ami",             author: "Guy de Maupassant", country: "Francúzsko", city: "Paríž",       genre: "Beletria",      year: 1885, description: "Cesta za mocou v parížskych salónoch." },
  { title: "Pohyblivý sviatok",   author: "Ernest Hemingway",  country: "Francúzsko", city: "Paríž",       genre: "Autobiografia", year: 1964, description: "Hemingwayove spomienky na Paríž." },
  { title: "Germinal",            author: "Émile Zola",        country: "Francúzsko", city: "Lille",       genre: "Naturalizmus",  year: 1885, description: "Štrajk baníkov na severe Francúzska." },
  { title: "Slávik",              author: "Kristin Hannah",    country: "Francúzsko", city: "Carcassonne", genre: "Historický",    year: 2015, description: "Odboj na juhu Francúzska." },

  // VEĽKÁ BRITÁNIA
  { title: "Sherlock Holmes: Štúdia v krvavočervenej", author: "A. C. Doyle",    country: "Veľká Británia", city: "Londýn",        genre: "Detektívka",  year: 1887, description: "Začiatok legendy na Baker Street." },
  { title: "Oliver Twist",                             author: "Charles Dickens",country: "Veľká Británia", city: "Londýn",        genre: "Klasika",     year: 1837, description: "Sirota v podsvetí viktoriánskeho Londýna." },
  { title: "Pýcha a predsudok",                        author: "Jane Austen",    country: "Veľká Británia", city: "Hertfordshire", genre: "Romantika",   year: 1813, description: "Hľadanie lásky na anglickom vidieku." },
  { title: "Wuthering Heights",                        author: "Emily Brontë",   country: "Veľká Británia", city: "Yorkshire",     genre: "Gotický román",year: 1847, description: "Vášnivý príbeh z veterných vresovísk." },
  { title: "Dracula",                                  author: "Bram Stoker",    country: "Veľká Británia", city: "Whitby",        genre: "Horor",       year: 1897, description: "Príchod upíra do prístavného mesta Whitby." },
  { title: "Pani Dallowayová",                         author: "Virginia Woolf", country: "Veľká Británia", city: "Londýn",        genre: "Modernizmus", year: 1925, description: "Jeden deň v Londýne po vojne." },
  { title: "Harry Potter a Kameň mudrcov",             author: "J.K. Rowling",   country: "Veľká Británia", city: "Londýn",        genre: "Fantasy",     year: 1997, description: "Nástupište 9 a 3/4 na stanici King's Cross." },
  { title: "The North Water",                          author: "Ian McGuire",    country: "Veľká Británia", city: "Hull",          genre: "Historický",  year: 2016, description: "Veľrybárska výprava vyrážajúca z Hullu." },
  { title: "Trainspotting",                            author: "Irvine Welsh",   country: "Veľká Británia", city: "Edinburgh",     genre: "Beletria",    year: 1993, description: "Drsný život v Edinburghu." },

  // ÍRSKO
  { title: "Ulysses", author: "James Joyce", country: "Írsko", city: "Dublin", genre: "Modernizmus", year: 1922, description: "Jeden deň Leopolda Blooma v Dubline." },

  // USA
  { title: "Veľký Gatsby",                author: "F. Scott Fitzgerald", country: "USA", city: "New York",    genre: "Klasika",     year: 1925, description: "Jazzový vek na Long Islande." },
  { title: "Zabiť mockingbirda",          author: "Harper Lee",          country: "USA", city: "Monroeville", genre: "Klasika",     year: 1960, description: "Rasizmus v mestečku Maycomb (Alabama)." },
  { title: "Raňajky u Tiffanyho",         author: "Truman Capote",       country: "USA", city: "New York",    genre: "Novela",      year: 1958, description: "Holly Golightly na Manhattane." },
  { title: "Na ceste",                    author: "Jack Kerouac",        country: "USA", city: "Denver",      genre: "Beletria",    year: 1957, description: "Putovanie naprieč Amerikou." },
  { title: "Biela veľryba",               author: "Herman Melville",     country: "USA", city: "Nantucket",   genre: "Dobrodružné", year: 1851, description: "Lov na Moby Dicka začína v prístave Nantucket." },
  { title: "Kto chytá v žite",            author: "J. D. Salinger",      country: "USA", city: "New York",    genre: "Beletria",    year: 1951, description: "Holden Caulfield blúdi New Yorkom." },
  { title: "The Shining",                 author: "Stephen King",        country: "USA", city: "Estes Park",  genre: "Horor",       year: 1977, description: "Hotel Overlook v horách Colorado." },
  { title: "L.A. Confidential",           author: "James Ellroy",        country: "USA", city: "Los Angeles", genre: "Krimi",       year: 1990, description: "Korupcia v zlatom veku Hollywoodu." },
  { title: "The Devil in the White City", author: "Erik Larson",         country: "USA", city: "Chicago",     genre: "Historický",  year: 2003, description: "Vrah na svetovej výstave v Chicagu." },

  // RUSKO
  { title: "Zločin a trest",          author: "Fjodor Dostojevskij", country: "Rusko", city: "Petrohrad",       genre: "Klasika",           year: 1866, description: "Raskoľnikov a jeho svedomie v Petrohrade." },
  { title: "Majster a Margaréta",     author: "Michail Bulgakov",    country: "Rusko", city: "Moskva",          genre: "Magický realizmus",  year: 1967, description: "Diabol navštívi stalinskú Moskvu." },
  { title: "Vojna a mier",            author: "Lev Tolstoj",         country: "Rusko", city: "Moskva",          genre: "Historický",         year: 1869, description: "Napoleonovo ťaženie na Moskvu." },
  { title: "Doktor Živago",           author: "Boris Pasternak",     country: "Rusko", city: "Moskva",          genre: "Klasika",            year: 1957, description: "Osudy lekára počas revolúcie." },
  { title: "Jevgenij Onegin",         author: "A. S. Puškin",        country: "Rusko", city: "Petrohrad",       genre: "Poézia",             year: 1833, description: "Veršovaný román zo šľachtických kruhov." },
  { title: "Súostrovie Gulag",        author: "A. Solženicyn",       country: "Rusko", city: "Magadan",         genre: "História",           year: 1973, description: "Svedectvo o väzenských táboroch." },
  { title: "Anna Karenina",           author: "Lev Tolstoj",         country: "Rusko", city: "Petrohrad",       genre: "Klasika",            year: 1877, description: "Tragická láska v ruskej smotánke." },
  { title: "Piknik pri ceste",        author: "Bratia Strugackí",    country: "Rusko", city: "Sankt Peterburg", genre: "Sci-Fi",             year: 1972, description: "Anomálne zóny blízko mesta." },
  { title: "Zápisky z mŕtveho domu", author: "F. M. Dostojevskij",  country: "Rusko", city: "Omsk",            genre: "Klasika",            year: 1862, description: "Spomienky na trestaneckú kolóniu." },

  // TALIANSKO
  { title: "Meno ruže",                author: "Umberto Eco",                  country: "Taliansko", city: "Turín",    genre: "Mysteriózne", year: 1980, description: "Detektívka v stredovekom kláštore v horách." },
  { title: "Gomora",                   author: "Roberto Saviano",              country: "Taliansko", city: "Neapol",   genre: "Reportáž",    year: 2006, description: "Mrazivý pohľad na neapolskú mafiu." },
  { title: "Gepard",                   author: "Giuseppe Tomasi di Lampedusa", country: "Taliansko", city: "Palermo",  genre: "Historický",  year: 1958, description: "Zánik aristokracie na Sicílii." },
  { title: "Dekameron",                author: "Giovanni Boccaccio",           country: "Taliansko", city: "Florencia",genre: "Klasika",     year: 1353, description: "Príbehy rozprávané počas moru vo Florencii." },
  { title: "Moja geniálna priateľka",  author: "Elena Ferrante",               country: "Taliansko", city: "Neapol",   genre: "Beletria",    year: 2011, description: "Dospievanie v chudobnej štvrti Neapola." },
  { title: "Smrť v Benátkach",         author: "Thomas Mann",                  country: "Taliansko", city: "Benátky",  genre: "Novela",      year: 1912, description: "Posledné dni spisovateľa v Benátkach." },
  { title: "Božská komédia",           author: "Dante Alighieri",              country: "Taliansko", city: "Florencia",genre: "Epos",        year: 1320, description: "Duchovná cesta rodáka z Florencie." },
  { title: "Quo Vadis",                author: "Henryk Sienkiewicz",           country: "Taliansko", city: "Rím",      genre: "Historický",  year: 1896, description: "Kresťania v antickom Ríme." },
  { title: "Inferno",                  author: "Dan Brown",                    country: "Taliansko", city: "Florencia",genre: "Thriller",    year: 2013, description: "Hádanky ukryté v pamiatkach Florencie." },

  // NEMECKO
  { title: "Buddenbrookovci",       author: "Thomas Mann",     country: "Nemecko", city: "Lübeck",    genre: "Sága",       year: 1901, description: "Úpadok kupeckej rodiny v Lübecku." },
  { title: "Berlín, Alexanderplatz",author: "Alfred Döblin",   country: "Nemecko", city: "Berlín",    genre: "Modernizmus",year: 1929, description: "Príbeh trestanca v búrlivom Berlíne." },
  { title: "Zlodejka kníh",         author: "Markus Zusak",    country: "Nemecko", city: "Mníchov",   genre: "Historický", year: 2005, description: "Dievča v nacistickom Nemecku pri Mníchove." },
  { title: "Na západe nič nové",    author: "E. M. Remarque",  country: "Nemecko", city: "Osnabrück", genre: "Vojnový",    year: 1929, description: "Zákopy 1. svetovej vojny." },
  { title: "Faust",                 author: "J. W. Goethe",    country: "Nemecko", city: "Weimar",    genre: "Dráma",      year: 1808, description: "Klasická dráma o zmluve s diablom." },
  { title: "Effi Briestová",        author: "Theodor Fontane", country: "Nemecko", city: "Berlín",    genre: "Realizmus",  year: 1894, description: "Spoločenská dráma z pruského prostredia." },

  // JAPONSKO
  { title: "Nórsky les",    author: "Haruki Murakami",  country: "Japonsko", city: "Tokio",     genre: "Beletria",  year: 1987, description: "Melancholický príbeh lásky v Tokiu." },
  { title: "Pamiatky gejše",author: "Arthur Golden",    country: "Japonsko", city: "Kjóto",     genre: "Historický",year: 1997, description: "Život v kjótskej štvrti Gion." },
  { title: "Kitchen",       author: "Banana Yoshimoto", country: "Japonsko", city: "Tokio",     genre: "Beletria",  year: 1988, description: "Moderný japonský život." },
  { title: "Botchan",       author: "Natsume Soseki",   country: "Japonsko", city: "Matsuyama", genre: "Klasika",   year: 1906, description: "Mladý učiteľ z Tokia odchádza na vidiek." },

  // INDIA
  { title: "Šantaram",     author: "Gregory David Roberts", country: "India", city: "Bombaj",  genre: "Dobrodružné", year: 2003, description: "Útek z väzenia do bombajského podsvetia." },
  { title: "V tieni hory", author: "Gregory David Roberts", country: "India", city: "Bombaj",  genre: "Dobrodružné", year: 2015, description: "Pokračovanie kultového Šantarámu." },
  { title: "Kalkata",      author: "Amitav Ghosh",           country: "India", city: "Kalkata", genre: "Mysteriózne", year: 1995, description: "Príbeh z horúcej Kalkaty." },

  // POĽSKO
  { title: "Solaris", author: "Stanisław Lem", country: "Poľsko", city: "Krakov",  genre: "Sci-Fi",    year: 1961, description: "Kniha napísaná v Krakove." },
  { title: "Bábika",  author: "Bolesław Prus", country: "Poľsko", city: "Varšava", genre: "Realizmus", year: 1890, description: "Panoráma Varšavy 19. storočia." },

  // MAĎARSKO
  { title: "Egri hviezdy",               author: "Géza Gárdonyi", country: "Maďarsko", city: "Eger",     genre: "Historický", year: 1899, description: "Obrana hradu Eger proti Turkom." },
  { title: "Chlapci z Pavlovskej ulice", author: "Ferenc Molnár", country: "Maďarsko", city: "Budapešť", genre: "Pre deti",   year: 1906, description: "Vojna detských partií v Budapešti." },

  // RAKÚSKO
  { title: "Klavíristka", author: "Elfriede Jelinek", country: "Rakúsko", city: "Viedeň", genre: "Psychologický", year: 1983, description: "Temná strana Viedne." },

  // HOLANDSKO
  { title: "Denník Anny Frankovej", author: "Anne Frank", country: "Holandsko", city: "Amsterdam", genre: "Denník", year: 1947, description: "Ukryté dievča v Amsterdame." },

  // ŠPANIELSKO
  { title: "Tieň vetra",  author: "Carlos Ruiz Zafón",   country: "Španielsko", city: "Barcelona", genre: "Mysteriózne", year: 2001, description: "Cintorín zabudnutých kníh v Barcelone." },
  { title: "Don Quijote", author: "Miguel de Cervantes", country: "Španielsko", city: "La Mancha", genre: "Klasika",     year: 1605, description: "Rytierske dobrodružstvá v Kastílii." },

  // EGYPT
  { title: "Bodka za minulosťou", author: "Agatha Christie", country: "Egypt",      city: "Luxor",   genre: "Detektívka", year: 1937, description: "Vražda na Níle pri Luxore." },

  // AFGANISTAN
  { title: "Lovec drakov", author: "Khaled Hosseini", country: "Afganistan", city: "Kábul", genre: "Beletria", year: 2003, description: "Príbeh priateľstva v Kábule." },

  // MAROKO
  { title: "Alchymista", author: "Paulo Coelho", country: "Maroko", city: "Tangier", genre: "Alegória", year: 1988, description: "Santiago v uličkách Maroka." },

  // ŠVÉDSKO
  { title: "Muži, ktorí nenávidia ženy", author: "Stieg Larsson", country: "Švédsko", city: "Štokholm", genre: "Thriller", year: 2005, description: "Kriminálne vyšetrovanie v Štokholme." },

  // ŠVAJČIARSKO
  { title: "Neznesiteľná ľahkosť bytia", author: "Milan Kundera", country: "Švajčiarsko", city: "Zürich", genre: "Filozofický", year: 1984, description: "Časť príbehu v exile v Zürichu." },

  // KOLUMBIA
  { title: "Sto rokov samoty", author: "G. G. Márquez", country: "Kolumbia", city: "Aracataca", genre: "Magický realizmus", year: 1967, description: "Predloha pre mýtické Macondo." },

  // TURECKO
  { title: "Sneženie",             author: "Orhan Pamuk", country: "Turecko", city: "Kars",     genre: "Beletria",   year: 2002, description: "Atmosféra tureckého mesta v zime." },
  { title: "Múzeum nevinnosti",    author: "Orhan Pamuk", country: "Turecko", city: "Istanbul", genre: "Romantika",  year: 2008, description: "Láska v starom Istanbule." },
  { title: "Moje meno je červená", author: "Orhan Pamuk", country: "Turecko", city: "Istanbul", genre: "Historický", year: 1998, description: "Detektívka medzi maliarmi v Istanbule." },

  // BRAZÍLIA
  { title: "Hviezdne hodiny ľudstva", author: "Stefan Zweig", country: "Brazília", city: "Petrópolis", genre: "História", year: 1927, description: "Kniha dopísaná v exile v Brazílii." },

  // PORTUGALSKO
  { title: "Slepota",                author: "José Saramago", country: "Portugalsko", city: "Lisabon", genre: "Dystopia",    year: 1995, description: "Epidémia slepoty v hlavnom meste." },
  { title: "Nočný vlak do Lisabonu", author: "Pascal Mercier",country: "Portugalsko", city: "Lisabon", genre: "Filozofický", year: 2004, description: "Hľadanie autora v Lisabone." },

  // NIGÉRIA
  { title: "Na dvore u mamičky", author: "C. N. Adichie", country: "Nigéria", city: "Lagos", genre: "Beletria", year: 2013, description: "Život v modernom Lagose." },

  // HONDURAS
  { title: "Pobrežie moskytov", author: "Paul Theroux", country: "Honduras", city: "La Ceiba", genre: "Dobrodružné", year: 1981, description: "Pokus o vybudovanie utópie v džungli." },
];

const SEED_USERS = [
  { email: "jan.novak@test.sk",      password: "test123", displayName: "Ján Novák",      readBooksIds: [1, 3, 5, 10, 15, 20, 27, 30, 35] },
  { email: "maria.kovacova@test.sk", password: "test123", displayName: "Mária Kováčová", readBooksIds: [2, 4, 6, 8, 12, 18, 25, 28, 32, 40] },
  { email: "peter.horvath@test.sk",  password: "test123", displayName: "Peter Horváth",  readBooksIds: [1, 5, 7, 11, 15, 22, 27, 31, 36, 42, 45] },
  { email: "lucia.szabova@test.sk",  password: "test123", displayName: "Lucia Szabová",  readBooksIds: [3, 8, 10, 14, 19, 24, 29, 33, 38] },
  { email: "martin.toth@test.sk",    password: "test123", displayName: "Martin Tóth",    readBooksIds: [2, 6, 9, 13, 17, 21, 26, 30, 35, 39, 43, 47] },
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
        image: `https://via.placeholder.com/200x300?text=${encodeURIComponent(book.title)}`,
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