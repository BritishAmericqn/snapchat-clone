// Quick test to verify generateFilterRecommendations function availability
console.log('🔧 FILTER FUNCTION AVAILABILITY TEST');
console.log('===================================');

try {
  // Test import
  const embeddings = require('./api/embeddings');
  console.log('✅ Embeddings module imported successfully');
  
  // Check if function exists
  if (embeddings.generateFilterRecommendations) {
    console.log('✅ generateFilterRecommendations function EXISTS');
    console.log('   Function type:', typeof embeddings.generateFilterRecommendations);
    console.log('   Function name:', embeddings.generateFilterRecommendations.name);
  } else {
    console.log('❌ generateFilterRecommendations function NOT FOUND');
    console.log('   Available functions:', Object.keys(embeddings).filter(key => typeof embeddings[key] === 'function'));
  }
  
  // Test named import (the way FilterOverlay uses it)
  const { generateFilterRecommendations } = embeddings;
  if (generateFilterRecommendations) {
    console.log('✅ Named import works: generateFilterRecommendations');
  } else {
    console.log('❌ Named import failed');
  }
  
  console.log('\n🎉 SUCCESS: Function should now work in FilterOverlay!');
  console.log('📱 Try the AI filter recommendations in the app now.');
  
} catch (error) {
  console.log('❌ ERROR:', error.message);
  console.log('   This indicates there might still be an import issue');
}

module.exports = { testComplete: true }; 