import { db, serverTimestamp } from '../config';
import { addFriend } from './users';

/**
 * Send a friend request
 * @param {string} fromUid - Sender's user ID
 * @param {string} toUid - Recipient's user ID
 * @returns {string} Friend request ID
 */
export const sendFriendRequest = async (fromUid, toUid) => {
  try {
    // Check if request already exists
    const existingRequest = await db
      .collection('friendRequests')
      .where('fromUid', '==', fromUid)
      .where('toUid', '==', toUid)
      .get();

    if (!existingRequest.empty) {
      throw new Error('Friend request already sent');
    }

    // Check if reverse request exists
    const reverseRequest = await db
      .collection('friendRequests')
      .where('fromUid', '==', toUid)
      .where('toUid', '==', fromUid)
      .get();

    if (!reverseRequest.empty) {
      throw new Error('This user already sent you a friend request');
    }

    // Create new friend request
    const requestData = {
      fromUid,
      toUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const docRef = await db.collection('friendRequests').add(requestData);
    console.log('[API] Friend request sent:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('[API] Error sending friend request:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 * @param {string} requestId - Friend request ID
 * @param {string} currentUserId - Current user ID (must be the recipient)
 */
export const acceptFriendRequest = async (requestId, currentUserId) => {
  try {
    // Get the request
    const requestDoc = await db.collection('friendRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error('Friend request not found');
    }

    const requestData = requestDoc.data();
    
    // Verify the current user is the recipient
    if (requestData.toUid !== currentUserId) {
      throw new Error('Unauthorized to accept this request');
    }

    // Update request status
    await db.collection('friendRequests').doc(requestId).update({
      status: 'accepted',
      respondedAt: serverTimestamp(),
    });

    // Add each user to the other's friend list
    await addFriend(requestData.fromUid, requestData.toUid);
    await addFriend(requestData.toUid, requestData.fromUid);

    console.log('[API] Friend request accepted:', requestId);
  } catch (error) {
    console.error('[API] Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Reject a friend request
 * @param {string} requestId - Friend request ID
 * @param {string} currentUserId - Current user ID (must be the recipient)
 */
export const rejectFriendRequest = async (requestId, currentUserId) => {
  try {
    // Get the request
    const requestDoc = await db.collection('friendRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error('Friend request not found');
    }

    const requestData = requestDoc.data();
    
    // Verify the current user is the recipient
    if (requestData.toUid !== currentUserId) {
      throw new Error('Unauthorized to reject this request');
    }

    // Update request status
    await db.collection('friendRequests').doc(requestId).update({
      status: 'rejected',
      respondedAt: serverTimestamp(),
    });

    console.log('[API] Friend request rejected:', requestId);
  } catch (error) {
    console.error('[API] Error rejecting friend request:', error);
    throw error;
  }
};

/**
 * Cancel a sent friend request
 * @param {string} requestId - Friend request ID
 * @param {string} currentUserId - Current user ID (must be the sender)
 */
export const cancelFriendRequest = async (requestId, currentUserId) => {
  try {
    // Get the request
    const requestDoc = await db.collection('friendRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error('Friend request not found');
    }

    const requestData = requestDoc.data();
    
    // Verify the current user is the sender
    if (requestData.fromUid !== currentUserId) {
      throw new Error('Unauthorized to cancel this request');
    }

    // Delete the request
    await db.collection('friendRequests').doc(requestId).delete();

    console.log('[API] Friend request cancelled:', requestId);
  } catch (error) {
    console.error('[API] Error cancelling friend request:', error);
    throw error;
  }
};

/**
 * Get pending friend requests for a user
 * @param {string} userId - User ID
 * @returns {array} Array of friend requests with user data
 */
export const getPendingFriendRequests = async (userId) => {
  try {
    const snapshot = await db
      .collection('friendRequests')
      .where('toUid', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const requests = [];
    for (const doc of snapshot.docs) {
      const requestData = doc.data();
      
      // Get sender's user data
      const senderDoc = await db.collection('users').doc(requestData.fromUid).get();
      const senderData = senderDoc.exists ? senderDoc.data() : null;
      
      requests.push({
        id: doc.id,
        ...requestData,
        fromUser: senderData ? { id: requestData.fromUid, ...senderData } : null,
      });
    }

    return requests;
  } catch (error) {
    console.error('[API] Error getting pending friend requests:', error);
    throw error;
  }
};

/**
 * Get sent friend requests by a user
 * @param {string} userId - User ID
 * @returns {array} Array of sent friend requests
 */
export const getSentFriendRequests = async (userId) => {
  try {
    const snapshot = await db
      .collection('friendRequests')
      .where('fromUid', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const requests = [];
    for (const doc of snapshot.docs) {
      const requestData = doc.data();
      
      // Get recipient's user data
      const recipientDoc = await db.collection('users').doc(requestData.toUid).get();
      const recipientData = recipientDoc.exists ? recipientDoc.data() : null;
      
      requests.push({
        id: doc.id,
        ...requestData,
        toUser: recipientData ? { id: requestData.toUid, ...recipientData } : null,
      });
    }

    return requests;
  } catch (error) {
    console.error('[API] Error getting sent friend requests:', error);
    throw error;
  }
};

/**
 * Check friend request status between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {object} Status object { isFriend, hasPendingRequest, requestId, requestDirection }
 */
export const checkFriendStatus = async (userId1, userId2) => {
  try {
    // Check if they're already friends
    const userDoc = await db.collection('users').doc(userId1).get();
    const userData = userDoc.data();
    const isFriend = userData?.friendIds?.includes(userId2) || false;

    if (isFriend) {
      return { isFriend: true, hasPendingRequest: false };
    }

    // Check for pending requests in both directions
    const sentRequest = await db
      .collection('friendRequests')
      .where('fromUid', '==', userId1)
      .where('toUid', '==', userId2)
      .where('status', '==', 'pending')
      .get();

    if (!sentRequest.empty) {
      return {
        isFriend: false,
        hasPendingRequest: true,
        requestId: sentRequest.docs[0].id,
        requestDirection: 'sent',
      };
    }

    const receivedRequest = await db
      .collection('friendRequests')
      .where('fromUid', '==', userId2)
      .where('toUid', '==', userId1)
      .where('status', '==', 'pending')
      .get();

    if (!receivedRequest.empty) {
      return {
        isFriend: false,
        hasPendingRequest: true,
        requestId: receivedRequest.docs[0].id,
        requestDirection: 'received',
      };
    }

    return { isFriend: false, hasPendingRequest: false };
  } catch (error) {
    console.error('[API] Error checking friend status:', error);
    throw error;
  }
};

/**
 * Get friend suggestions based on mutual friends
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of suggestions
 * @returns {array} Array of suggested users
 */
export const getFriendSuggestions = async (userId, limit = 10) => {
  try {
    // Get current user's friends
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userFriends = userData?.friendIds || [];

    if (userFriends.length === 0) {
      // If user has no friends, return random users
      const allUsersSnapshot = await db.collection('users').get();
      const suggestions = [];
      
      allUsersSnapshot.forEach((doc) => {
        if (doc.id !== userId) {
          suggestions.push({ id: doc.id, ...doc.data(), mutualFriends: [] });
        }
      });
      
      return suggestions.slice(0, limit);
    }

    // Get friends of friends
    const friendsOfFriends = new Map();
    
    for (const friendId of userFriends) {
      const friendDoc = await db.collection('users').doc(friendId).get();
      const friendData = friendDoc.data();
      const friendFriends = friendData?.friendIds || [];
      
      for (const fofId of friendFriends) {
        // Skip if it's the current user or already a friend
        if (fofId === userId || userFriends.includes(fofId)) {
          continue;
        }
        
        // Track mutual friends
        if (!friendsOfFriends.has(fofId)) {
          friendsOfFriends.set(fofId, []);
        }
        friendsOfFriends.get(fofId).push(friendId);
      }
    }

    // Convert to array and sort by mutual friend count
    const suggestions = [];
    for (const [fofId, mutualFriends] of friendsOfFriends.entries()) {
      const fofDoc = await db.collection('users').doc(fofId).get();
      if (fofDoc.exists) {
        suggestions.push({
          id: fofId,
          ...fofDoc.data(),
          mutualFriends,
          mutualFriendCount: mutualFriends.length,
        });
      }
    }

    // Sort by mutual friend count (descending)
    suggestions.sort((a, b) => b.mutualFriendCount - a.mutualFriendCount);

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('[API] Error getting friend suggestions:', error);
    throw error;
  }
}; 