import { db, storage, ref, uploadBytes, getDownloadURL, deleteObject, serverTimestamp } from '../config';

/**
 * Create a new post
 * @param {string} authorUid - The user ID of the post author
 * @param {Object} postData - Post data including media, caption, visibility, etc.
 * @returns {Promise<string>} - The created post ID
 */
export const createPost = async (authorUid, postData) => {
  try {
    const {
      mediaUri,
      mediaType = 'image',
      caption = '',
      visibility = 'friends', // 'friends' | 'friendsOfFriends' | 'public'
      expiresIn = 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      deleteOnView = false,
    } = postData;

    // Upload media to storage
    const mediaPath = `posts/${authorUid}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storageRef = ref(storage, mediaPath);
    
    // For mock, we'll store the URI directly
    // In production, this would be a proper file upload
    const uploadResult = await uploadBytes(storageRef, { uri: mediaUri, type: `${mediaType}/jpeg` });
    const mediaUrl = await getDownloadURL(uploadResult.ref);

    // Create post document
    const post = {
      postId: Date.now().toString(),
      authorUid,
      mediaUrl,
      mediaType,
      caption,
      visibility,
      viewCount: 0,
      expiresAt: new Date(Date.now() + expiresIn),
      deleteOnView,
      viewedBy: [],
      createdAt: serverTimestamp(),
      metadata: {
        storagePath: mediaPath,
      },
    };

    const docRef = await db.collection('posts').add(post);
    console.log('[Posts API] Created post:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('[Posts API] Error creating post:', error);
    throw error;
  }
};

/**
 * Get posts for feed (from friends and based on visibility)
 * @param {string} userId - Current user ID
 * @param {Array<string>} friendIds - List of friend IDs
 * @returns {Promise<Array>} - Array of posts
 */
export const getFeedPosts = async (userId, friendIds = []) => {
  try {
    const now = new Date();
    
    // Get all posts (in production, this would be optimized with proper queries)
    const snapshot = await db.collection('posts').get();
    const allPosts = [];
    
    snapshot.forEach((doc) => {
      const post = { id: doc.id, ...doc.data() };
      
      // Filter posts based on visibility and expiration
      const expiresAt = post.expiresAt?.toDate ? post.expiresAt.toDate() : post.expiresAt;
      const isExpired = expiresAt && new Date(expiresAt) < now;
      const isAuthor = post.authorUid === userId;
      const isFriend = friendIds.includes(post.authorUid);
      
      // Check visibility rules
      let isVisible = false;
      if (isAuthor) {
        isVisible = true;
      } else if (post.visibility === 'public') {
        isVisible = true;
      } else if (post.visibility === 'friends' && isFriend) {
        isVisible = true;
      } else if (post.visibility === 'friendsOfFriends' && isFriend) {
        // TODO: Check friends of friends
        isVisible = true;
      }
      
      if (isVisible && !isExpired) {
        allPosts.push(post);
      }
    });
    
    // Sort by creation date (newest first)
    allPosts.sort((a, b) => b.createdAt - a.createdAt);
    
    return allPosts;
  } catch (error) {
    console.error('[Posts API] Error getting feed posts:', error);
    throw error;
  }
};

/**
 * View a post (mark as viewed and handle delete on view)
 * @param {string} postId - Post ID
 * @param {string} viewerId - Viewer's user ID
 * @returns {Promise<Object>} - Updated post data
 */
export const viewPost = async (postId, viewerId) => {
  try {
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      throw new Error('Post not found');
    }
    
    const post = postDoc.data();
    
    // Check if already viewed
    if (post.viewedBy.includes(viewerId)) {
      return { ...post, id: postId };
    }
    
    // Update view count and viewedBy
    const updates = {
      viewCount: post.viewCount + 1,
      viewedBy: [...post.viewedBy, viewerId],
    };
    
    await postRef.update(updates);
    
    // Handle delete on view
    if (post.deleteOnView && viewerId !== post.authorUid) {
      console.log('[Posts API] Deleting post after view:', postId);
      await deletePost(postId);
      return { ...post, ...updates, id: postId, deleted: true };
    }
    
    return { ...post, ...updates, id: postId };
  } catch (error) {
    console.error('[Posts API] Error viewing post:', error);
    throw error;
  }
};

/**
 * Delete a post and its media
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const deletePost = async (postId) => {
  try {
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      throw new Error('Post not found');
    }
    
    const post = postDoc.data();
    
    // Delete media from storage
    if (post.metadata?.storagePath) {
      const storageRef = ref(storage, post.metadata.storagePath);
      await deleteObject(storageRef).catch((err) => {
        console.warn('[Posts API] Error deleting media:', err);
      });
    }
    
    // Delete post document
    await postRef.delete();
    console.log('[Posts API] Deleted post:', postId);
  } catch (error) {
    console.error('[Posts API] Error deleting post:', error);
    throw error;
  }
};

/**
 * Get posts by user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of user's posts
 */
export const getUserPosts = async (userId) => {
  try {
    const snapshot = await db.collection('posts')
      .where('authorUid', '==', userId)
      .get();
    
    const posts = [];
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);
    
    return posts;
  } catch (error) {
    console.error('[Posts API] Error getting user posts:', error);
    throw error;
  }
};

/**
 * Clean up expired posts (would be a Cloud Function in production)
 * @returns {Promise<number>} - Number of deleted posts
 */
export const cleanupExpiredPosts = async () => {
  try {
    const now = new Date();
    const snapshot = await db.collection('posts').get();
    let deletedCount = 0;
    
    for (const doc of snapshot.docs) {
      const post = doc.data();
      const expiresAt = post.expiresAt?.toDate ? post.expiresAt.toDate() : post.expiresAt;
      if (expiresAt && new Date(expiresAt) < now) {
        await deletePost(doc.id);
        deletedCount++;
      }
    }
    
    console.log(`[Posts API] Cleaned up ${deletedCount} expired posts`);
    return deletedCount;
  } catch (error) {
    console.error('[Posts API] Error cleaning up expired posts:', error);
    throw error;
  }
}; 