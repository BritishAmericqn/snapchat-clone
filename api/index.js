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
} from './users';

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
} from './friends'; 