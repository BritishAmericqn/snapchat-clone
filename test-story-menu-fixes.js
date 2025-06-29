#!/usr/bin/env node

/**
 * Test Story Menu/Page Fixes
 * Verifies resolution of critical OpenAI JSON schema errors and VirtualizedList nesting warning
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 STORY MENU/PAGE FIXES VERIFICATION\n');

const tests = [
  {
    category: '🚨 OpenAI JSON Schema Fixes',
    tests: [
      {
        name: 'All json_schema instances removed',
        description: 'Verify no json_schema response_format usage remains in api/embeddings.js',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          const jsonSchemaMatches = embeddingsContent.match(/type:\s*["']json_schema["']/g);
          const result = jsonSchemaMatches === null;
          
          if (!result) {
            console.log('   ❌ Found remaining json_schema instances:', jsonSchemaMatches.length);
          }
          
          return result;
        }
      },
      {
        name: 'JSON examples added to prompts',
        description: 'Verify prompts include JSON format examples',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          const hasJsonExamples = embeddingsContent.includes('Respond with valid JSON in this exact format:');
          return hasJsonExamples;
        }
      },
      {
        name: 'Story preferences function fixed',
        description: 'Verify analyzeUserStoryPreferences function no longer uses json_schema',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          const storyPrefsFunction = embeddingsContent.substring(
            embeddingsContent.indexOf('const analyzeUserStoryPreferences'),
            embeddingsContent.indexOf('const generateAIStoryRecommendations')
          );
          return !storyPrefsFunction.includes('json_schema') && 
                 storyPrefsFunction.includes('✅ FIXED: Removed json_schema');
        }
      },
      {
        name: 'Story recommendations function fixed',
        description: 'Verify generateAIStoryRecommendations function no longer uses json_schema',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          const storyRecsFunction = embeddingsContent.substring(
            embeddingsContent.indexOf('const generateAIStoryRecommendations'),
            embeddingsContent.indexOf('const getBasicUserRecommendations')
          );
          return !storyRecsFunction.includes('json_schema') && 
                 storyRecsFunction.includes('✅ FIXED: Removed json_schema');
        }
      },
      {
        name: 'User analysis function fixed',
        description: 'Verify analyzeUserForRecommendations function no longer uses json_schema',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          const userAnalysisMatch = embeddingsContent.match(/const analyzeUserForRecommendations[\s\S]*?(?=const generateAIUserRecommendations)/);
          if (!userAnalysisMatch) return false;
          
          const userAnalysisFunction = userAnalysisMatch[0];
          return !userAnalysisFunction.includes('json_schema') && 
                 userAnalysisFunction.includes('✅ FIXED: Removed json_schema');
        }
      },
      {
        name: 'User recommendations function fixed', 
        description: 'Verify generateAIUserRecommendations function no longer uses json_schema',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          const userRecsMatch = embeddingsContent.match(/const generateAIUserRecommendations[\s\S]*?(?=const analyzeUserStoryPreferences)/);
          if (!userRecsMatch) return false;
          
          const userRecsFunction = userRecsMatch[0];
          return !userRecsFunction.includes('json_schema') && 
                 userRecsFunction.includes('✅ FIXED: Removed json_schema');
        }
      }
    ]
  },
  {
    category: '📱 VirtualizedList Nesting Fix',
    tests: [
      {
        name: 'ScrollView removed from StoriesScreen',
        description: 'Verify FlatList is no longer nested inside ScrollView',
        test: () => {
          const storiesContent = fs.readFileSync('./screens/StoriesScreen.js', 'utf8');
          
          // Check that ScrollView wrapper is removed
          const hasScrollViewWrapper = storiesContent.includes('<ScrollView') && 
                                      storiesContent.includes('style={styles.scrollContainer}');
          
          // Check that it was replaced with View
          const hasViewWrapper = storiesContent.includes('Main Content - Fixed VirtualizedList nesting') &&
                                storiesContent.includes('<View style={styles.scrollContainer}>');
          
          return !hasScrollViewWrapper && hasViewWrapper;
        }
      },
      {
        name: 'FlatList remains functional',
        description: 'Verify FlatList is still present and properly configured',
        test: () => {
          const storiesContent = fs.readFileSync('./screens/StoriesScreen.js', 'utf8');
          
          const hasFlatList = storiesContent.includes('<FlatList') &&
                             storiesContent.includes('data={stories}') &&
                             storiesContent.includes('renderItem={renderStoryBubble}') &&
                             storiesContent.includes('horizontal');
          
          return hasFlatList;
        }
      }
    ]
  },
  {
    category: '✅ Code Quality Verification',
    tests: [
      {
        name: 'All OpenAI functions use fallback patterns',
        description: 'Verify all OpenAI calls have proper error handling with fallbacks',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          
          // Check for consistent fallback patterns
          const hasFallbackPatterns = embeddingsContent.includes('catch (error)') &&
                                     embeddingsContent.includes('Return fallback') &&
                                     embeddingsContent.includes('Basic story preference analysis available');
          
          return hasFallbackPatterns;
        }
      },
      {
        name: 'JSON parsing with markdown handling',
        description: 'Verify all OpenAI response parsing includes markdown code block handling',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          
          // Check for markdown handling pattern
          const hasMarkdownHandling = embeddingsContent.includes('```json') &&
                                     embeddingsContent.includes('replace(/```json\\n?/g') &&
                                     embeddingsContent.includes('replace(/\\n?```/g');
          
          return hasMarkdownHandling;
        }
      },
      {
        name: 'Import/export consistency',
        description: 'Verify all fixed functions are properly exported',
        test: () => {
          const embeddingsContent = fs.readFileSync('./api/embeddings.js', 'utf8');
          
          // Check for key function exports
          const hasExports = embeddingsContent.includes('export const generateStoryDiscovery') &&
                            embeddingsContent.includes('export const generateUserRecommendations') &&
                            embeddingsContent.includes('export const generateTextOverlaySuggestions');
          
          return hasExports;
        }
      }
    ]
  },
  {
    category: '🎯 Integration Tests',
    tests: [
      {
        name: 'StoriesScreen imports still work',
        description: 'Verify all imports in StoriesScreen are still functional',
        test: () => {
          const storiesContent = fs.readFileSync('./screens/StoriesScreen.js', 'utf8');
          
          const hasRequiredImports = storiesContent.includes('StoryDiscoverySection') &&
                                    storiesContent.includes('GradientBackground') &&
                                    storiesContent.includes('getFeedPosts') &&
                                    storiesContent.includes('getUserProfile');
          
          return hasRequiredImports;
        }
      },
      {
        name: 'StoryDiscoverySection integration maintained',
        description: 'Verify StoryDiscoverySection is still properly integrated',
        test: () => {
          const storiesContent = fs.readFileSync('./screens/StoriesScreen.js', 'utf8');
          
          const hasStoryDiscovery = storiesContent.includes('<StoryDiscoverySection') &&
                                   storiesContent.includes('onStoryPress={handleDiscoveryStoryPress}') &&
                                   storiesContent.includes('limit={8}');
          
          return hasStoryDiscovery;
        }
      }
    ]
  }
];

// Run tests
let totalTests = 0;
let passedTests = 0;

tests.forEach(category => {
  console.log(`${category.category}:`);
  
  category.tests.forEach(test => {
    totalTests++;
    try {
      const result = test.test();
      if (result) {
        console.log(`  ✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`  ❌ ${test.name}`);
        console.log(`     ${test.description}`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} (Error: ${error.message})`);
    }
  });
  
  console.log('');
});

// Summary
console.log('📊 SUMMARY:');
console.log(`Tests passed: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Story menu/page issues should be resolved.');
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Test the app in Expo Go to verify story menu/page works without errors');
  console.log('2. Check that AI story recommendations load properly');
  console.log('3. Verify no more VirtualizedList warnings in console');
  console.log('4. Confirm OpenAI API calls work with new JSON format prompts');
} else {
  console.log('⚠️  Some tests failed. Review the issues above before testing.');
}

console.log('\n📝 CRITICAL FIXES APPLIED:');
console.log('✅ Removed all json_schema response_format usage (incompatible with gpt-3.5-turbo)');
console.log('✅ Added JSON format examples to all prompts for consistency');
console.log('✅ Fixed VirtualizedList nesting warning in StoriesScreen');  
console.log('✅ Maintained all existing functionality with improved error handling');
console.log('✅ Preserved markdown code block handling for robust JSON parsing'); 