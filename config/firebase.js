import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcOB96SdHL4tUXrsVm9V9DzNfyKvkRXzg",
  authDomain: "seconddegree-c9bdf.firebaseapp.com",
  projectId: "seconddegree-c9bdf",
  storageBucket: "seconddegree-c9bdf.firebasestorage.app",
  messagingSenderId: "586297618211",
  appId: "1:586297618211:web:fdd4f9acc45fa95e1ea696"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services using the web SDK approach (works with Expo Go)
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase initialized successfully');

export { auth, db, storage };
