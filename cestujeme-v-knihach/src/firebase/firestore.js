
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';

// Získanie používateľských dát z databázy
export const getUserData = async (userId) => {
  try {
    console.log('📥 Načítavam dáta pre používateľa:', userId);
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('✅ Dáta načítané:', data);
      return {
        success: true,
        data: data
      };
    } else {
      console.log('⚠️ Používateľ nemá žiadne dáta v databáze');
      return {
        success: true,
        data: {
          readBooks: [],
          createdAt: new Date()
        }
      };
    }
  } catch (error) {
    console.error("❌ Chyba pri načítaní dát používateľa:", error);
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
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true }); // merge: true znamená, že ak dokument existuje, len sa aktualizuje
    
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
    const userDocRef = doc(db, 'users', userId);
    
    // arrayUnion pridá hodnotu do array, ale len ak tam ešte nie je
    await updateDoc(userDocRef, {
      readBooks: arrayUnion(bookId),
      updatedAt: new Date()
    });
    
    return { 
      success: true,
      message: 'Kniha bola označená ako prečítaná'
    };
  } catch (error) {
    console.error("Chyba pri označovaní knihy:", error);
    
    // Ak používateľ ešte nemá dokument, vytvoríme ho
    if (error.code === 'not-found') {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        readBooks: [bookId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { 
        success: true,
        message: 'Kniha bola označená ako prečítaná'
      };
    }
    
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
    
    // arrayRemove odstráni hodnotu z array
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