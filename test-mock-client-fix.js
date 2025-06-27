// Test the mock OpenAI client fix for user recommendations
// Run this with: node test-mock-client-fix.js

console.log('🔧 TESTING MOCK OPENAI CLIENT FIX');
console.log('=================================');

async function testMockClientFix() {
  // Import the config/rag module directly to test the mock client
  const rag = await import('./config/rag.js');
  
  console.log('📋 Step 1: Get OpenAI Client (should be mock in Node.js)');
  const client = rag.getOpenAIClient();
  console.log('Client type:', client.constructor.name);
  
  console.log('\n🧪 Step 2: Test User Analysis Request');
  const userAnalysisPrompt = {
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user', 
      content: [
        {
          type: 'text',
          text: 'Analyze this user profile for personalized friend recommendations: Bio: "loves videogames and retro gaming 🎮"'
        }
      ]
    }]
  };
  
  try {
    const analysisResult = await client.chat.completions.create(userAnalysisPrompt);
    const analysisContent = JSON.parse(analysisResult.choices[0].message.content);
    console.log('✅ User analysis response:', analysisContent);
  } catch (error) {
    console.error('❌ User analysis failed:', error.message);
  }
  
  console.log('\n🤖 Step 3: Test User Recommendation Request');
  const recommendationPrompt = {
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text', 
          text: 'You are an expert at matching people based on shared interests. Bio: "loves videogames and retro gaming 🎮". recommend the TOP candidates.'
        }
      ]
    }]
  };
  
  try {
    const recResult = await client.chat.completions.create(recommendationPrompt);
    const recContent = JSON.parse(recResult.choices[0].message.content);
    console.log('✅ Recommendation response:', recContent);
    console.log('✅ Recommendations count:', recContent.recommendations?.length || 0);
    
    if (recContent.recommendations?.length > 0) {
      console.log('\n🎯 Gaming User Match Found:');
      recContent.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. User: ${rec.userId}`);
        console.log(`   Match Score: ${rec.matchScore}%`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   Starter: "${rec.conversationStarter}"`);
      });
    }
  } catch (error) {
    console.error('❌ Recommendation request failed:', error.message);
  }
  
  console.log('\n🏁 Test Complete');
  console.log('================');
  console.log('If both tests passed, the mock client should now work in the app!');
  console.log('Gaming users should see recommendations when they refresh.');
}

testMockClientFix().catch(console.error); 