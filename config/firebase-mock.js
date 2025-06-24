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
      friendIds: ['user_sarah', 'user_mike', 'user_emma', 'user_john'],  // Added friends to see their posts
      mutedUsers: [], // Phase 5: User moderation
      blockedUsers: [], // Phase 5: User moderation
      blockedByUsers: [], // Phase 5: User moderation
      createdAt: new Date(),
      metadata: { // Phase 5: RAG preparation
        aiPreferences: {
          enableAIFeatures: true,
          shareMetadata: true,
          personalizeContent: true
        }
      }
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
  // Reactions collection for emoji reactions
  reactions: {
    'reaction_sarah_heart': {
      reactionId: 'reaction_sarah_heart',
      senderUid: 'user_sarah',
      targetType: 'post',
      targetId: 'post_john_1',
      emoji: '❤️',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    'reaction_mike_fire': {
      reactionId: 'reaction_mike_fire',
      senderUid: 'user_mike',
      targetType: 'post',
      targetId: 'post_john_1',
      emoji: '🔥',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    }
  },
  // Reports collection for user moderation
  reports: {},
  posts: {
    'post_sarah_1': {
      postId: 'post_sarah_1',
      authorUid: 'user_sarah',
      mediaUrl: 'https://picsum.photos/400/600?random=sarah1',
      mediaType: 'image',
      caption: 'Beautiful sunset at the beach! 🌅',
      visibility: 'friends',
      viewCount: 3,
      expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
      deleteOnView: false,
      viewedBy: ['user_mike', 'user_emma', 'user_john'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      metadata: {},
    },
    'post_mike_1': {
      postId: 'post_mike_1',
      authorUid: 'user_mike',
      mediaUrl: 'https://picsum.photos/400/600?random=mike1',
      mediaType: 'image',
      caption: 'Check out this view! This snap will disappear after you see it 👻',
      visibility: 'friends',
      viewCount: 1,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      deleteOnView: true,
      viewedBy: ['user_sarah'],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      metadata: {},
    },
    'post_emma_1': {
      postId: 'post_emma_1',
      authorUid: 'user_emma',
      mediaUrl: 'https://picsum.photos/400/600?random=emma1',
      mediaType: 'image',
      caption: 'Coffee time ☕',
      visibility: 'friendsOfFriends',
      viewCount: 5,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      deleteOnView: false,
      viewedBy: ['user_sarah', 'user_mike', 'user_john', 'user_alex', 'user_lisa'],
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      metadata: {},
    },
    'post_john_1': {
      postId: 'post_john_1',
      authorUid: 'user_john',
      mediaUrl: 'https://picsum.photos/400/600?random=john1',
      mediaType: 'image',
      caption: 'Weekend vibes 🎉',
      visibility: 'public',
      viewCount: 8,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
      deleteOnView: false,
      viewedBy: ['user_sarah', 'user_mike', 'user_emma', 'user_alex', 'user_lisa', 'user_david', 'user_sophie', 'user_chris'],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      metadata: {},
    },
    'post_alex_1': {
      postId: 'post_alex_1',
      authorUid: 'user_alex',
      mediaUrl: 'https://picsum.photos/400/600?random=alex1',
      mediaType: 'image',
      caption: 'Hiking adventures 🏔️',
      visibility: 'friends',
      viewCount: 2,
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      deleteOnView: false,
      viewedBy: ['user_lisa', 'user_david'],
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      metadata: {},
    },
    'post_lisa_1': {
      postId: 'post_lisa_1',
      authorUid: 'user_lisa',
      mediaUrl: 'https://picsum.photos/400/600?random=lisa1',
      mediaType: 'image',
      caption: 'Art gallery visit 🎨 (disappears after viewing!)',
      visibility: 'friends',
      viewCount: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      deleteOnView: true,
      viewedBy: [],
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      metadata: {},
    },
  },
  chats: {
    // Pre-populated test chats
    'chat_test_sarah': {
      chatId: 'chat_test_sarah',
      participants: ['12345', 'user_sarah'], // test user and sarah
      lastMessage: {
        text: 'Hey! How are you doing? 👋',
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        senderUid: 'user_sarah'
      },
      lastActivity: new Date(Date.now() - 60 * 60 * 1000),
      unreadCount: {
        '12345': 1,
        'user_sarah': 0
      }
    },
    'chat_test_mike': {
      chatId: 'chat_test_mike',
      participants: ['12345', 'user_mike'],
      lastMessage: {
        text: 'Check out this disappearing photo!',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        senderUid: 'user_mike'
      },
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: {
        '12345': 0,
        'user_mike': 0
      }
    },
    'chat_test_emma': {
      chatId: 'chat_test_emma',
      participants: ['12345', 'user_emma'],
      lastMessage: {
        text: 'See you at the coffee shop! ☕',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        senderUid: '12345'
      },
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: {
        '12345': 0,
        'user_emma': 0
      }
    },
  },
  messages: {
    // Test messages for chat_test_sarah
    'msg_sarah_1': {
      messageId: 'msg_sarah_1',
      chatId: 'chat_test_sarah',
      senderUid: 'user_sarah',
      text: 'Hey! How are you doing? 👋',
      mediaUrl: null,
      mediaType: null,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours from now
      viewedBy: [],
      deleteOnView: false,
      status: 'delivered',
      metadata: {}
    },
    // Test messages for chat_test_mike
    'msg_mike_1': {
      messageId: 'msg_mike_1',
      chatId: 'chat_test_mike',
      senderUid: 'user_mike',
      text: 'Check out this disappearing photo!',
      mediaUrl: 'https://picsum.photos/400/600?random=msg1',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
      viewedBy: ['12345'],
      deleteOnView: true,
      status: 'read',
      metadata: {}
    },
    'msg_mike_2': {
      messageId: 'msg_mike_2',
      chatId: 'chat_test_mike',
      senderUid: '12345',
      text: 'That looks amazing! 🤩',
      mediaUrl: null,
      mediaType: null,
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      viewedBy: ['user_mike'],
      deleteOnView: false,
      status: 'read',
      metadata: {}
    },
    // Test messages for chat_test_emma
    'msg_emma_1': {
      messageId: 'msg_emma_1',
      chatId: 'chat_test_emma',
      senderUid: 'user_emma',
      text: 'Want to grab coffee later?',
      mediaUrl: null,
      mediaType: null,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      viewedBy: ['12345'],
      deleteOnView: false,
      status: 'read',
      metadata: {}
    },
    'msg_emma_2': {
      messageId: 'msg_emma_2',
      chatId: 'chat_test_emma',
      senderUid: '12345',
      text: 'See you at the coffee shop! ☕',
      mediaUrl: null,
      mediaType: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
      viewedBy: ['user_emma'],
      deleteOnView: false,
      status: 'read',
      metadata: {}
    },
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

// Mock Storage data storage
const mockStorageData = {};

// Mock Storage implementation
const mockStorage = {
  ref: (path) => {
    console.log('[MockStorage] ref called with path:', path);
    
    return {
      // Upload a file (base64 string for mock)
      putString: (data, format = 'base64') => {
        console.log('[MockStorage] putString called for path:', path);
        
        return {
          // Mock upload task
          on: (event, progressCallback, errorCallback, successCallback) => {
            console.log('[MockStorage] Upload task started');
            
            // Simulate upload progress
            setTimeout(() => progressCallback && progressCallback({ bytesTransferred: 50, totalBytes: 100 }), 100);
            setTimeout(() => progressCallback && progressCallback({ bytesTransferred: 100, totalBytes: 100 }), 200);
            
            // Simulate upload completion
            setTimeout(() => {
              mockStorageData[path] = { data, format, uploadedAt: new Date() };
              console.log('[MockStorage] Upload completed for:', path);
              successCallback && successCallback();
            }, 300);
            
            // Return unsubscribe function
            return () => {
              console.log('[MockStorage] Upload task unsubscribed');
            };
          },
          
          // Promise-based upload
          then: (resolve, reject) => {
            setTimeout(() => {
              mockStorageData[path] = { data, format, uploadedAt: new Date() };
              console.log('[MockStorage] Upload completed for:', path);
              resolve({
                ref: mockStorage.ref(path),
                metadata: { contentType: 'image/jpeg' },
              });
            }, 300);
          },
        };
      },
      
      // Upload file (for image picker result)
      put: (file) => {
        console.log('[MockStorage] put called for path:', path);
        console.log('[MockStorage] File object:', { 
          type: typeof file, 
          hasUri: !!(file && file.uri),
          isString: typeof file === 'string',
          isBlob: !!(file && typeof file === 'object' && file.constructor && file.constructor.name === 'Blob')
        });
        
        // For mock, we'll store the file URI
        return new Promise((resolve) => {
          setTimeout(() => {
            // Handle different file formats
            let fileUri = '';
            
            if (typeof file === 'string') {
              // Direct string URI (from messages.js for file:// and content://)
              fileUri = file;
              console.log('[MockStorage] String URI received:', fileUri.substring(0, 50) + '...');
            } else if (file && typeof file === 'object' && file.constructor && file.constructor.name === 'Blob') {
              // Blob (from HTTP URLs)
              console.log('[MockStorage] Blob detected, generating placeholder');
              const randomId = Math.floor(Math.random() * 1000);
              fileUri = `https://picsum.photos/400/600?random=${randomId}`;
            } else if (file && file.uri) {
              // Image picker result object
              fileUri = file.uri;
              console.log('[MockStorage] Image picker object, URI:', fileUri.substring(0, 50) + '...');
            } else {
              // Unknown format
              console.error('[MockStorage] Unknown file format:', file);
              // Use placeholder instead of [object Object]
              const randomId = Math.floor(Math.random() * 1000);
              fileUri = `https://picsum.photos/400/600?random=${randomId}`;
            }
            
            mockStorageData[path] = { 
              uri: fileUri, 
              uploadedAt: new Date(),
              type: 'file'
            };
            console.log('[MockStorage] File stored with URI:', fileUri);
            resolve({
              ref: mockStorage.ref(path),
              metadata: { contentType: 'image/jpeg' },
            });
          }, 300);
        });
      },
      
      // Get download URL
      getDownloadURL: () => {
        console.log('[MockStorage] getDownloadURL called for path:', path);
        
        return new Promise((resolve, reject) => {
          const fileData = mockStorageData[path];
          if (fileData) {
            // For mock, return the original URI or a placeholder image
            let url = fileData.uri || fileData.data;
            
            // Handle expo-image-picker result object
            if (url && typeof url === 'object' && url.uri) {
              url = url.uri;
            }
            
            // Convert to string if needed
            if (url && typeof url !== 'string') {
              url = String(url);
            }
            
            // If it's base64, prepend the data URI scheme
            if (fileData.format === 'base64' && fileData.data && typeof fileData.data === 'string') {
              url = `data:image/jpeg;base64,${fileData.data}`;
            }
            
            // FIXED: Only use placeholder for truly invalid URIs
            // Trust URIs from expo-image-picker (file://, content://, data:, http:, https:)
            if (!url || typeof url !== 'string' || url.length === 0) {
              // Use a random placeholder image only when there's no valid URI
              const randomId = Math.floor(Math.random() * 1000);
              url = `https://picsum.photos/400/600?random=${randomId}`;
              console.log('[MockStorage] No valid URI found, using placeholder');
            } else {
              console.log('[MockStorage] Returning original URI');
            }
            
            console.log('[MockStorage] Returning download URL:', url);
            resolve(url);
          } else {
            reject(new Error('File not found'));
          }
        });
      },
      
      // Delete file
      delete: () => {
        console.log('[MockStorage] delete called for path:', path);
        
        return new Promise((resolve) => {
          delete mockStorageData[path];
          console.log('[MockStorage] File deleted:', path);
          resolve();
        });
      },
      
      // Get metadata
      getMetadata: () => {
        console.log('[MockStorage] getMetadata called for path:', path);
        
        return new Promise((resolve, reject) => {
          const fileData = mockStorageData[path];
          if (fileData) {
            resolve({
              contentType: 'image/jpeg',
              size: 1024 * 1024, // Mock 1MB
              timeCreated: fileData.uploadedAt,
              updated: fileData.uploadedAt,
            });
          } else {
            reject(new Error('File not found'));
          }
        });
      },
    };
  },
  
  // Helper to get stored data (for testing)
  _getStoredData: () => mockStorageData,
  
  // Helper to clear all data
  _clearAll: () => {
    Object.keys(mockStorageData).forEach(key => delete mockStorageData[key]);
    console.log('[MockStorage] All storage data cleared');
  },
};

// Storage exports
export const storage = mockStorage;
export const ref = (storage, path) => storage.ref(path);
export const uploadString = (storageRef, data, format) => storageRef.putString(data, format);
export const uploadBytes = (storageRef, data) => storageRef.put(data);
export const getDownloadURL = (storageRef) => storageRef.getDownloadURL();
export const deleteObject = (storageRef) => storageRef.delete();

console.log('[MockAuth] Mock Firebase initialized'); 