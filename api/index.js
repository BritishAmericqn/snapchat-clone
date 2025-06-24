// API exports will be added here as we build features
// This file will contain all API interface logic for Firebase operations

// User API exports
export {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUsersByIds,
  addFriend,
  removeFriend,
} from './users.js';

// Friend API exports
export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getPendingFriendRequests,
  getSentFriendRequests,
  checkFriendStatus,
  getFriendSuggestions,
} from './friends.js';

// Posts API exports
export {
  createPost,
  getFeedPosts,
  viewPost,
  deletePost,
  getUserPosts,
  cleanupExpiredPosts,
} from './posts.js';

// Messages API
export {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  viewMessage,
  deleteMessage,
  markChatAsRead,
  cleanupExpiredMessages,
  areUsersFriends,
  queueMessage,
  processMessageQueue,
  getQueueStatus,
  clearMessageQueue
} from './messages.js';

// Reactions API - Phase 5
export {
  addReactionToPost,
  removeReactionFromPost,
  getPostReactions,
  getUserReactionToPost,
  toggleReaction,
  getBulkReactionCounts
} from './reactions.js';

// Moderation API - Phase 5
export {
  muteUser,
  unmuteUser,
  blockUser,
  unblockUser,
  reportUser,
  getModerationStatus,
  getReports,
  updateReportStatus,
  canUsersInteract,
  filterModerationContent
} from './moderation.js'; 