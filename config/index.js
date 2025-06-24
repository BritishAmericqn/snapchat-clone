import { Images } from "./images";
import { Colors } from "./theme";

// Using mock Firebase for Expo Go development (Phase 0 & 1)
import { auth, db, storage } from "./firebase-mock";
// import { auth, db, storage } from "./firebase";

// To use REAL Firebase (requires development build):
// 1. Comment out the mock import above
// 2. Uncomment the real Firebase import
// 3. Run: npx expo run:ios (or run:android)

// Re-export all auth functions from mock
export { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  // Firestore exports
  firestore,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteField,
  // Storage exports
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from './firebase-mock';

export { Images, Colors, auth, db, storage };
