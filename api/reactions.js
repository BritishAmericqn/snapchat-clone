import { db } from '../config/index.js';

/**
 * Add a reaction to a post or story
 * @param {string} targetId - The post or story ID
 * @param {string} emoji - The emoji reaction
 * @param {string} userId - The user adding the reaction
 * @param {string} targetType - 'post' or 'story'
 * @returns {Promise<string>} - The reaction ID
 */
export const addReactionToPost = async (targetId, emoji, userId, targetType = 'post') => {
  try {
    // Check if user already has this exact reaction on this target
    const existingReactionQuery = await db.collection('reactions')
      .where('targetId', '==', targetId)
      .where('senderUid', '==', userId)
      .where('emoji', '==', emoji)
      .get();
    
    if (!existingReactionQuery.empty) {
      throw new Error('You have already reacted with this emoji');
    }
    
    // Create new reaction
    const reaction = {
      reactionId: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderUid: userId,
      targetType,
      targetId,
      emoji,
      createdAt: new Date(),
    };
    
    const docRef = await db.collection('reactions').add(reaction);
    console.log('[Reactions API] Added reaction:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('[Reactions API] Error adding reaction:', error);
    throw error;
  }
};

/**
 * Remove a reaction from a post or story
 * @param {string} targetId - The post or story ID
 * @param {string} reactionId - The reaction ID to remove
 * @param {string} userId - The user removing the reaction
 * @returns {Promise<void>}
 */
export const removeReactionFromPost = async (targetId, reactionId, userId) => {
  try {
    const reactionRef = db.collection('reactions').doc(reactionId);
    const reactionDoc = await reactionRef.get();
    
    if (!reactionDoc.exists) {
      throw new Error('Reaction not found');
    }
    
    const reaction = reactionDoc.data();
    
    // Verify user owns this reaction
    if (reaction.senderUid !== userId) {
      throw new Error('You can only remove your own reactions');
    }
    
    await reactionRef.delete();
    console.log('[Reactions API] Removed reaction:', reactionId);
  } catch (error) {
    console.error('[Reactions API] Error removing reaction:', error);
    throw error;
  }
};

/**
 * Get all reactions for a post or story
 * @param {string} targetId - The post or story ID
 * @returns {Promise<Object>} - Grouped reactions by emoji with counts and reactors
 */
export const getPostReactions = async (targetId) => {
  try {
    const snapshot = await db.collection('reactions')
      .where('targetId', '==', targetId)
      .get();
    
    const reactions = [];
    snapshot.forEach((doc) => {
      reactions.push({ id: doc.id, ...doc.data() });
    });
    
    // Group reactions by emoji
    const groupedReactions = {};
    reactions.forEach((reaction) => {
      const { emoji, senderUid, createdAt } = reaction;
      
      if (!groupedReactions[emoji]) {
        groupedReactions[emoji] = {
          emoji,
          count: 0,
          reactors: [],
          recentReactors: []
        };
      }
      
      groupedReactions[emoji].count++;
      groupedReactions[emoji].reactors.push({
        userId: senderUid,
        reactionId: reaction.id,
        createdAt
      });
    });
    
    // Sort reactors by creation date and get recent ones
    Object.keys(groupedReactions).forEach((emoji) => {
      const reactionGroup = groupedReactions[emoji];
      reactionGroup.reactors.sort((a, b) => b.createdAt - a.createdAt);
      reactionGroup.recentReactors = reactionGroup.reactors.slice(0, 3);
    });
    
    return groupedReactions;
  } catch (error) {
    console.error('[Reactions API] Error getting reactions:', error);
    throw error;
  }
};

/**
 * Get user's reaction to a specific post/story
 * @param {string} targetId - The post or story ID
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of user's reactions to this target
 */
export const getUserReactionToPost = async (targetId, userId) => {
  try {
    const snapshot = await db.collection('reactions')
      .where('targetId', '==', targetId)
      .where('senderUid', '==', userId)
      .get();
    
    const userReactions = [];
    snapshot.forEach((doc) => {
      userReactions.push({ id: doc.id, ...doc.data() });
    });
    
    return userReactions;
  } catch (error) {
    console.error('[Reactions API] Error getting user reaction:', error);
    throw error;
  }
};

/**
 * Toggle a reaction (add if not present, remove if present)
 * @param {string} targetId - The post or story ID
 * @param {string} emoji - The emoji reaction
 * @param {string} userId - The user toggling the reaction
 * @param {string} targetType - 'post' or 'story'
 * @returns {Promise<Object>} - { action: 'added' | 'removed', reactionId: string }
 */
export const toggleReaction = async (targetId, emoji, userId, targetType = 'post') => {
  try {
    // Check if user already has this reaction
    const existingReactions = await getUserReactionToPost(targetId, userId);
    const existingReaction = existingReactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      // Remove existing reaction
      await removeReactionFromPost(targetId, existingReaction.id, userId);
      return { action: 'removed', reactionId: existingReaction.id };
    } else {
      // Add new reaction
      const reactionId = await addReactionToPost(targetId, emoji, userId, targetType);
      return { action: 'added', reactionId };
    }
  } catch (error) {
    console.error('[Reactions API] Error toggling reaction:', error);
    throw error;
  }
};

/**
 * Get reaction counts for multiple posts (for feed optimization)
 * @param {Array<string>} targetIds - Array of post/story IDs
 * @returns {Promise<Object>} - Object with targetId as key and reaction summary as value
 */
export const getBulkReactionCounts = async (targetIds) => {
  try {
    const reactionCounts = {};
    
    // Initialize all targets with empty counts
    targetIds.forEach(targetId => {
      reactionCounts[targetId] = { totalCount: 0, topEmojis: [] };
    });
    
    // Get all reactions for these targets
    const snapshot = await db.collection('reactions')
      .where('targetId', 'in', targetIds)
      .get();
    
    const reactions = [];
    snapshot.forEach(doc => {
      reactions.push({ id: doc.id, ...doc.data() });
    });
    
    // Group by target and emoji
    reactions.forEach(reaction => {
      const { targetId, emoji } = reaction;
      
      if (!reactionCounts[targetId].emojiCounts) {
        reactionCounts[targetId].emojiCounts = {};
      }
      
      if (!reactionCounts[targetId].emojiCounts[emoji]) {
        reactionCounts[targetId].emojiCounts[emoji] = 0;
      }
      
      reactionCounts[targetId].emojiCounts[emoji]++;
      reactionCounts[targetId].totalCount++;
    });
    
    // Get top emojis for each target
    Object.keys(reactionCounts).forEach(targetId => {
      const emojiCounts = reactionCounts[targetId].emojiCounts || {};
      const sortedEmojis = Object.entries(emojiCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emoji, count]) => ({ emoji, count }));
      
      reactionCounts[targetId].topEmojis = sortedEmojis;
    });
    
    return reactionCounts;
  } catch (error) {
    console.error('[Reactions API] Error getting bulk reaction counts:', error);
    throw error;
  }
}; 