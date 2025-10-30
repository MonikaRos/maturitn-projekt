
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile, getUserData } from './firestore';

// Registrácia nového používateľa
export const registerUser = async (email, password, displayName) => {
  try {
    // Vytvorenie používateľa
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Aktualizácia mena používateľa
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Vytvorenie profilu v Firestore
    await createUserProfile(user.uid, {
      email: user.email,
      displayName: displayName
    });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        readBooks: []
      }
    };
  } catch (error) {
    console.error("Chyba pri registrácii:", error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Prihlásenie používateľa
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Načítanie dát z Firestore
    const userData = await getUserData(user.uid);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        readBooks: userData.success ? (userData.data.readBooks || []) : []
      }
    };
  } catch (error) {
    console.error("Chyba pri prihlásení:", error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Odhlásenie používateľa
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Chyba pri odhlásení:", error);
    return {
      success: false,
      error: "Nepodarilo sa odhlásiť"
    };
  }
};

// Sledovanie stavu prihlásenia
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('👤 Používateľ prihlásený:', user.email);
      
      // Načítanie dát používateľa z Firestore
      const userData = await getUserData(user.uid);
      
      console.log('📊 Dáta používateľa:', userData);
      
      // Používateľ je prihlásený
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Používateľ',
        readBooks: userData.success ? (userData.data.readBooks || []) : []
      });
    } else {
      console.log('🚪 Používateľ odhlásený');
      // Používateľ nie je prihlásený
      callback(null);
    }
  });
};

// Pomocná funkcia na preklad chybových hlášok
function getErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'Tento email je už zaregistrovaný',
    'auth/invalid-email': 'Neplatný email',
    'auth/operation-not-allowed': 'Operácia nie je povolená',
    'auth/weak-password': 'Heslo je príliš slabé (minimálne 6 znakov)',
    'auth/user-disabled': 'Tento účet bol zablokovaný',
    'auth/user-not-found': 'Používateľ s týmto emailom neexistuje',
    'auth/wrong-password': 'Nesprávne heslo',
    'auth/invalid-credential': 'Nesprávny email alebo heslo',
    'auth/too-many-requests': 'Príliš mnoho pokusov. Skúste neskôr',
  };
  
  return errorMessages[errorCode] || 'Nastala neočakávaná chyba';
}