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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, {
      displayName: displayName
    });
    
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
        readBooks: [],
        wishlist: [] 
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
    
    const userData = await getUserData(user.uid);
    
    console.log(' Prihlásenie úspešné, načítané dáta:', userData);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        readBooks: userData.success ? (userData.data.readBooks || []) : [],
        wishlist: userData.success ? (userData.data.wishlist || []) : [], // PRIDANÉ
        isAdmin: userData.success ? (userData.data.isAdmin || false) : false
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
      console.log(' Používateľ prihlásený:', user.email);
      
      const userData = await getUserData(user.uid);
      
      console.log('Dáta používateľa:', userData);
      
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Používateľ',
        readBooks: userData.success ? (userData.data.readBooks || []) : [],
        wishlist: userData.success ? (userData.data.wishlist || []) : [], 
        isAdmin: userData.success ? (userData.data.isAdmin || false) : false
      });
    } else {
      console.log(' Používateľ odhlásený');
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