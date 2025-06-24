import { db } from '../config/index.js';
import { getUserProfile, updateUserProfile } from './users.js';

/**
 * Mute a user (stops notifications from them)
 * @param {string} targetUserId - User to mute
 * @param {string} currentUserId - User doing the muting
 * @returns {Promise<void>}
 */
export const muteUser = async (targetUserId, currentUserId) => {
  try {
    if (targetUserId === currentUserId) {
      throw new Error('You cannot mute yourself');
    }

    const userProfile = await getUserProfile(currentUserId);
    const mutedUsers = userProfile.mutedUsers || [];
    
    if (mutedUsers.includes(targetUserId)) {
      throw new Error('User is already muted');
    }
    
    await updateUserProfile(currentUserId, {
      mutedUsers: [...mutedUsers, targetUserId]
    });
    
    console.log('[Moderation API] User muted:', targetUserId);
  } catch (error) {
    console.error('[Moderation API] Error muting user:', error);
    throw error;
  }
};

/**
 * Unmute a user
 * @param {string} targetUserId - User to unmute
 * @param {string} currentUserId - User doing the unmuting
 * @returns {Promise<void>}
 */
export const unmuteUser = async (targetUserId, currentUserId) => {
  try {
    const userProfile = await getUserProfile(currentUserId);
    const mutedUsers = userProfile.mutedUsers || [];
    
    const updatedMutedUsers = mutedUsers.filter(uid => uid !== targetUserId);
    
    await updateUserProfile(currentUserId, {
      mutedUsers: updatedMutedUsers
    });
    
    console.log('[Moderation API] User unmuted:', targetUserId);
  } catch (error) {
    console.error('[Moderation API] Error unmuting user:', error);
    throw error;
  }
};

/**
 * Block a user (complete access restriction)
 * @param {string} targetUserId - User to block
 * @param {string} currentUserId - User doing the blocking
 * @returns {Promise<void>}
 */
export const blockUser = async (targetUserId, currentUserId) => {
  try {
    if (targetUserId === currentUserId) {
      throw new Error('You cannot block yourself');
    }

    // Get both user profiles
    const [userProfile, targetProfile] = await Promise.all([
      getUserProfile(currentUserId),
      getUserProfile(targetUserId)
    ]);
    
    const blockedUsers = userProfile.blockedUsers || [];
    const targetBlockedByUsers = targetProfile.blockedByUsers || [];
    
    if (blockedUsers.includes(targetUserId)) {
      throw new Error('User is already blocked');
    }
    
    // Remove from friends if they are friends
    const friendIds = userProfile.friendIds || [];
    const targetFriendIds = targetProfile.friendIds || [];
    const updatedFriendIds = friendIds.filter(uid => uid !== targetUserId);
    const updatedTargetFriendIds = targetFriendIds.filter(uid => uid !== currentUserId);
    
    // Remove from muted list (blocking is stronger than muting)
    const mutedUsers = userProfile.mutedUsers || [];
    const updatedMutedUsers = mutedUsers.filter(uid => uid !== targetUserId);
    
    // Update current user: add to blocked list, remove from friends and muted
    await updateUserProfile(currentUserId, {
      blockedUsers: [...blockedUsers, targetUserId],
      friendIds: updatedFriendIds,
      mutedUsers: updatedMutedUsers
    });
    
    // Update target user: add current user to blockedByUsers, remove from friends
    await updateUserProfile(targetUserId, {
      blockedByUsers: [...targetBlockedByUsers, currentUserId],
      friendIds: updatedTargetFriendIds
    });
    
    console.log('[Moderation API] User blocked:', targetUserId);
  } catch (error) {
    console.error('[Moderation API] Error blocking user:', error);
    throw error;
  }
};

/**
 * Unblock a user
 * @param {string} targetUserId - User to unblock
 * @param {string} currentUserId - User doing the unblocking
 * @returns {Promise<void>}
 */
export const unblockUser = async (targetUserId, currentUserId) => {
  try {
    // Get both user profiles
    const [userProfile, targetProfile] = await Promise.all([
      getUserProfile(currentUserId),
      getUserProfile(targetUserId)
    ]);
    
    const blockedUsers = userProfile.blockedUsers || [];
    const targetBlockedByUsers = targetProfile.blockedByUsers || [];
    
    const updatedBlockedUsers = blockedUsers.filter(uid => uid !== targetUserId);
    const updatedTargetBlockedByUsers = targetBlockedByUsers.filter(uid => uid !== currentUserId);
    
    // Update both users
    await Promise.all([
      updateUserProfile(currentUserId, {
        blockedUsers: updatedBlockedUsers
      }),
      updateUserProfile(targetUserId, {
        blockedByUsers: updatedTargetBlockedByUsers
      })
    ]);
    
    console.log('[Moderation API] User unblocked:', targetUserId);
  } catch (error) {
    console.error('[Moderation API] Error unblocking user:', error);
    throw error;
  }
};

/**
 * Report a user for inappropriate behavior
 * @param {string} targetUserId - User to report
 * @param {string} currentUserId - User making the report
 * @param {string} reason - Reason for report
 * @param {string} description - Additional description
 * @returns {Promise<string>} - Report ID
 */
export const reportUser = async (targetUserId, currentUserId, reason, description = '') => {
  try {
    if (targetUserId === currentUserId) {
      throw new Error('You cannot report yourself');
    }

    // Check if user has already reported this user
    const existingReportQuery = await db.collection('reports')
      .where('reporterUid', '==', currentUserId)
      .where('reportedUid', '==', targetUserId)
      .get();
    
    if (!existingReportQuery.empty) {
      throw new Error('You have already reported this user');
    }
    
    const report = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporterUid: currentUserId,
      reportedUid: targetUserId,
      reason,
      description,
      createdAt: new Date(),
      status: 'pending',
      moderatorNotes: ''
    };
    
    const docRef = await db.collection('reports').add(report);
    console.log('[Moderation API] Report created:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('[Moderation API] Error reporting user:', error);
    throw error;
  }
};

/**
 * Get moderation status between two users
 * @param {string} targetUserId - The user being checked
 * @param {string} currentUserId - The current user
 * @returns {Promise<Object>} - Moderation status object
 */
export const getModerationStatus = async (targetUserId, currentUserId) => {
  try {
    const [userProfile, targetProfile] = await Promise.all([
      getUserProfile(currentUserId),
      getUserProfile(targetUserId)
    ]);
    
    const isMuted = (userProfile.mutedUsers || []).includes(targetUserId);
    const isBlocked = (userProfile.blockedUsers || []).includes(targetUserId);
    const isBlockedBy = (targetProfile.blockedUsers || []).includes(currentUserId);
    
    // Check if user has reported the target
    const reportQuery = await db.collection('reports')
      .where('reporterUid', '==', currentUserId)
      .where('reportedUid', '==', targetUserId)
      .get();
    
    const hasReported = !reportQuery.empty;
    
    return {
      isMuted,
      isBlocked,
      isBlockedBy,
      hasReported,
      canInteract: !isBlocked && !isBlockedBy
    };
  } catch (error) {
    console.error('[Moderation API] Error getting moderation status:', error);
    throw error;
  }
};

/**
 * Get all reports for moderation review (admin function)
 * @param {string} status - Filter by status ('pending', 'reviewed', 'resolved')
 * @returns {Promise<Array>} - Array of reports
 */
export const getReports = async (status = 'pending') => {
  try {
    const snapshot = await db.collection('reports')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();
    
    const reports = [];
    snapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return reports;
  } catch (error) {
    console.error('[Moderation API] Error getting reports:', error);
    throw error;
  }
};

/**
 * Update report status (admin function)
 * @param {string} reportId - Report ID
 * @param {string} status - New status
 * @param {string} moderatorNotes - Notes from moderator
 * @returns {Promise<void>}
 */
export const updateReportStatus = async (reportId, status, moderatorNotes = '') => {
  try {
    await db.collection('reports').doc(reportId).update({
      status,
      moderatorNotes,
      reviewedAt: new Date()
    });
    
    console.log('[Moderation API] Report updated:', reportId);
  } catch (error) {
    console.error('[Moderation API] Error updating report:', error);
    throw error;
  }
};

/**
 * Check if users can interact (not blocked by each other)
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} - Whether users can interact
 */
export const canUsersInteract = async (userId1, userId2) => {
  try {
    const [user1Profile, user2Profile] = await Promise.all([
      getUserProfile(userId1),
      getUserProfile(userId2)
    ]);
    
    const user1Blocked = (user1Profile.blockedUsers || []).includes(userId2);
    const user2Blocked = (user2Profile.blockedUsers || []).includes(userId1);
    
    return !user1Blocked && !user2Blocked;
  } catch (error) {
    console.error('[Moderation API] Error checking user interaction:', error);
    return false;
  }
};

/**
 * Filter content based on moderation status
 * @param {Array} contentArray - Array of content (posts, messages, etc.)
 * @param {string} currentUserId - Current user ID
 * @param {string} authorUidField - Field name for author UID (default: 'authorUid')
 * @returns {Promise<Array>} - Filtered content array
 */
export const filterModerationContent = async (contentArray, currentUserId, authorUidField = 'authorUid') => {
  try {
    if (!contentArray || contentArray.length === 0) {
      return contentArray;
    }
    
    const userProfile = await getUserProfile(currentUserId);
    const blockedUsers = userProfile.blockedUsers || [];
    const mutedUsers = userProfile.mutedUsers || [];
    
    return contentArray.filter(item => {
      const authorUid = item[authorUidField];
      
      // Filter out blocked users completely
      if (blockedUsers.includes(authorUid)) {
        return false;
      }
      
      // Mark muted users (don't filter, just flag)
      if (mutedUsers.includes(authorUid)) {
        item._isMuted = true;
      }
      
      return true;
    });
  } catch (error) {
    console.error('[Moderation API] Error filtering content:', error);
    return contentArray; // Return original array on error
  }
}; 