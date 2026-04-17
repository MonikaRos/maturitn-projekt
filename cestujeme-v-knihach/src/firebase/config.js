import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPF_O3l6zKzh_fENb5g61qqCj7qSpPYmg",
  authDomain: "cestujeme-v-knihach.firebaseapp.com",
  projectId: "cestujeme-v-knihach",
  storageBucket: "cestujeme-v-knihach.firebasestorage.app",
  messagingSenderId: "60637376067",
  appId: "1:60637376067:web:e4a9ea67ed397a8c6a2ef6"

};

// Inicializácia Firebase
const app = initializeApp(firebaseConfig);

// Inicializácia služieb
export const auth = getAuth(app); 
export const db = getFirestore(app);

export default app;