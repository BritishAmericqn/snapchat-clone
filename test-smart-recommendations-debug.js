// Test script to debug the user recommendations "analyze" button error
// Run this with: node test-smart-recommendations-debug.js

console.log('🔍 DEBUGGING USER RECOMMENDATIONS ANALYZE ERROR');
console.log('===============================================\n');

// Test 1: Environment Variable Loading
console.log('📋 TEST 1: Environment Variable Configuration');
console.log('-------------------------------------------');

// Load environment variables
require('dotenv').config();

console.log('✅ OPENAI_API_KEY exists in process.env:', !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log('✅ Key length:', process.env.OPENAI_API_KEY.length, 'characters');
  console.log('✅ Starts with sk-:', process.env.OPENAI_API_KEY.startsWith('sk-'));
  console.log('✅ Key preview:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
} else {
  console.log('❌ OPENAI_API_KEY not found in process.env');
}

// Simulate Expo Constants loading (this won't work in Node.js but shows the pattern)
console.log('\n📋 APP CONFIG SIMULATION:');
console.log('✅ app.config.js has openaiApiKey in extra section');
console.log('✅ Pattern: Constants.expoConfig?.extra?.openaiApiKey');

// Test 2: Mock Database Connection
console.log('\n📋 TEST 2: Mock Database User Retrieval');
console.log('-------------------------------------------');

try {
  // Import the database
  const { db } = require('./config');
  console.log('✅ Database imported successfully');
  console.log('✅ Database type:', typeof db);
  console.log('✅ Database has collection method:', typeof db.collection === 'function');
  
  // Test getting users collection
  if (db.collection) {
    console.log('✅ Testing users collection...');
    const usersCollection = db.collection('users');
    console.log('✅ Users collection created:', typeof usersCollection);
    console.log('✅ Collection has get method:', typeof usersCollection.get === 'function');
    
    // Test getting all users
    if (usersCollection.get) {
      console.log('✅ Attempting to get all users...');
      usersCollection.get().then(snapshot => {
        console.log('✅ Users snapshot received');
        console.log('✅ Snapshot size:', snapshot.size);
        console.log('✅ Snapshot empty:', snapshot.empty);
        
        const users = [];
        snapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('✅ Total users found:', users.length);
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.username} (${user.displayName}) - friends: ${user.friendIds?.length || 0}`);
        });
        
        // Test filtering for recommendations (exclude test user and friends)
        const currentUserId = '12345';  // Test user
        const testUser = users.find(u => u.id === currentUserId);
        const friendIds = testUser?.friendIds || [];
        
        console.log('\n✅ Test user friends:', friendIds);
        
        const availableForRecommendation = users.filter(user => 
          user.id !== currentUserId && !friendIds.includes(user.id)
        );
        
        console.log('✅ Users available for recommendation:', availableForRecommendation.length);
        availableForRecommendation.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.username} (${user.displayName}) - ${user.bio?.substring(0, 50)}...`);
        });
        
        if (availableForRecommendation.length === 0) {
          console.log('❌ NO USERS AVAILABLE FOR RECOMMENDATION - This is the problem!');
        } else {
          console.log('✅ Recommendation system should work with these users');
        }
        
      }).catch(error => {
        console.error('❌ Error getting users:', error);
      });
    } else {
      console.error('❌ Collection.get method not found');
    }
  } else {
    console.error('❌ db.collection method not found');
  }
  
} catch (error) {
  console.error('❌ Error testing database:', error);
  console.error('❌ Error message:', error.message);
  console.error('❌ Error stack:', error.stack);
}

// Test 3: OpenAI Client Test  
console.log('\n📋 TEST 3: OpenAI Client Initialization');
console.log('-------------------------------------------');

try {
  const { getOpenAIClient } = require('./config/rag');
  console.log('✅ RAG config imported successfully');
  
  const client = getOpenAIClient();
  console.log('✅ OpenAI client retrieved');
  console.log('✅ Client type:', client.constructor.name);
  console.log('✅ Client has chat property:', !!client.chat);
  console.log('✅ Chat has completions:', !!client.chat?.completions);
  console.log('✅ Completions has create:', typeof client.chat?.completions?.create === 'function');
  
} catch (error) {
  console.error('❌ Error testing OpenAI client:', error);
}

// Test 4: User Recommendations Function Test
console.log('\n📋 TEST 4: User Recommendations Function');
console.log('-------------------------------------------');

try {
  const { generateUserRecommendations } = require('./api/embeddings');
  console.log('✅ generateUserRecommendations function imported');
  console.log('✅ Function type:', typeof generateUserRecommendations);
  
  // Test with the test user ID
  console.log('✅ Testing with user ID: 12345');
  
  generateUserRecommendations('12345', { limit: 3 }).then(result => {
    console.log('\n✅ RECOMMENDATION RESULT:');
    console.log('✅ Success:', result.success);
    console.log('✅ Recommendations count:', result.recommendations?.length || 0);
    console.log('✅ Analysis:', result.analysis);
    console.log('✅ Error:', result.error);
    console.log('✅ Cached:', result.cached);
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('\n✅ RECOMMENDATIONS:');
      result.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.user?.username || 'Unknown'} - ${rec.matchScore}% - ${rec.reason}`);
      });
    } else {
      console.log('❌ NO RECOMMENDATIONS RETURNED - This confirms the bug!');
    }
    
  }).catch(error => {
    console.error('❌ Error in generateUserRecommendations:', error);
    console.error('❌ Error message:', error.message);
  });
  
} catch (error) {
  console.error('❌ Error importing generateUserRecommendations:', error);
}

console.log('\n📋 TEST COMPLETE');
console.log('===============================================');
console.log('🔍 This test will help identify where the issue is occurring');
console.log('🔍 Check the output above to see what\'s failing');

// FOCUSED DEBUG: Why are recommendations empty but analysis working?
// Run this with: node test-smart-recommendations-debug.js

console.log('🔍 FOCUSED DEBUG: Empty Recommendations Issue');
console.log('=============================================\n');

// From memory bank: If analysis shows but no recommendations, 
// the issue is usually in user filtering or OpenAI returning 0 results

// Test 1: Check what users are available for recommendation
console.log('📋 TEST 1: Available Users for Recommendation');
console.log('---------------------------------------------');

async function testUserFiltering() {
  try {
    // Simulate the exact filtering logic from getAllUsersForRecommendation
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
      { id: 'user_chris', username: 'chrisrocker', bio: '🎸 Musician | 🎤 Singer | Rock n Roll 🤘', friendIds: ['user_alex', 'user_david', 'user_sophie'] }
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
    
    console.log('✅ Users available for recommendation:', availableUsers.length);
    availableUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} - "${user.bio}"`);
    });
    
    // Check if any user bio contains "videogames" or "game"
    const gameLovers = availableUsers.filter(user => 
      user.bio && (
        user.bio.toLowerCase().includes('game') || 
        user.bio.toLowerCase().includes('video') ||
        user.bio.toLowerCase().includes('gamer')
      )
    );
    
    console.log('\n✅ Users who mention games/gaming:', gameLovers.length);
    gameLovers.forEach(user => {
      console.log(`  - ${user.username}: "${user.bio}"`);
    });
    
    if (gameLovers.length === 0) {
      console.log('❌ FOUND THE ISSUE: No users in available pool mention gaming!');
      console.log('❌ The test user bio "loves videogames" won\'t match anyone');
      console.log('✅ SOLUTION: Either add a gaming user to mock data OR test with different interests');
    } else {
      console.log('✅ Gaming users found - this should work with "loves videogames"');
    }
    
  } catch (error) {
    console.error('❌ Error in user filtering test:', error);
  }
}

// Test 2: Check what happens when OpenAI gets empty candidate list
console.log('\n📋 TEST 2: OpenAI Response Pattern Analysis');
console.log('------------------------------------------');

function simulateOpenAICall() {
  console.log('✅ Simulating OpenAI call with available users...');
  
  // From memory bank: OpenAI sometimes returns 0 recommendations
  // even with valid users if the prompt isn't clear enough
  
  const possibleIssues = [
    'OpenAI API key not loaded in React Native (using mock client)',
    'OpenAI generating 0 recommendations due to prompt issues',
    'Rate limiting preventing real API calls',
    'JSON parsing error causing function to fail',
    'Empty user candidate list passed to OpenAI'
  ];
  
  console.log('🔍 POSSIBLE ROOT CAUSES:');
  possibleIssues.forEach((issue, index) => {
    console.log(`  ${index + 1}. ${issue}`);
  });
}

// Test 3: Memory bank solutions
console.log('\n📋 TEST 3: Memory Bank Solutions');
console.log('--------------------------------');

function memoryBankSolutions() {
  console.log('🎯 FROM MEMORY BANK - PROVEN FIXES:');
  console.log('');
  
  console.log('1. 🔧 ENVIRONMENT VARIABLE ISSUE:');
  console.log('   - OpenAI API key not loading in React Native');
  console.log('   - SOLUTION: Use Expo Constants pattern (already implemented)');
  console.log('   - CHECK: Look for "[RAG DEBUG] Using mock client" in console');
  console.log('');
  
  console.log('2. 🔧 EMPTY USER POOL ISSUE:');
  console.log('   - Test user has too many friends, leaving no recommendations');
  console.log('   - SOLUTION: Remove some friends OR add more test users');
  console.log('   - CHECK: Verify availableUsers.length > 0');
  console.log('');
  
  console.log('3. 🔧 OPENAI PROMPT ISSUE:');
  console.log('   - AI generating 0 recommendations due to strict criteria');
  console.log('   - SOLUTION: Modify prompt to be less restrictive');
  console.log('   - CHECK: Look for "AI generated 0 user recommendations"');
  console.log('');
  
  console.log('4. 🔧 JSON PARSING ISSUE:');
  console.log('   - OpenAI returning markdown-wrapped JSON');
  console.log('   - SOLUTION: Enhanced parsing (already implemented)');
  console.log('   - CHECK: Look for JSON Parse errors in console');
}

// Run all tests
async function runFocusedDebug() {
  await testUserFiltering();
  simulateOpenAICall();
  memoryBankSolutions();
  
  console.log('\n📋 IMMEDIATE ACTION PLAN:');
  console.log('========================');
  console.log('1. Check browser console for "[RAG DEBUG]" messages');
  console.log('2. Look for "Using mock client" vs "Real OpenAI client"');
  console.log('3. Verify "Found X potential users for recommendation"');
  console.log('4. Check if any users mention gaming/similar interests');
  console.log('5. Try with different bio like "loves music" (matches sarahsmith)');
  console.log('');
  console.log('🎯 MOST LIKELY: Test user friends with too many people,');
  console.log('   leaving only non-gaming users in recommendation pool');
}

runFocusedDebug(); 