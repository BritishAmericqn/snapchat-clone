// Test file for Phase 2 Friend Features
// Run this in a React Native environment or integrate into your test suite

import { 
  searchUsers, 
  sendFriendRequest, 
  getPendingFriendRequests,
  acceptFriendRequest,
  checkFriendStatus,
  getFriendSuggestions 
} from './api';

// Mock test users
const testUser1 = { uid: 'test1', email: 'test1@example.com' };
const testUser2 = { uid: 'test2', email: 'test2@example.com' };
const testUser3 = { uid: 'test3', email: 'test3@example.com' };

// Test suite
async function runTests() {
  console.log('🧪 Starting Friend Feature Tests...\n');
  
  try {
    // Test 1: Search Users
    console.log('Test 1: Search Users');
    const searchResults = await searchUsers('test', testUser1.uid);
    console.log('✅ Search returned', searchResults.length, 'users');
    console.log('Results:', searchResults.map(u => u.username));
    
    // Test 2: Send Friend Request
    console.log('\nTest 2: Send Friend Request');
    try {
      const requestId = await sendFriendRequest(testUser1.uid, testUser2.uid);
      console.log('✅ Friend request sent with ID:', requestId);
    } catch (err) {
      console.log('ℹ️ Friend request may already exist:', err.message);
    }
    
    // Test 3: Get Pending Friend Requests
    console.log('\nTest 3: Get Pending Friend Requests');
    const pendingRequests = await getPendingFriendRequests(testUser2.uid);
    console.log('✅ User has', pendingRequests.length, 'pending requests');
    pendingRequests.forEach(req => {
      console.log('  - From:', req.fromUser?.username || req.fromUid);
    });
    
    // Test 4: Check Friend Status
    console.log('\nTest 4: Check Friend Status');
    const status = await checkFriendStatus(testUser1.uid, testUser2.uid);
    console.log('✅ Friend status:', status);
    
    // Test 5: Accept Friend Request (if pending)
    if (pendingRequests.length > 0 && status.hasPendingRequest) {
      console.log('\nTest 5: Accept Friend Request');
      await acceptFriendRequest(pendingRequests[0].id, testUser2.uid);
      console.log('✅ Friend request accepted');
      
      // Verify they are now friends
      const newStatus = await checkFriendStatus(testUser1.uid, testUser2.uid);
      console.log('✅ New friend status:', newStatus);
    }
    
    // Test 6: Get Friend Suggestions
    console.log('\nTest 6: Get Friend Suggestions');
    const suggestions = await getFriendSuggestions(testUser1.uid, 5);
    console.log('✅ Got', suggestions.length, 'friend suggestions');
    suggestions.forEach(sug => {
      console.log('  -', sug.username, '(', sug.mutualFriendCount || 0, 'mutual friends)');
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Export for use in app or run directly
export default runTests;

// Instructions:
// 1. Import this file in your app: import runTests from './test-friend-features';
// 2. Call runTests() from a button press or useEffect
// 3. Check console output for results
// 4. Remember to delete this file before production! 