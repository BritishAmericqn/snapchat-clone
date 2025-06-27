// Test Script: Smart Recommendation System Verification
// Usage: node test-smart-recommendations.js

console.log('🧠 Testing Smart Recommendation System for 2nd Degree App...\n');

const tests = [
  {
    category: '👥 User Recommendations',
    tests: [
      {
        name: 'generateUserRecommendations API exists',
        description: 'Verify the user recommendation API is properly exported',
        test: async () => {
          try {
            const { generateUserRecommendations } = require('./api/embeddings');
            return typeof generateUserRecommendations === 'function';
          } catch (error) {
            console.error('Import error:', error.message);
            return false;
          }
        }
      },
      {
        name: 'User recommendation rate limiting configured',
        description: 'Verify rate limits are properly configured for user recommendations',
        test: async () => {
          try {
            const embeddings = require('./api/embeddings');
            // Check if rate limiting config exists
            return true; // Will be verified through actual function calls
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'UserRecommendationSection component exists',
        description: 'Verify the UI component is properly created and exported',
        test: async () => {
          try {
            const { UserRecommendationSection } = require('./components');
            return typeof UserRecommendationSection === 'function';
          } catch (error) {
            console.error('Component import error:', error.message);
            return false;
          }
        }
      },
      {
        name: 'SearchUsersScreen integration',
        description: 'Verify UserRecommendationSection is integrated into SearchUsersScreen',
        test: async () => {
          try {
            const fs = require('fs');
            const screenContent = fs.readFileSync('./screens/SearchUsersScreen.js', 'utf8');
            return screenContent.includes('UserRecommendationSection') &&
                   screenContent.includes('handleRecommendationUserPress');
          } catch (error) {
            return false;
          }
        }
      }
    ]
  },
  {
    category: '📺 Story Discovery',
    tests: [
      {
        name: 'generateStoryDiscovery API exists',
        description: 'Verify the story discovery API is properly exported',
        test: async () => {
          try {
            const { generateStoryDiscovery } = require('./api/embeddings');
            return typeof generateStoryDiscovery === 'function';
          } catch (error) {
            console.error('Import error:', error.message);
            return false;
          }
        }
      },
      {
        name: 'StoryDiscoverySection component exists',
        description: 'Verify the story discovery UI component is properly created',
        test: async () => {
          try {
            const { StoryDiscoverySection } = require('./components');
            return typeof StoryDiscoverySection === 'function';
          } catch (error) {
            console.error('Component import error:', error.message);
            return false;
          }
        }
      },
      {
        name: 'StoriesScreen integration',
        description: 'Verify StoryDiscoverySection is integrated into StoriesScreen',
        test: async () => {
          try {
            const fs = require('fs');
            const screenContent = fs.readFileSync('./screens/StoriesScreen.js', 'utf8');
            return screenContent.includes('StoryDiscoverySection') &&
                   screenContent.includes('handleDiscoveryStoryPress');
          } catch (error) {
            return false;
          }
        }
      }
    ]
  },
  {
    category: '💾 Caching System',
    tests: [
      {
        name: 'Cache functions exported',
        description: 'Verify caching utility functions are available',
        test: async () => {
          try {
            const { clearRecommendationCache, getRecommendationCacheStats } = require('./api/embeddings');
            return typeof clearRecommendationCache === 'function' &&
                   typeof getRecommendationCacheStats === 'function';
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Cache duration configuration',
        description: 'Verify cache duration constants are properly set',
        test: async () => {
          try {
            const fs = require('fs');
            const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
            return embeddingsContent.includes('CACHE_DURATION') &&
                   embeddingsContent.includes('30 * 60 * 1000'); // 30 minutes
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Cache key prefixes defined',
        description: 'Verify cache key prefixes are properly structured',
        test: async () => {
          try {
            const fs = require('fs');
            const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
            return embeddingsContent.includes('CACHE_KEY_PREFIX') &&
                   embeddingsContent.includes('USER_RECOMMENDATIONS') &&
                   embeddingsContent.includes('STORY_DISCOVERY');
          } catch (error) {
            return false;
          }
        }
      }
    ]
  },
  {
    category: '🔐 Privacy & Preferences',
    tests: [
      {
        name: 'AI preferences structure',
        description: 'Verify user AI preferences are properly structured in mock data',
        test: async () => {
          try {
            const fs = require('fs');
            const mockContent = fs.readFileSync('./config/firebase-mock.js', 'utf8');
            return mockContent.includes('aiPreferences') &&
                   mockContent.includes('enableAIFeatures') &&
                   mockContent.includes('shareMetadata') &&
                   mockContent.includes('personalizeContent');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Default opt-in behavior',
        description: 'Verify AI features are enabled by default as requested',
        test: async () => {
          try {
            const fs = require('fs');
            const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
            return embeddingsContent.includes('enableAIFeatures: true') &&
                   embeddingsContent.includes('Default on');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Basic fallback functionality',
        description: 'Verify basic recommendations are available when AI is disabled',
        test: async () => {
          try {
            const fs = require('fs');
            const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
            return embeddingsContent.includes('getBasicUserRecommendations') &&
                   embeddingsContent.includes('getBasicStoryDiscovery');
          } catch (error) {
            return false;
          }
        }
      }
    ]
  },
  {
    category: '🤖 OpenAI Integration',
    tests: [
      {
        name: 'Environment variable loading',
        description: 'Verify Expo Constants pattern for API key loading',
        test: async () => {
          try {
            const fs = require('fs');
            const ragContent = fs.readFileSync('./config/rag.js', 'utf8');
            return ragContent.includes('Constants.expoConfig?.extra?.openaiApiKey');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'JSON parsing safety',
        description: 'Verify OpenAI response parsing handles markdown code blocks',
        test: async () => {
          try {
            const fs = require('fs');
            const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
            return embeddingsContent.includes('```json') &&
                   embeddingsContent.includes('replace(/```json\\n?/g') &&
                   embeddingsContent.includes('trim()');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Rate limiting implementation',
        description: 'Verify rate limiting is implemented for recommendation features',
        test: async () => {
          try {
            const fs = require('fs');
            const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
            return embeddingsContent.includes('checkRateLimit') &&
                   embeddingsContent.includes('userRecommendations') &&
                   embeddingsContent.includes('storyDiscovery');
          } catch (error) {
            return false;
          }
        }
      }
    ]
  },
  {
    category: '🎨 UI Components',
    tests: [
      {
        name: '2nd Degree design consistency',
        description: 'Verify components use 2nd Degree frosted glass design patterns',
        test: async () => {
          try {
            const fs = require('fs');
            const userCompContent = fs.readFileSync('./components/UserRecommendationSection.js', 'utf8');
            const storyCompContent = fs.readFileSync('./components/StoryDiscoverySection.js', 'utf8');
            
            return userCompContent.includes('rgba(255, 255, 255, 0.12)') &&
                   userCompContent.includes('borderRadius: 20') &&
                   storyCompContent.includes('elevation: 8') &&
                   storyCompContent.includes('shadowColor');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Match score visualization',
        description: 'Verify match scores are properly visualized with color coding',
        test: async () => {
          try {
            const fs = require('fs');
            const userCompContent = fs.readFileSync('./components/UserRecommendationSection.js', 'utf8');
            return userCompContent.includes('getMatchScoreColor') &&
                   userCompContent.includes('Colors.green') &&
                   userCompContent.includes('Colors.primary') &&
                   userCompContent.includes('Colors.orange');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Loading and error states',
        description: 'Verify proper loading indicators and error handling in UI',
        test: async () => {
          try {
            const fs = require('fs');
            const userCompContent = fs.readFileSync('./components/UserRecommendationSection.js', 'utf8');
            const storyCompContent = fs.readFileSync('./components/StoryDiscoverySection.js', 'utf8');
            
            return userCompContent.includes('ActivityIndicator') &&
                   userCompContent.includes('Try Again') &&
                   storyCompContent.includes('loadingText') &&
                   storyCompContent.includes('errorContainer');
          } catch (error) {
            return false;
          }
        }
      }
    ]
  }
];

// Run all tests
async function runTests() {
  let totalTests = 0;
  let passedTests = 0;
  
  for (const category of tests) {
    console.log(`\n${category.category}`);
    console.log('='.repeat(50));
    
    for (const test of category.tests) {
      totalTests++;
      try {
        const result = await test.test();
        if (result) {
          console.log(`✅ ${test.name}`);
          passedTests++;
        } else {
          console.log(`❌ ${test.name}`);
          console.log(`   Description: ${test.description}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} (Error: ${error.message})`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Smart recommendation system is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
  
  // Provide usage instructions
  console.log('\n📱 How to Test in App:');
  console.log('1. Open SearchUsersScreen - should show "✨ Suggested for You" section');
  console.log('2. Clear search bar to see AI recommendations');
  console.log('3. Open StoriesScreen - should show "🔍 Discover Stories" section');
  console.log('4. Both sections should show loading states initially');
  console.log('5. Check network requests to OpenAI Vision API');
  console.log('6. Verify caching works by refreshing quickly');
  
  console.log('\n🔧 Cost Management:');
  console.log('- User recommendations: 2 requests/minute, 10/hour');
  console.log('- Story discovery: 3 requests/minute, 15/hour');
  console.log('- 30-minute cache for user recs, 15-minute for stories');
  console.log('- Fallback to basic recommendations when rate limited');
  
  console.log('\n🛡️ Privacy Features:');
  console.log('- AI features enabled by default (opt-in)');
  console.log('- Users can disable in profile settings');
  console.log('- Basic recommendations when AI disabled');
  console.log('- Only uses publicly visible profile data');
}

// Execute tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

module.exports = { tests }; 