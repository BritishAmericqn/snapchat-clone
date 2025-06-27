import { db, firestore } from '../config';

/**
 * Create or update user profile in Firestore
 * @param {string} uid - User ID
 * @param {object} userData - User data to save
 */
export const createUserProfile = async (uid, userData) => {
  try {
    await db.collection('users').doc(uid).set(userData, { merge: true });
    console.log('[API] User profile created/updated:', uid);
  } catch (error) {
    console.error('[API] Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile by ID
 * @param {string} uid - User ID
 * @returns {object} User profile data
 */
export const getUserProfile = async (uid) => {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('[API] Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {object} updates - Fields to update
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    await db.collection('users').doc(uid).update(updates);
    console.log('[API] User profile updated:', uid);
    
    // 🎯 CRITICAL FIX: Clear recommendation cache when profile is updated
    // This ensures AI recommendations reflect the updated bio/profile
    if (updates.bio !== undefined || updates.username !== undefined || updates.displayName !== undefined) {
      console.log('[API] 🔄 Profile content changed, clearing recommendation cache for user:', uid);
      try {
        const { clearRecommendationCache } = require('./embeddings');
        clearRecommendationCache();
        console.log('[API] ✅ Recommendation cache cleared successfully');
      } catch (cacheError) {
        console.error('[API] ⚠️ Failed to clear recommendation cache:', cacheError);
        // Don't fail the profile update if cache clearing fails
      }
    }
  } catch (error) {
    console.error('[API] Error updating user profile:', error);
    throw error;
  }
};

/**
 * Search users by username (case-insensitive)
 * @param {string} searchQuery - Search query
 * @param {string} currentUserId - Current user ID to exclude from results
 * @returns {array} Array of user profiles
 */
export const searchUsers = async (searchQuery, currentUserId) => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    // In a real app, you'd use a lowercase field for case-insensitive search
    // For mock, we'll do client-side filtering
    const snapshot = await db.collection('users').get();
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      // Case-insensitive search on username and displayName
      if (
        doc.id !== currentUserId &&
        (userData.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         userData.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        users.push({ id: doc.id, ...userData });
      }
    });
    
    return users;
  } catch (error) {
    console.error('[API] Error searching users:', error);
    throw error;
  }
};

/**
 * Get multiple users by IDs
 * @param {array} userIds - Array of user IDs
 * @returns {array} Array of user profiles
 */
export const getUsersByIds = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const users = await Promise.all(
      userIds.map(async (uid) => {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
        return null;
      })
    );

    return users.filter(user => user !== null);
  } catch (error) {
    console.error('[API] Error getting users by IDs:', error);
    throw error;
  }
};

/**
 * Add friend to user's friend list
 * @param {string} userId - User ID
 * @param {string} friendId - Friend's user ID
 */
export const addFriend = async (userId, friendId) => {
  try {
    // In mock, we need to handle arrayUnion manually
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentFriends = userData?.friendIds || [];
    
    console.log('[API] addFriend - Before:', {
      userId,
      friendId,
      currentFriends,
      alreadyFriend: currentFriends.includes(friendId)
    });
    
    if (!currentFriends.includes(friendId)) {
      const newFriends = [...currentFriends, friendId];
      await db.collection('users').doc(userId).update({
        friendIds: newFriends
      });
      console.log('[API] addFriend - After update:', {
        userId,
        newFriends
      });
    } else {
      console.log('[API] addFriend - Already friends, skipping');
    }
    
    console.log('[API] Friend added:', friendId, 'to user:', userId);
  } catch (error) {
    console.error('[API] Error adding friend:', error);
    throw error;
  }
};

/**
 * Remove friend from user's friend list
 * @param {string} userId - User ID
 * @param {string} friendId - Friend's user ID
 */
export const removeFriend = async (userId, friendId) => {
  try {
    // In mock, we need to handle arrayRemove manually
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentFriends = userData?.friendIds || [];
    
    await db.collection('users').doc(userId).update({
      friendIds: currentFriends.filter(id => id !== friendId)
    });
    
    console.log('[API] Friend removed:', friendId, 'from user:', userId);
  } catch (error) {
    console.error('[API] Error removing friend:', error);
    throw error;
  }
}; 