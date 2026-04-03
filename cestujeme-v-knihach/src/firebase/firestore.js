// src/firebase/firestore.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';

// Získanie používateľských dát z databázy
export const getUserData = async (userId) => {
  try {
    console.log(' Načítavam dáta pre používateľa:', userId);
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('Dáta načítané:', data);
      return {
        success: true,
        data: data
      };
    } else {
      console.log(' Používateľ nemá žiadne dáta v databáze');
      return {
        success: true,
        data: {
          readBooks: [],
          createdAt: new Date()
        }
      };
    }
  } catch (error) {
    console.error(" Chyba pri načítaní dát používateľa:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Vytvorenie/aktualizácia používateľského profilu
export const createUserProfile = async (userId, userData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...userData,
      readBooks: [],
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Chyba pri vytváraní profilu:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Pridanie knihy medzi prečítané
export const markBookAsRead = async (userId, bookId) => {
  try {
    console.log(' Označujem knihu ako prečítanú:', { userId, bookId });
    const userDocRef = doc(db, 'users', userId);
    
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log(' Vytváram nový dokument používateľa');
      await setDoc(userDocRef, {
        readBooks: [bookId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      await updateDoc(userDocRef, {
        readBooks: arrayUnion(bookId),
        updatedAt: new Date()
      });
    }
    
    console.log(' Kniha úspešne označená');
    return { 
      success: true,
      message: 'Kniha bola označená ako prečítaná'
    };
  } catch (error) {
    console.error(" Chyba pri označovaní knihy:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Odobranie knihy z prečítaných
export const unmarkBookAsRead = async (userId, bookId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await updateDoc(userDocRef, {
      readBooks: arrayRemove(bookId),
      updatedAt: new Date()
    });
    
    return { 
      success: true,
      message: 'Kniha bola odobraná z prečítaných'
    };
  } catch (error) {
    console.error("Chyba pri odstraňovaní knihy:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Získanie všetkých prečítaných kníh používateľa
export const getUserReadBooks = async (userId) => {
  try {
    const userData = await getUserData(userId);
    
    if (userData.success) {
      return {
        success: true,
        readBooks: userData.data.readBooks || []
      };
    }
    
    return {
      success: false,
      readBooks: []
    };
  } catch (error) {
    console.error("Chyba pri získavaní prečítaných kníh:", error);
    return {
      success: false,
      readBooks: [],
      error: error.message
    };
  }
};

// Prepnutie stavu knihy (prečítaná/neprečítaná)
export const toggleBookReadStatus = async (userId, bookId, isCurrentlyRead) => {
  if (isCurrentlyRead) {
    return await unmarkBookAsRead(userId, bookId);
  } else {
    return await markBookAsRead(userId, bookId);
  }
};

// ==================== ADMIN FUNKCIE ====================

// Pridanie novej knihy (len admin)
export const addBook = async (bookData) => {
  try {
    console.log(' Pridávam novú knihu:', bookData);
    
    const booksCollection = collection(db, 'books');
    const booksSnapshot = await getDocs(booksCollection);
    
    let maxId = 0;
    booksSnapshot.forEach(doc => {
      const book = doc.data();
      if (book.id > maxId) {
        maxId = book.id;
      }
    });
    
    const newId = maxId + 1;
    
    const bookDocRef = doc(db, 'books', `book_${newId}`);
    await setDoc(bookDocRef, {
      ...bookData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(' Kniha úspešne pridaná s ID:', newId);
    return {
      success: true,
      bookId: newId,
      message: 'Kniha bola úspešne pridaná'
    };
  } catch (error) {
    console.error(' Chyba pri pridávaní knihy:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Aktualizácia existujúcej knihy (len admin)
export const updateBook = async (bookId, bookData) => {
  try {
    console.log('✏️ Aktualizujem knihu:', bookId);
    
    const bookDocRef = doc(db, 'books', `book_${bookId}`);
    await updateDoc(bookDocRef, {
      ...bookData,
      updatedAt: new Date()
    });
    
    console.log(' Kniha úspešne aktualizovaná');
    return {
      success: true,
      message: 'Kniha bola úspešne aktualizovaná'
    };
  } catch (error) {
    console.error(' Chyba pri aktualizácii knihy:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Zmazanie knihy (len admin)
export const deleteBook = async (bookId) => {
  try {
    console.log('🗑️ Mažem knihu:', bookId);
    
    const bookDocRef = doc(db, 'books', `book_${bookId}`);
    await deleteDoc(bookDocRef);
    
    console.log(' Kniha úspešne zmazaná');
    return {
      success: true,
      message: 'Kniha bola úspešne zmazaná'
    };
  } catch (error) {
    console.error(' Chyba pri mazaní knihy:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Získanie všetkých kníh z Firestore
export const getAllBooks = async () => {
  try {
    console.log(' Načítavam všetky knihy z Firestore');
    
    const booksCollection = collection(db, 'books');
    const booksSnapshot = await getDocs(booksCollection);
    
    const books = [];
    booksSnapshot.forEach(doc => {
      books.push(doc.data());
    });
    
    console.log(` Načítaných ${books.length} kníh`);
    return {
      success: true,
      books: books
    };
  } catch (error) {
    console.error(' Chyba pri načítaní kníh:', error);
    return {
      success: false,
      books: [],
      error: error.message
    };
  }
};

export const addToWishlist = async (userId, bookId) => {
  try {
    console.log(' Pridávam knihu do wishlistu:', { userId, bookId });
    const userDocRef = doc(db, 'users', userId);
    
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log(' Vytváram nový dokument používateľa');
      await setDoc(userDocRef, {
        wishlist: [bookId],
        readBooks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      await updateDoc(userDocRef, {
        wishlist: arrayUnion(bookId),
        updatedAt: new Date()
      });
    }
    
    console.log(' Kniha úspešne pridaná do wishlistu');
    return { 
      success: true,
      message: 'Kniha bola pridaná do wishlistu'
    };
  } catch (error) {
    console.error(" Chyba pri pridávaní knihy do wishlistu:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Odobranie knihy z wishlistu
export const removeFromWishlist = async (userId, bookId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await updateDoc(userDocRef, {
      wishlist: arrayRemove(bookId),
      updatedAt: new Date()
    });
    
    return { 
      success: true,
      message: 'Kniha bola odobraná z wishlistu'
    };
  } catch (error) {
    console.error("Chyba pri odstraňovaní knihy z wishlistu:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Prepnutie stavu wishlistu (pridať/odobrať)
export const toggleWishlist = async (userId, bookId, isInWishlist) => {
  if (isInWishlist) {
    return await removeFromWishlist(userId, bookId);
  } else {
    return await addToWishlist(userId, bookId);
  }
};