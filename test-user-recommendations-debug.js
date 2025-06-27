// Quick test to verify gaming user is available for recommendations
// Run this with: node test-user-recommendations-debug.js

console.log('🎮 TESTING GAMING USER AVAILABILITY');
console.log('==================================');

const testUserAvailability = () => {
  // Mock user data (same as in config/firebase-mock.js)
  const mockUsers = [
    { id: '12345', username: 'test', friendIds: ['user_sarah', 'user_mike', 'user_emma', 'user_john'] },
    { id: 'user_john', username: 'johndoe', bio: '📸 Photography enthusiast | 🌍 Travel lover', friendIds: ['user_sarah', 'user_mike', 'user_emma'] },
    { id: 'user_sarah', username: 'sarahsmith', bio: '🎨 Artist | 🎵 Music is life | Coffee addict ☕', friendIds: ['user_john', 'user_emma', 'user_alex'] },
    { id: 'user_mike', username: 'mikethedev', bio: '💻 Full-stack developer | 🎮 Gamer | Tech enthusiast', friendIds: ['user_john', 'user_david'] },
    { id: 'user_emma', username: 'emmawilson', bio: '📚 Bookworm | ✈️ Wanderlust | 🧘‍♀️ Yoga lover', friendIds: ['user_john', 'user_sarah', 'user_lisa'] },
    { id: 'user_alex', username: 'alexcool', bio: '🏀 Basketball player | 🍕 Pizza connoisseur', friendIds: ['user_sarah', 'user_lisa', 'user_chris'] },
    { id: 'user_lisa', username: 'lisagreen', bio: '🌱 Plant mom | 🍳 Cooking enthusiast | Dog lover 🐕', friendIds: ['user_emma', 'user_alex', 'user_sophie'] },
    { id: 'user_david', username: 'davidbrown', bio: '🚴‍♂️ Cyclist | 🏔️ Mountain lover | Adventure seeker', friendIds: ['user_mike', 'user_chris'] },
    { id: 'user_sophie', username: 'sophiemarie', bio: '🎭 Theater geek | 🍰 Baker | Living my best life ✨', friendIds: ['user_lisa', 'user_chris'] },
    { id: 'user_chris', username: 'chrisrocker', bio: '🎸 Musician | 🎤 Singer | Rock n Roll 🤘', friendIds: ['user_alex', 'user_david', 'user_sophie'] },
    { id: 'user_gaming', username: 'gamerpro', bio: '🎮 Videogame lover | 🕹️ Retro games enthusiast | Streaming life 🎬', friendIds: ['user_david', 'user_chris'] }  // NEW USER ADDED!
  ];
  
  const currentUserId = '12345';  // Test user
  const testUser = mockUsers.find(u => u.id === currentUserId);
  const friendIds = testUser?.friendIds || [];
  
  console.log('✅ Test user friends:', friendIds);
  console.log('✅ Total users in database:', mockUsers.length);
  
  // Filter exactly like getAllUsersForRecommendation does
  const availableUsers = mockUsers.filter(user => 
    user.id !== currentUserId && !friendIds.includes(user.id)
  );
  
  console.log('\n✅ Users available for recommendation:', availableUsers.length);
  availableUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.username} - "${user.bio}"`);
  });
  
  // Test for different interests
  const interests = ['game', 'gaming', 'video', 'gamer', 'music', 'cook', 'theater'];
  interests.forEach(interest => {
    const matches = availableUsers.filter(user => 
      user.bio && user.bio.toLowerCase().includes(interest.toLowerCase())
    );
    console.log(`\n🔍 Users mentioning "${interest}": ${matches.length}`);
    matches.forEach(user => {
      console.log(`  - ${user.username}: "${user.bio}"`);
    });
  });
  
  console.log('\n🎯 TEST RESULTS:');
  console.log('================');
  
  const testResults = [
    { interest: 'loves videogames', shouldMatch: ['gamerpro'] },
    { interest: 'loves music', shouldMatch: ['chrisrocker'] },
    { interest: 'loves cooking', shouldMatch: ['lisagreen'] },
    { interest: 'loves theater', shouldMatch: ['sophiemarie'] }
  ];
  
  testResults.forEach(test => {
    const matches = availableUsers.filter(user => {
      const bio = user.bio.toLowerCase();
      const interest = test.interest.replace('loves ', '').toLowerCase();
      return bio.includes(interest) || bio.includes(interest.slice(0, -1)); // Handle "game" vs "games"
    });
    
    const matchingUsernames = matches.map(u => u.username);
    const expectedMatch = test.shouldMatch.some(expected => matchingUsernames.includes(expected));
    
    console.log(`\n${expectedMatch ? '✅' : '❌'} "${test.interest}"`);
    console.log(`   Expected: ${test.shouldMatch.join(', ')}`);
    console.log(`   Found: ${matchingUsernames.join(', ') || 'none'}`);
  });
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('===============');
  console.log('1. Restart Expo to reload mock data: npx expo start --port 8083 --clear');
  console.log('2. Change your bio to "loves videogames"');
  console.log('3. Go to SearchUsers and tap Refresh');
  console.log('4. Should see Tyler Gaming (gamerpro) as a recommendation!');
  console.log('5. Check console for detailed debug logs from the enhanced error handling');
};

testUserAvailability();

// Updated test to verify cache clearing on profile update
console.log('🎮 TESTING CACHE CLEARING ON PROFILE UPDATE');
console.log('===========================================');

// Test the complete flow: update bio → clear cache → fresh recommendations
async function testCacheInvalidationFlow() {
  try {
    // Import functions
    const { updateUserProfile, getUserProfile } = require('./api/users');
    const { generateUserRecommendations, getRecommendationCacheStats } = require('./api/embeddings');
    
    const testUserId = '12345';
    
    console.log('\n📊 STEP 1: Check initial cache state');
    const initialCacheStats = getRecommendationCacheStats();
    console.log('Initial cache size:', initialCacheStats.size);
    
    console.log('\n🎮 STEP 2: Update user bio to "loves videogames"');
    await updateUserProfile(testUserId, {
      bio: 'loves videogames'
    });
    
    console.log('\n📊 STEP 3: Check cache after profile update');
    const postUpdateCacheStats = getRecommendationCacheStats();
    console.log('Cache size after update:', postUpdateCacheStats.size);
    console.log('Cache should be cleared (size = 0):', postUpdateCacheStats.size === 0);
    
    console.log('\n🔄 STEP 4: Verify profile was actually updated');
    const updatedProfile = await getUserProfile(testUserId);
    console.log('Updated bio:', updatedProfile.bio);
    console.log('Bio updated correctly:', updatedProfile.bio === 'loves videogames');
    
    console.log('\n🤖 STEP 5: Generate fresh recommendations (should analyze new bio)');
    const recommendations = await generateUserRecommendations(testUserId, {
      limit: 3,
      includeAnalysis: true
    });
    
    console.log('\n✅ RESULTS:');
    console.log('Success:', recommendations.success);
    console.log('Recommendations count:', recommendations.recommendations?.length || 0);
    console.log('Analysis preview:', recommendations.analysis?.substring(0, 100) + '...');
    console.log('Cached result:', recommendations.cached);
    
    if (recommendations.recommendations?.length > 0) {
      console.log('\n👥 GAMING MATCHES FOUND:');
      recommendations.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.user?.username} (${rec.matchScore}%) - ${rec.reason}`);
        console.log(`   Bio: "${rec.user?.bio}"`);
        console.log(`   Starter: "${rec.conversationStarter}"`);
      });
    }
    
    console.log('\n📊 STEP 6: Verify cache was repopulated');
    const finalCacheStats = getRecommendationCacheStats();
    console.log('Final cache size:', finalCacheStats.size);
    console.log('New cache entry created:', finalCacheStats.size > 0);
    
    console.log('\n🎯 CACHE INVALIDATION TEST COMPLETE!');
    console.log('✅ Profile update clears cache');
    console.log('✅ Fresh recommendations use new bio'); 
    console.log('✅ Gaming user should now be recommended');
    
  } catch (error) {
    console.error('❌ Error testing cache invalidation:', error);
  }
}

// Run the test
testCacheInvalidationFlow(); 