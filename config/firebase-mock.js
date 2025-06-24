// Mock Firebase for testing in Expo Go
// This allows you to test your app without Firebase errors

// Store auth state change listeners
const authStateListeners = [];

// Store created users (in memory only, resets on app reload)
const mockUsers = {
  'test@example.com': { email: 'test@example.com', password: 'test123', uid: '12345' },
  'john@example.com': { email: 'john@example.com', password: 'john123', uid: 'user_john' },
  'sarah@example.com': { email: 'sarah@example.com', password: 'sarah123', uid: 'user_sarah' },
  'mike@example.com': { email: 'mike@example.com', password: 'mike123', uid: 'user_mike' },
  'emma@example.com': { email: 'emma@example.com', password: 'emma123', uid: 'user_emma' },
  'alex@example.com': { email: 'alex@example.com', password: 'alex123', uid: 'user_alex' },
  'lisa@example.com': { email: 'lisa@example.com', password: 'lisa123', uid: 'user_lisa' },
  'david@example.com': { email: 'david@example.com', password: 'david123', uid: 'user_david' },
  'sophie@example.com': { email: 'sophie@example.com', password: 'sophie123', uid: 'user_sophie' },
  'chris@example.com': { email: 'chris@example.com', password: 'chris123', uid: 'user_chris' }
};

// Mock Firestore data storage
const mockFirestoreData = {
  users: {
    '12345': {
      uid: '12345',
      email: 'test@example.com',
      username: 'test',
      displayName: 'Test User',
      bio: 'This is a test account',
      profilePhotoUrl: '',
      friendIds: [],
      createdAt: new Date(),
    },
    'user_john': {
      uid: 'user_john',
      email: 'john@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      bio: '📸 Photography enthusiast | 🌍 Travel lover',
      profilePhotoUrl: '',
      friendIds: ['user_sarah', 'user_mike', 'user_emma'],
      createdAt: new Date(),
    },
    'user_sarah': {
      uid: 'user_sarah',
      email: 'sarah@example.com',
      username: 'sarahsmith',
      displayName: 'Sarah Smith',
      bio: '🎨 Artist | 🎵 Music is life | Coffee addict ☕',
      profilePhotoUrl: '',
      friendIds: ['user_john', 'user_emma', 'user_alex'],
      createdAt: new Date(),
    },
    'user_mike': {
      uid: 'user_mike',
      email: 'mike@example.com',
      username: 'mikethedev',
      displayName: 'Mike Johnson',
      bio: '💻 Full-stack developer | 🎮 Gamer | Tech enthusiast',
      profilePhotoUrl: '',
      friendIds: ['user_john', 'user_david'],
      createdAt: new Date(),
    },
    'user_emma': {
      uid: 'user_emma',
      email: 'emma@example.com',
      username: 'emmawilson',
      displayName: 'Emma Wilson',
      bio: '📚 Bookworm | ✈️ Wanderlust | 🧘‍♀️ Yoga lover',
      profilePhotoUrl: '',
      friendIds: ['user_john', 'user_sarah', 'user_lisa'],
      createdAt: new Date(),
    },
    'user_alex': {
      uid: 'user_alex',
      email: 'alex@example.com',
      username: 'alexcool',
      displayName: 'Alex Chen',
      bio: '🏀 Basketball player | 🍕 Pizza connoisseur',
      profilePhotoUrl: '',
      friendIds: ['user_sarah', 'user_lisa', 'user_chris'],
      createdAt: new Date(),
    },
    'user_lisa': {
      uid: 'user_lisa',
      email: 'lisa@example.com',
      username: 'lisagreen',
      displayName: 'Lisa Green',
      bio: '🌱 Plant mom | 🍳 Cooking enthusiast | Dog lover 🐕',
      profilePhotoUrl: '',
      friendIds: ['user_emma', 'user_alex', 'user_sophie'],
      createdAt: new Date(),
    },
    'user_david': {
      uid: 'user_david',
      email: 'david@example.com',
      username: 'davidbrown',
      displayName: 'David Brown',
      bio: '🚴‍♂️ Cyclist | 🏔️ Mountain lover | Adventure seeker',
      profilePhotoUrl: '',
      friendIds: ['user_mike', 'user_chris'],
      createdAt: new Date(),
    },
    'user_sophie': {
      uid: 'user_sophie',
      email: 'sophie@example.com',
      username: 'sophiemarie',
      displayName: 'Sophie Martin',
      bio: '🎭 Theater geek | 🍰 Baker | Living my best life ✨',
      profilePhotoUrl: '',
      friendIds: ['user_lisa', 'user_chris'],
      createdAt: new Date(),
    },
    'user_chris': {
      uid: 'user_chris',
      email: 'chris@example.com',
      username: 'chrisrocker',
      displayName: 'Chris Taylor',
      bio: '🎸 Musician | 🎤 Singer | Rock n Roll 🤘',
      profilePhotoUrl: '',
      friendIds: ['user_alex', 'user_david', 'user_sophie'],
      createdAt: new Date(),
    }
  },
  friendRequests: {
    'request_mike_to_test': {
      fromUid: 'user_mike',
      toUid: '12345',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
    },
    'request_lisa_to_test': {
      fromUid: 'user_lisa',
      toUid: '12345',
      status: 'pending',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
    },
    'request_david_to_test': {
      fromUid: 'user_david',
      toUid: '12345',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
    'request_sophie_to_test': {
      fromUid: 'user_sophie',
      toUid: '12345',
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    },
    'request_chris_to_test': {
      fromUid: 'user_chris',
      toUid: '12345',
      status: 'pending',
      createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    }
  },
  // Add more collections as needed
};

// Store Firestore listeners
const firestoreListeners = {
  collections: {}, // collection listeners
  documents: {}    // document listeners
};

const mockAuth = {
  currentUser: null,
  
  // Helper to notify all listeners of auth state change
  _notifyAuthStateChanged: (user) => {
    console.log('[MockAuth] Notifying auth state changed to', authStateListeners.length, 'listeners with user:', user);
    authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('[MockAuth] Error in auth state callback:', error);
      }
    });
  },
  
  // Mock signInWithEmailAndPassword
  signInWithEmailAndPassword: (email, password) => {
    console.log('[MockAuth] signInWithEmailAndPassword called with:', email, password);
    return new Promise((resolve, reject) => {
      // Check if user exists and password matches
      const storedUser = mockUsers[email];
      if (storedUser && storedUser.password === password) {
        const user = { email: storedUser.email, uid: storedUser.uid };
        mockAuth.currentUser = user;
        console.log('[MockAuth] Login successful:', user);
        // Notify listeners of auth state change
        setTimeout(() => mockAuth._notifyAuthStateChanged(user), 100);
        resolve({ user });
      } else {
        console.log('[MockAuth] Login failed: Invalid credentials');
        reject(new Error('Invalid email or password'));
      }
    });
  },
  
  // Mock createUserWithEmailAndPassword  
  createUserWithEmailAndPassword: (email, password) => {
    console.log('[MockAuth] createUserWithEmailAndPassword called with:', email, password);
    return new Promise((resolve, reject) => {
      if (email && password.length >= 6) {
        // Check if user already exists
        if (mockUsers[email]) {
          console.log('[MockAuth] Signup failed: User already exists');
          reject(new Error('User already exists with this email'));
          return;
        }
        
        // Create new user
        const uid = Date.now().toString();
        const user = { email, uid };
        
        // Store user with password for future login
        mockUsers[email] = { email, password, uid };
        
        // Also create user profile in Firestore
        mockFirestoreData.users[uid] = {
          uid,
          email,
          username: email.split('@')[0],
          displayName: '',
          bio: '',
          profilePhotoUrl: '',
          friendIds: [],
          createdAt: new Date(),
        };
        
        mockAuth.currentUser = user;
        console.log('[MockAuth] Signup successful:', user);
        console.log('[MockAuth] Total users:', Object.keys(mockUsers).length);
        
        // Notify listeners of auth state change
        setTimeout(() => mockAuth._notifyAuthStateChanged(user), 100);
        resolve({ user });
      } else {
        console.log('[MockAuth] Signup failed: Invalid input');
        reject(new Error('Email required and password must be at least 6 characters'));
      }
    });
  },
  
  // Mock signOut
  signOut: () => {
    console.log('[MockAuth] signOut called');
    return new Promise((resolve) => {
      mockAuth.currentUser = null;
      console.log('[MockAuth] User signed out');
      // Notify listeners of auth state change
      setTimeout(() => mockAuth._notifyAuthStateChanged(null), 100);
      resolve();
    });
  },
  
  // Mock sendPasswordResetEmail
  sendPasswordResetEmail: (email) => {
    console.log('[MockAuth] sendPasswordResetEmail called with:', email);
    return new Promise((resolve, reject) => {
      if (email) {
        console.log('[MockAuth] Password reset email sent to:', email);
        resolve();
      } else {
        reject(new Error('Email required'));
      }
    });
  },
  
  // Mock onAuthStateChanged
  onAuthStateChanged: (callback) => {
    console.log('[MockAuth] onAuthStateChanged listener registered');
    // Add callback to listeners array
    authStateListeners.push(callback);
    
    // Call callback immediately with current user
    setTimeout(() => {
      console.log('[MockAuth] Calling initial auth state callback with user:', mockAuth.currentUser);
      callback(mockAuth.currentUser);
    }, 100);
    
    // Return unsubscribe function
    return () => {
      console.log('[MockAuth] onAuthStateChanged listener unsubscribed');
      const index = authStateListeners.indexOf(callback);
      if (index > -1) {
        authStateListeners.splice(index, 1);
      }
    };
  }
};

// Mock Firestore
const mockFirestore = {
  // Helper to notify collection listeners
  _notifyCollectionListeners: (collectionPath) => {
    const listeners = firestoreListeners.collections[collectionPath] || [];
    const data = mockFirestoreData[collectionPath] || {};
    const docs = Object.entries(data).map(([id, docData]) => ({
      id,
      data: () => docData,
      exists: true,
    }));
    
    const querySnapshot = {
      docs,
      size: docs.length,
      empty: docs.length === 0,
      forEach: (callback) => docs.forEach(callback),
    };
    
    listeners.forEach(({ callback }) => {
      try {
        callback(querySnapshot);
      } catch (error) {
        console.error('[MockFirestore] Error in collection listener:', error);
      }
    });
  },
  
  // Helper to notify document listeners
  _notifyDocumentListeners: (collectionPath, docId) => {
    const docPath = `${collectionPath}/${docId}`;
    const listeners = firestoreListeners.documents[docPath] || [];
    const docData = mockFirestoreData[collectionPath]?.[docId];
    
    const documentSnapshot = {
      id: docId,
      exists: !!docData,
      data: () => docData,
      get: (field) => {
        if (!docData) return undefined;
        return field.split('.').reduce((obj, key) => obj?.[key], docData);
      },
    };
    
    listeners.forEach(({ callback }) => {
      try {
        callback(documentSnapshot);
      } catch (error) {
        console.error('[MockFirestore] Error in document listener:', error);
      }
    });
  },
  
  collection: (collectionPath) => {
    console.log('[MockFirestore] collection called with:', collectionPath);
    
    return {
      // Add a document with auto-generated ID
      add: (data) => {
        return new Promise((resolve) => {
          const id = Date.now().toString();
          if (!mockFirestoreData[collectionPath]) {
            mockFirestoreData[collectionPath] = {};
          }
          mockFirestoreData[collectionPath][id] = { ...data, _id: id };
          console.log('[MockFirestore] Document added to', collectionPath, 'with ID:', id);
          
          // Notify listeners
          setTimeout(() => mockFirestore._notifyCollectionListeners(collectionPath), 100);
          
          resolve({ id });
        });
      },
      
      // Get all documents in collection
      get: () => {
        return new Promise((resolve) => {
          const data = mockFirestoreData[collectionPath] || {};
          const docs = Object.entries(data).map(([id, docData]) => ({
            id,
            data: () => docData,
            exists: true,
          }));
          
          const querySnapshot = {
            docs,
            size: docs.length,
            empty: docs.length === 0,
            forEach: (callback) => docs.forEach(callback),
          };
          
          console.log('[MockFirestore] Got collection', collectionPath, 'with', docs.length, 'documents');
          resolve(querySnapshot);
        });
      },
      
      // Query with where clause
      where: (field, operator, value) => {
        console.log('[MockFirestore] where called:', field, operator, value);
        
        // Create a query object that can chain multiple where clauses
        const query = {
          _conditions: [{ field, operator, value }],
          
          // Allow chaining more where clauses
          where: function(field2, operator2, value2) {
            console.log('[MockFirestore] chained where called:', field2, operator2, value2);
            this._conditions.push({ field: field2, operator: operator2, value: value2 });
            return this;
          },
          
          get: function() {
            return new Promise((resolve) => {
              const data = mockFirestoreData[collectionPath] || {};
              const docs = Object.entries(data)
                .filter(([id, docData]) => {
                  // Check all conditions
                  return this._conditions.every(condition => {
                    const fieldValue = condition.field.split('.').reduce((obj, key) => obj?.[key], docData);
                    
                    switch (condition.operator) {
                      case '==':
                        return fieldValue === condition.value;
                      case '!=':
                        return fieldValue !== condition.value;
                      case '>':
                        return fieldValue > condition.value;
                      case '>=':
                        return fieldValue >= condition.value;
                      case '<':
                        return fieldValue < condition.value;
                      case '<=':
                        return fieldValue <= condition.value;
                      case 'in':
                        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
                      case 'array-contains':
                        return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
                      default:
                        console.warn('[MockFirestore] Unsupported operator:', condition.operator);
                        return false;
                    }
                  });
                })
                .map(([id, docData]) => ({
                  id,
                  data: () => docData,
                  exists: true,
                }));
              
              const querySnapshot = {
                docs,
                size: docs.length,
                empty: docs.length === 0,
                forEach: (callback) => docs.forEach(callback),
              };
              
              console.log('[MockFirestore] Query returned', docs.length, 'documents');
              resolve(querySnapshot);
            });
          },
          
          onSnapshot: function(callback, errorCallback) {
            console.log('[MockFirestore] where().onSnapshot registered');
            const conditions = this._conditions;
            const listenerId = Date.now().toString();
            
            if (!firestoreListeners.collections[collectionPath]) {
              firestoreListeners.collections[collectionPath] = [];
            }
            
            const listener = {
              id: listenerId,
              callback: (querySnapshot) => {
                // Apply all where filters
                const filteredDocs = querySnapshot.docs.filter((doc) => {
                  const docData = doc.data();
                  return conditions.every(condition => {
                    const fieldValue = condition.field.split('.').reduce((obj, key) => obj?.[key], docData);
                    
                    switch (condition.operator) {
                      case '==':
                        return fieldValue === condition.value;
                      case '!=':
                        return fieldValue !== condition.value;
                      case '>':
                        return fieldValue > condition.value;
                      case '>=':
                        return fieldValue >= condition.value;
                      case '<':
                        return fieldValue < condition.value;
                      case '<=':
                        return fieldValue <= condition.value;
                      case 'in':
                        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
                      case 'array-contains':
                        return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
                      default:
                        return false;
                    }
                  });
                });
                
                const filteredSnapshot = {
                  docs: filteredDocs,
                  size: filteredDocs.length,
                  empty: filteredDocs.length === 0,
                  forEach: (cb) => filteredDocs.forEach(cb),
                  docChanges: () => [], // Simplified for mock
                };
                
                callback(filteredSnapshot);
              },
              errorCallback,
            };
            
            firestoreListeners.collections[collectionPath].push(listener);
            
            // Call immediately with current data
            setTimeout(() => mockFirestore._notifyCollectionListeners(collectionPath), 100);
            
            // Return unsubscribe function
            return () => {
              const index = firestoreListeners.collections[collectionPath].findIndex(l => l.id === listenerId);
              if (index > -1) {
                firestoreListeners.collections[collectionPath].splice(index, 1);
              }
            };
          },
        };
        
        return query;
      },
      
      // Listen to collection changes
      onSnapshot: (callback, errorCallback) => {
        console.log('[MockFirestore] collection.onSnapshot registered for:', collectionPath);
        const listenerId = Date.now().toString();
        
        if (!firestoreListeners.collections[collectionPath]) {
          firestoreListeners.collections[collectionPath] = [];
        }
        
        firestoreListeners.collections[collectionPath].push({
          id: listenerId,
          callback,
          errorCallback,
        });
        
        // Call immediately with current data
        setTimeout(() => mockFirestore._notifyCollectionListeners(collectionPath), 100);
        
        // Return unsubscribe function
        return () => {
          const index = firestoreListeners.collections[collectionPath].findIndex(l => l.id === listenerId);
          if (index > -1) {
            firestoreListeners.collections[collectionPath].splice(index, 1);
          }
        };
      },
      
      // Reference a specific document
      doc: (docId) => {
        console.log('[MockFirestore] doc called with:', docId);
        
        return {
          // Get document
          get: () => {
            return new Promise((resolve) => {
              const docData = mockFirestoreData[collectionPath]?.[docId];
              const documentSnapshot = {
                id: docId,
                exists: !!docData,
                data: () => docData,
                get: (field) => {
                  if (!docData) return undefined;
                  return field.split('.').reduce((obj, key) => obj?.[key], docData);
                },
              };
              
              console.log('[MockFirestore] Got document:', collectionPath, '/', docId, 'exists:', !!docData);
              resolve(documentSnapshot);
            });
          },
          
          // Set document (replace)
          set: (data, options = {}) => {
            return new Promise((resolve) => {
              if (!mockFirestoreData[collectionPath]) {
                mockFirestoreData[collectionPath] = {};
              }
              
              if (options.merge) {
                // Merge with existing data
                mockFirestoreData[collectionPath][docId] = {
                  ...(mockFirestoreData[collectionPath][docId] || {}),
                  ...data,
                };
              } else {
                // Replace entirely
                mockFirestoreData[collectionPath][docId] = data;
              }
              
              console.log('[MockFirestore] Document set:', collectionPath, '/', docId);
              
              // Notify listeners
              setTimeout(() => {
                mockFirestore._notifyDocumentListeners(collectionPath, docId);
                mockFirestore._notifyCollectionListeners(collectionPath);
              }, 100);
              
              resolve();
            });
          },
          
          // Update document (partial update)
          update: (data) => {
            return new Promise((resolve, reject) => {
              const existingData = mockFirestoreData[collectionPath]?.[docId];
              if (!existingData) {
                reject(new Error('Document does not exist'));
                return;
              }
              
              // Handle dot notation updates
              const updatedData = { ...existingData };
              Object.entries(data).forEach(([key, value]) => {
                if (key.includes('.')) {
                  // Handle nested updates
                  const keys = key.split('.');
                  let obj = updatedData;
                  for (let i = 0; i < keys.length - 1; i++) {
                    if (!obj[keys[i]]) obj[keys[i]] = {};
                    obj = obj[keys[i]];
                  }
                  obj[keys[keys.length - 1]] = value;
                } else {
                  updatedData[key] = value;
                }
              });
              
              mockFirestoreData[collectionPath][docId] = updatedData;
              console.log('[MockFirestore] Document updated:', collectionPath, '/', docId);
              
              // Notify listeners
              setTimeout(() => {
                mockFirestore._notifyDocumentListeners(collectionPath, docId);
                mockFirestore._notifyCollectionListeners(collectionPath);
              }, 100);
              
              resolve();
            });
          },
          
          // Delete document
          delete: () => {
            return new Promise((resolve) => {
              if (mockFirestoreData[collectionPath]) {
                delete mockFirestoreData[collectionPath][docId];
              }
              console.log('[MockFirestore] Document deleted:', collectionPath, '/', docId);
              
              // Notify listeners
              setTimeout(() => {
                mockFirestore._notifyDocumentListeners(collectionPath, docId);
                mockFirestore._notifyCollectionListeners(collectionPath);
              }, 100);
              
              resolve();
            });
          },
          
          // Listen to document changes
          onSnapshot: (callback, errorCallback) => {
            console.log('[MockFirestore] doc.onSnapshot registered for:', collectionPath, '/', docId);
            const docPath = `${collectionPath}/${docId}`;
            const listenerId = Date.now().toString();
            
            if (!firestoreListeners.documents[docPath]) {
              firestoreListeners.documents[docPath] = [];
            }
            
            firestoreListeners.documents[docPath].push({
              id: listenerId,
              callback,
              errorCallback,
            });
            
            // Call immediately with current data
            setTimeout(() => mockFirestore._notifyDocumentListeners(collectionPath, docId), 100);
            
            // Return unsubscribe function
            return () => {
              const index = firestoreListeners.documents[docPath].findIndex(l => l.id === listenerId);
              if (index > -1) {
                firestoreListeners.documents[docPath].splice(index, 1);
              }
            };
          },
        };
      },
    };
  },
  
  // Field value helpers
  FieldValue: {
    serverTimestamp: () => new Date(),
    arrayUnion: (...values) => ({ _operation: 'arrayUnion', values }),
    arrayRemove: (...values) => ({ _operation: 'arrayRemove', values }),
    delete: () => ({ _operation: 'delete' }),
  },
};

// Export functions that match Firebase API
export const auth = mockAuth;
export const signInWithEmailAndPassword = (auth, email, password) => {
  console.log('[MockAuth Export] signInWithEmailAndPassword wrapper called');
  return mockAuth.signInWithEmailAndPassword(email, password);
};
export const createUserWithEmailAndPassword = (auth, email, password) => {
  console.log('[MockAuth Export] createUserWithEmailAndPassword wrapper called');
  return mockAuth.createUserWithEmailAndPassword(email, password);
};
export const signOut = (auth) => {
  console.log('[MockAuth Export] signOut wrapper called');
  return mockAuth.signOut();
};
export const sendPasswordResetEmail = (auth, email) => {
  console.log('[MockAuth Export] sendPasswordResetEmail wrapper called');
  return mockAuth.sendPasswordResetEmail(email);
};
export const onAuthStateChanged = (auth, callback) => {
  console.log('[MockAuth Export] onAuthStateChanged wrapper called');
  return mockAuth.onAuthStateChanged(callback);
};

// Mock Firestore exports
export const db = mockFirestore;
export const firestore = () => mockFirestore;

// Export Firestore field value helpers
export const arrayUnion = mockFirestore.FieldValue.arrayUnion;
export const arrayRemove = mockFirestore.FieldValue.arrayRemove;
export const serverTimestamp = mockFirestore.FieldValue.serverTimestamp;
export const deleteField = mockFirestore.FieldValue.delete;

// Mock Storage  
export const storage = {};

console.log('[MockAuth] Mock Firebase initialized'); 