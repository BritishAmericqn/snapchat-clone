// COMPREHENSIVE RAG FLOW DEBUG - Finding the disconnect
// Run this with: node test-rag-disconnect-debug.js

console.log('🔍 COMPREHENSIVE RAG FLOW DEBUG');
console.log('================================');
console.log('Tracing the complete flow: Profile → Cache → OpenAI → Frontend\n');

async function debugCompleteRAGFlow() {
  try {
    // Set up environment
    require('dotenv').config();
    
    console.log('📋 STEP 1: ENVIRONMENT SETUP');
    console.log('-----------------------------');
    console.log('✅ OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('✅ Key starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-'));
    
    // Import all required modules
    const { getUserProfile, updateUserProfile } = require('./api/users');
    const { generateUserRecommendations, clearRecommendationCache, getRecommendationCacheStats } = require('./api/embeddings');
    
    const testUserId = '12345';
    
    console.log('\n📊 STEP 2: CURRENT USER PROFILE');
    console.log('--------------------------------');
    const currentProfile = await getUserProfile(testUserId);
    console.log('Current bio:', `"${currentProfile.bio}"`);
    console.log('Username:', currentProfile.username);
    console.log('Friend count:', currentProfile.friendIds?.length || 0);
    console.log('Friends:', currentProfile.friendIds);
    
    console.log('\n🗑️ STEP 3: CLEAR CACHE MANUALLY');
    console.log('--------------------------------');
    clearRecommendationCache();
    const clearedCacheStats = getRecommendationCacheStats();
    console.log('Cache cleared, size now:', clearedCacheStats.size);
    
    console.log('\n🔄 STEP 4: UPDATE PROFILE TO GAMING BIO');
    console.log('---------------------------------------');
    await updateUserProfile(testUserId, {
      bio: 'loves videogames and retro gaming 🎮'
    });
    
    const updatedProfile = await getUserProfile(testUserId);
    console.log('Updated bio:', `"${updatedProfile.bio}"`);
    console.log('Bio contains gaming terms:', updatedProfile.bio.includes('game'));
    
    console.log('\n📦 STEP 5: CHECK CACHE AFTER UPDATE');
    console.log('-----------------------------------');
    const postUpdateCacheStats = getRecommendationCacheStats();
    console.log('Cache size after update:', postUpdateCacheStats.size);
    console.log('Cache auto-cleared:', postUpdateCacheStats.size === 0);
    
    console.log('\n🤖 STEP 6: GENERATE RECOMMENDATIONS (FRESH)');
    console.log('---------------------------------------------');
    console.log('Calling generateUserRecommendations with full debugging...\n');
    
    const startTime = Date.now();
    const result = await generateUserRecommendations(testUserId, {
      limit: 5,
      includeAnalysis: true
    });
    const endTime = Date.now();
    
    console.log('\n📊 STEP 7: ANALYZE API RESPONSE');
    console.log('-------------------------------');
    console.log('✅ Call completed in:', endTime - startTime, 'ms');
    console.log('✅ Success:', result.success);
    console.log('✅ Error:', result.error || 'none');
    console.log('✅ Cached result:', result.cached);
    console.log('✅ Recommendations count:', result.recommendations?.length || 0);
    console.log('✅ Analysis exists:', !!result.analysis);
    console.log('✅ Analysis preview:', result.analysis?.substring(0, 100) + '...');
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('\n👥 STEP 8: RECOMMENDATION DETAILS');
      console.log('----------------------------------');
      result.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. User: ${rec.user?.username} (${rec.user?.displayName})`);
        console.log(`   Bio: "${rec.user?.bio}"`);
        console.log(`   Match Score: ${rec.matchScore}%`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   Conversation Starter: "${rec.conversationStarter}"`);
        console.log('');
      });
    } else {
      console.log('\n❌ STEP 8: NO RECOMMENDATIONS FOUND');
      console.log('------------------------------------');
      console.log('This is the source of the frontend disconnect!');
      console.log('API returns success but empty recommendations array.');
    }
    
    console.log('\n🔍 STEP 9: MANUAL USER DATABASE CHECK');
    console.log('--------------------------------------');
    // Check what users are actually available
    const { db } = require('./config');
    const snapshot = await db.collection('users').get();
    
    const allUsers = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      allUsers.push({ id: doc.id, ...userData });
    });
    
    const testUser = allUsers.find(u => u.id === testUserId);
    const friendIds = testUser?.friendIds || [];
    const availableUsers = allUsers.filter(u => 
      u.id !== testUserId && !friendIds.includes(u.id)
    );
    
    console.log('Total users in database:', allUsers.length);
    console.log('Test user friends:', friendIds);
    console.log('Available for recommendation:', availableUsers.length);
    
    availableUsers.forEach((user, i) => {
      const hasGaming = user.bio?.toLowerCase().includes('game') || 
                       user.bio?.toLowerCase().includes('video') ||
                       user.bio?.toLowerCase().includes('gaming');
      console.log(`${i + 1}. ${user.username}: "${user.bio}" ${hasGaming ? '🎮 GAMING MATCH!' : ''}`);
    });
    
    console.log('\n🎯 STEP 10: OPENAI API TEST');
    console.log('----------------------------');
    // Test OpenAI directly to see if it's working
    try {
      const { getOpenAIClient } = require('./config/rag');
      const openai = getOpenAIClient();
      
      if (!openai) {
        console.log('❌ OpenAI client is null - API key not loading properly');
      } else {
        console.log('✅ OpenAI client created successfully');
        
        // Test a simple OpenAI call
        const testResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "OpenAI working" if you can read this.' }],
          max_tokens: 10
        });
        
        console.log('✅ OpenAI test response:', testResponse.choices[0].message.content);
      }
    } catch (openaiError) {
      console.log('❌ OpenAI test failed:', openaiError.message);
    }
    
    console.log('\n🏁 DEBUG COMPLETE');
    console.log('==================');
    console.log('The disconnect is likely in one of these areas:');
    console.log('1. OpenAI API key not loading in React Native (but works in Node)');
    console.log('2. User analysis returning empty interests');
    console.log('3. AI recommendation generation failing silently');
    console.log('4. Cache not being cleared properly in the app');
    console.log('5. Frontend not calling the updated recommendation function');
    
    if (result.recommendations?.length === 0) {
      console.log('\n💡 NEXT DEBUGGING STEPS:');
      console.log('1. Check browser console in the app for detailed API logs');
      console.log('2. Verify the refresh button actually calls loadRecommendations()');
      console.log('3. Check if OpenAI API key loads in React Native runtime');
      console.log('4. Test with mock OpenAI responses to isolate the issue');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the comprehensive debug
debugCompleteRAGFlow(); 