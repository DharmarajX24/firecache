import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getFunctions,
  Functions,
  connectFunctionsEmulator,
} from 'firebase/functions';

let auth: Auth;
let db: Firestore;
let functions: Functions;

export default boot(async () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  functions = getFunctions(firebaseApp);

  if (import.meta.env.DEV) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
});

export { auth, db, functions };
