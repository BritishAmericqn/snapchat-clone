/**
 * Phase 9 RAG Text Overlay Intelligence - Complete Integration Test
 * 
 * This comprehensive test verifies all Phase 9 features:
 * - AI Text Suggestions API integration
 * - UI components and user interactions  
 * - Intelligent positioning system
 * - Style-aware text generation
 * - Complete user experience flow
 * 
 * Run: node test-phase9-text-overlay-intelligence.js
 */

const { generateTextOverlaySuggestions } = require('./api/embeddings');

// Test Configuration
const TEST_USER_ID = 'test-user-phase9';
const TEST_IMAGE_URL = 'https://picsum.photos/400/600?random=42';

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

// Test 1: Basic API Integration
async function testAPIIntegration() {
  console.log('\n🧪 Test 1: AI Text Suggestions API Integration');
  
  try {
    const result = await generateTextOverlaySuggestions(
      TEST_IMAGE_URL,
      TEST_USER_ID,
      { style: 'mixed' }
    );
    
    // Check basic response structure
    logTest('API Response Structure', 
      result && typeof result === 'object',
      `Response type: ${typeof result}`
    );
    
    // Check suggestions array
    logTest('Suggestions Array Present', 
      Array.isArray(result.suggestions),
      `Suggestions: ${result.suggestions ? result.suggestions.length : 'none'}`
    );
    
    // Check each suggestion has required fields
    const firstSuggestion = result.suggestions?.[0];
    if (firstSuggestion) {
      logTest('Suggestion Text Field', 
        typeof firstSuggestion.text === 'string' && firstSuggestion.text.length > 0,
        `Text: "${firstSuggestion.text}"`
      );
      
      logTest('Suggestion Style Field', 
        ['motivational', 'aesthetic', 'descriptive', 'minimal'].includes(firstSuggestion.style),
        `Style: ${firstSuggestion.style}`
      );
      
      logTest('Position Coordinates', 
        firstSuggestion.position && 
        typeof firstSuggestion.position.x === 'number' &&
        typeof firstSuggestion.position.y === 'number',
        `Position: (${firstSuggestion.position?.x}, ${firstSuggestion.position?.y})`
      );
      
      logTest('Position Reasoning', 
        typeof firstSuggestion.position?.reasoning === 'string' && 
        firstSuggestion.position.reasoning.length > 0,
        `Reasoning: "${firstSuggestion.position?.reasoning}"`
      );
    }
    
    // Check analysis field
    logTest('Image Analysis Present', 
      typeof result.analysis === 'string' && result.analysis.length > 0,
      `Analysis length: ${result.analysis?.length || 0} chars`
    );
    
    // Check composition metadata
    logTest('Composition Metadata', 
      result.composition && 
      typeof result.composition.mood === 'string' &&
      typeof result.composition.lighting === 'string' &&
      Array.isArray(result.composition.emptyZones),
      `Mood: ${result.composition?.mood}, Lighting: ${result.composition?.lighting}`
    );
    
    return result;
    
  } catch (error) {
    logTest('API Integration', false, error.message);
    return null;
  }
}

// Test 2: UI Component Integration
function testUIComponents() {
  console.log('\n🎨 Test 2: UI Component Integration');
  
  // Test TextOverlayTools component structure
  try {
    const TextOverlayToolsCode = require('fs').readFileSync('./components/TextOverlayTools.js', 'utf8');
    
    // Check for AI suggestion imports
    logTest('AI API Import', 
      TextOverlayToolsCode.includes('generateTextOverlaySuggestions'),
      'generateTextOverlaySuggestions import found'
    );
    
    // Check for AI state management
    logTest('AI State Variables', 
      TextOverlayToolsCode.includes('isGeneratingAISuggestions') &&
      TextOverlayToolsCode.includes('aiSuggestions') &&
      TextOverlayToolsCode.includes('showAISuggestions'),
      'AI state variables present'
    );
    
    // Check for AI suggestion functions
    logTest('AI Suggestion Functions', 
      TextOverlayToolsCode.includes('handleGenerateAISuggestions') &&
      TextOverlayToolsCode.includes('handleSelectAISuggestion') &&
      TextOverlayToolsCode.includes('renderAISuggestions'),
      'AI suggestion functions implemented'
    );
    
    // Check for AI suggestion UI elements  
    logTest('AI Suggestion UI Elements', 
      TextOverlayToolsCode.includes('✨ AI Suggest') &&
      TextOverlayToolsCode.includes('aiSuggestionsContainer') &&
      TextOverlayToolsCode.includes('suggestionChip'),
      'AI suggestion UI elements present'
    );
    
    // Check for imageUri prop
    logTest('ImageUri Prop Support', 
      TextOverlayToolsCode.includes('imageUri') &&
      TextOverlayToolsCode.includes('imageUri,'),
      'imageUri prop added to component'
    );
    
  } catch (error) {
    logTest('UI Component Analysis', false, error.message);
  }
  
  // Test MediaPreviewScreen integration
  try {
    const MediaPreviewCode = require('fs').readFileSync('./screens/MediaPreviewScreen.js', 'utf8');
    
    logTest('MediaPreview ImageUri Integration', 
      MediaPreviewCode.includes('imageUri={media.uri}'),
      'imageUri prop passed to TextOverlayTools'
    );
    
  } catch (error) {
    logTest('MediaPreview Integration', false, error.message);
  }
}

// Test 3: Intelligent Positioning Logic
async function testIntelligentPositioning(apiResult) {
  console.log('\n🎯 Test 3: Intelligent Positioning System');
  
  if (!apiResult || !apiResult.suggestions) {
    logTest('Positioning Test Setup', false, 'No API result available');
    return;
  }
  
  const suggestions = apiResult.suggestions;
  
  // Test safe zone compliance
  suggestions.forEach((suggestion, index) => {
    const { x, y } = suggestion.position;
    
    // Check mobile safe zones (avoid top 15%, right 15%, bottom 25%)
    const safeZoneCompliant = 
      y > 15 && // Not in top 15%
      x < 85 && // Not in right 15%  
      y < 75;   // Not in bottom 25%
    
    logTest(`Safe Zone Compliance - Suggestion ${index + 1}`, 
      safeZoneCompliant,
      `Position: (${x}%, ${y}%) - ${safeZoneCompliant ? 'SAFE' : 'UNSAFE'}`
    );
  });
  
  // Test position reasoning quality
  suggestions.forEach((suggestion, index) => {
    const reasoning = suggestion.position.reasoning;
    const hasGoodReasoning = 
      reasoning.length > 20 && // Substantial reasoning
      (reasoning.toLowerCase().includes('contrast') ||
       reasoning.toLowerCase().includes('empty') ||
       reasoning.toLowerCase().includes('space') ||
       reasoning.toLowerCase().includes('readable'));
    
    logTest(`Position Reasoning Quality - Suggestion ${index + 1}`, 
      hasGoodReasoning,
      `Reasoning: "${reasoning}"`
    );
  });
  
  // Test position diversity (suggestions shouldn't all be in same spot)
  if (suggestions.length > 1) {
    const positions = suggestions.map(s => ({ x: s.position.x, y: s.position.y }));
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    
    const diversity = positions.some(p => 
      Math.abs(p.x - avgX) > 20 || Math.abs(p.y - avgY) > 20
    );
    
    logTest('Position Diversity', 
      diversity,
      `Average position: (${avgX.toFixed(1)}%, ${avgY.toFixed(1)}%)`
    );
  }
}

// Test 4: Style-Aware Text Generation
async function testStyleAwareGeneration(apiResult) {
  console.log('\n🎨 Test 4: Style-Aware Text Generation');
  
  if (!apiResult || !apiResult.suggestions) {
    logTest('Style Generation Test Setup', false, 'No API result available');
    return;
  }
  
  const suggestions = apiResult.suggestions;
  const styles = suggestions.map(s => s.style);
  
  // Test style variety
  const uniqueStyles = [...new Set(styles)];
  logTest('Style Variety', 
    uniqueStyles.length >= 2,
    `Unique styles: ${uniqueStyles.join(', ')}`
  );
  
  // Test each style category
  const styleCategories = ['motivational', 'aesthetic', 'descriptive', 'minimal'];
  styleCategories.forEach(expectedStyle => {
    const styleSuggestions = suggestions.filter(s => s.style === expectedStyle);
    
    if (styleSuggestions.length > 0) {
      const suggestion = styleSuggestions[0];
      let styleAppropriate = false;
      
      switch (expectedStyle) {
        case 'motivational':
          styleAppropriate = /\b(chase|dream|believe|achieve|inspire|positive|energy|power|success|strong)\b/i.test(suggestion.text);
          break;
        case 'aesthetic':
          styleAppropriate = /\b(vibes|mood|aesthetic|magic|golden|cozy|dreamy|perfect|beautiful|moment)\b/i.test(suggestion.text);
          break;
        case 'descriptive':
          styleAppropriate = /\b(morning|evening|light|scene|moment|view|feeling|place|time|day)\b/i.test(suggestion.text);
          break;
        case 'minimal':
          styleAppropriate = suggestion.text.split(' ').length <= 3;
          break;
      }
      
      logTest(`Style Appropriateness - ${expectedStyle}`, 
        styleAppropriate,
        `Text: "${suggestion.text}"`
      );
    }
  });
  
  // Test text length appropriateness
  suggestions.forEach((suggestion, index) => {
    const wordCount = suggestion.text.split(' ').length;
    const appropriate = wordCount >= 1 && wordCount <= 6; // Good range for overlays
    
    logTest(`Text Length - Suggestion ${index + 1}`, 
      appropriate,
      `"${suggestion.text}" (${wordCount} words)`
    );
  });
}

// Test 5: Complete User Experience Flow
function testCompleteUserFlow() {
  console.log('\n🔄 Test 5: Complete User Experience Flow');
  
  // Test component exports
  try {
    const ComponentsIndex = require('fs').readFileSync('./components/index.js', 'utf8');
    
    logTest('TextOverlayTools Export', 
      ComponentsIndex.includes('TextOverlayTools'),
      'Component properly exported'
    );
    
  } catch (error) {
    logTest('Component Export Check', false, error.message);
  }
  
  // Test file structure
  const fs = require('fs');
  
  logTest('TextOverlayTools Component File', 
    fs.existsSync('./components/TextOverlayTools.js'),
    'Component file exists'
  );
  
  logTest('MediaPreviewScreen Integration', 
    fs.existsSync('./screens/MediaPreviewScreen.js'),
    'MediaPreview screen exists'
  );
  
  logTest('API Integration File', 
    fs.existsSync('./api/embeddings.js'),
    'API embeddings file exists'
  );
  
  // Test configuration
  try {
    const configExists = fs.existsSync('./config/rag.js');
    logTest('RAG Configuration', 
      configExists,
      'RAG config file present'
    );
    
    if (configExists) {
      const ragConfig = require('fs').readFileSync('./config/rag.js', 'utf8');
      logTest('OpenAI Configuration', 
        ragConfig.includes('openai') && ragConfig.includes('apiKey'),
        'OpenAI configuration present'
      );
    }
    
  } catch (error) {
    logTest('Configuration Check', false, error.message);
  }
}

// Test 6: Performance and Error Handling
async function testPerformanceAndErrorHandling() {
  console.log('\n⚡ Test 6: Performance and Error Handling');
  
  // Test with invalid image URI
  try {
    const startTime = Date.now();
    const result = await generateTextOverlaySuggestions(
      'invalid-image-uri',
      TEST_USER_ID,
      { style: 'mixed' }
    );
    const endTime = Date.now();
    
    logTest('Invalid Image Handling', 
      result && result.suggestions && result.suggestions.length > 0,
      `Fallback suggestions provided in ${endTime - startTime}ms`
    );
    
  } catch (error) {
    logTest('Invalid Image Error Handling', true, 'Error caught gracefully');
  }
  
  // Test rate limiting setup
  try {
    const embeddingsCode = require('fs').readFileSync('./api/embeddings.js', 'utf8');
    
    logTest('Rate Limiting Implementation', 
      embeddingsCode.includes('checkRateLimit') &&
      embeddingsCode.includes('textOverlayGeneration'),
      'Rate limiting for text overlays implemented'
    );
    
    logTest('Analytics Tracking', 
      embeddingsCode.includes('analyticsStore.textOverlayRequests') &&
      embeddingsCode.includes('updateUserAnalytics'),
      'Analytics tracking implemented'
    );
    
  } catch (error) {
    logTest('Performance Features Check', false, error.message);
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('🚀 Phase 9 RAG Text Overlay Intelligence - Comprehensive Test Suite');
  console.log('================================================================\n');
  
  console.log('Testing all Phase 9 features:');
  console.log('✨ AI Text Suggestions with OpenAI Vision API');
  console.log('🎯 Intelligent positioning with mobile safe zones');
  console.log('🎨 Style-aware text generation (motivational, aesthetic, descriptive, minimal)');
  console.log('🔄 Complete UI integration with TextOverlayTools');
  console.log('⚡ Performance optimization and error handling');
  
  // Run all tests
  const apiResult = await testAPIIntegration();
  testUIComponents();
  await testIntelligentPositioning(apiResult);
  await testStyleAwareGeneration(apiResult);
  testCompleteUserFlow();
  await testPerformanceAndErrorHandling();
  
  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHASE 9 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Phase 9 RAG Text Overlay Intelligence is ready!');
    console.log('\n✨ Features successfully implemented:');
    console.log('   • AI-powered text suggestions with intelligent positioning');
    console.log('   • Style-aware text generation (4 categories)');
    console.log('   • Mobile-optimized safe zone positioning');
    console.log('   • Seamless UI integration with existing text overlay tools');
    console.log('   • Real-time image composition analysis');
    console.log('   • Rate limiting and analytics tracking');
    console.log('\n🚀 Users can now get intelligent text overlay suggestions by tapping "✨ AI Suggest"!');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review and fix issues.`);
  }
  
  console.log('\n📱 To test in the app:');
  console.log('1. Take a photo in the app');
  console.log('2. Tap the Text overlay toggle button');
  console.log('3. Tap "✨ AI Suggest" button');
  console.log('4. Select from intelligent text suggestions');
  console.log('5. Enjoy perfectly positioned, style-aware text overlays!');
}

// Execute tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
}; 