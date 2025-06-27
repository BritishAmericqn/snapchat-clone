import { Images } from "./images";
import { Colors, Gradients } from "./theme";
import { RAG_CONFIG, getOpenAIClient, getPineconeClient, getRagIndex } from "./rag";

// Using mock Firebase for ALL builds temporarily (Phase 7 camera testing)
import { auth, db, storage } from "./firebase-mock";
// import { auth, db, storage } from "./firebase";

// Temporary: Using mock Firebase so we can test Phase 7 camera features
// This allows the app to run without Firebase setup issues

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

export { Images, Colors, Gradients, auth, db, storage, RAG_CONFIG, getOpenAIClient, getPineconeClient, getRagIndex };
