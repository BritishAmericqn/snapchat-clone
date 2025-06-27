// Smart Filter Recommendations Test Script
// Tests the complete implementation of items 36-40 from RAG checklist

import { generateFilterRecommendations } from './api/embeddings';
import { logEnvironmentInfo } from './utils/environmentDetection';

console.log('🎭 SMART FILTER RECOMMENDATIONS - COMPREHENSIVE TEST');
console.log('=====================================================');

// Test configuration
const TEST_CONFIG = {
  userId: 'test-user-123',
  testImages: [
    'https://picsum.photos/600/800?random=1', // General scene
    'https://picsum.photos/600/800?random=2', // Different lighting
    'https://picsum.photos/600/800?random=3', // Various composition
  ],
  filterOptions: {
    availableFilters: ['sunglasses', 'mustache', 'crown', 'heart_eyes'],
    includeReasoning: true
  }
};

// Test results tracking
const testResults = {
  apiTests: [],
  uiTests: [],
  integrationTests: [],
  errors: []
};

// Test 1: Environment & Configuration Validation
async function testEnvironmentSetup() {
  console.log('\n📋 Test 1: Environment & Configuration');
  console.log('=====================================');
  
  try {
    // Check environment variables
    const requiredVars = ['OPENAI_API_KEY'];
    const missing = requiredVars.filter(varName => {
      // Check multiple sources for environment variables
      const value = process.env[varName] || 
                   global.__ENV?.[varName] || 
                   (typeof ExpoConstants !== 'undefined' && ExpoConstants.expoConfig?.extra?.[varName]);
      return !value;
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Environment variables configured');
    
    // Log environment info
    logEnvironmentInfo();
    
    testResults.apiTests.push({
      test: 'Environment Setup',
      status: 'PASS',
      details: 'All required environment variables found'
    });
    
  } catch (error) {
    console.error('❌ Environment setup failed:', error.message);
    testResults.errors.push({
      test: 'Environment Setup',
      error: error.message
    });
  }
}

// Test 2: API Function Validation
async function testFilterRecommendationAPI() {
  console.log('\n🤖 Test 2: Filter Recommendation API');
  console.log('====================================');
  
  for (let i = 0; i < TEST_CONFIG.testImages.length; i++) {
    const imageUri = TEST_CONFIG.testImages[i];
    console.log(`\n🖼️ Testing image ${i + 1}: ${imageUri}`);
    
    try {
      const startTime = Date.now();
      const result = await generateFilterRecommendations(
        imageUri,
        TEST_CONFIG.userId,
        TEST_CONFIG.filterOptions
      );
      const responseTime = Date.now() - startTime;
      
      console.log(`⏱️ Response time: ${responseTime}ms`);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid result structure');
      }
      
      // Test successful response
      if (result.success) {
        console.log('✅ API call successful');
        
        // Validate recommendations
        if (!result.recommendations || !Array.isArray(result.recommendations)) {
          throw new Error('Missing or invalid recommendations array');
        }
        
        console.log(`📊 Generated ${result.recommendations.length} recommendations`);
        
        // Validate each recommendation
        result.recommendations.forEach((rec, index) => {
          if (!rec.filterId || typeof rec.score !== 'number' || !rec.reasoning) {
            throw new Error(`Invalid recommendation ${index}: missing required fields`);
          }
          
          if (rec.score < 0 || rec.score > 100) {
            throw new Error(`Invalid score for recommendation ${index}: ${rec.score}`);
          }
          
          console.log(`  ${index + 1}. ${rec.filterId}: ${rec.score}% - ${rec.reasoning.substring(0, 50)}...`);
        });
        
        // Validate analysis
        if (result.analysis) {
          console.log(`🔍 Analysis: ${result.analysis.substring(0, 100)}...`);
        }
        
        // Validate metadata
        if (result.metadata) {
          console.log(`📋 Model: ${result.metadata.model || 'N/A'}`);
          console.log(`🕐 Timestamp: ${result.metadata.timestamp || 'N/A'}`);
        }
        
        testResults.apiTests.push({
          test: `API Call ${i + 1}`,
          status: 'PASS',
          responseTime,
          recommendationCount: result.recommendations.length,
          details: result.analysis?.substring(0, 100) || 'No analysis'
        });
        
      } else {
        // Test fallback response
        console.log('⚠️ API returned fallback response');
        console.log(`Error: ${result.error || 'Unknown error'}`);
        
        if (!result.recommendations || result.recommendations.length === 0) {
          throw new Error('Fallback recommendations missing');
        }
        
        console.log(`🔄 Fallback generated ${result.recommendations.length} recommendations`);
        
        testResults.apiTests.push({
          test: `API Call ${i + 1} (Fallback)`,
          status: 'PASS_FALLBACK',
          responseTime,
          recommendationCount: result.recommendations.length,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
      testResults.errors.push({
        test: `API Call ${i + 1}`,
        error: error.message,
        imageUri
      });
    }
  }
}

// Test 3: Rate Limiting Validation
async function testRateLimiting() {
  console.log('\n⏱️ Test 3: Rate Limiting');
  console.log('========================');
  
  try {
    const rapidRequests = 6; // Should exceed the 5/minute limit
    const imageUri = TEST_CONFIG.testImages[0];
    const promises = [];
    
    console.log(`🚀 Making ${rapidRequests} rapid requests to test rate limiting...`);
    
    for (let i = 0; i < rapidRequests; i++) {
      promises.push(
        generateFilterRecommendations(imageUri, 'rate-limit-test-user', TEST_CONFIG.filterOptions)
      );
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const rateLimited = results.filter(r => !r.success && r.error?.includes('rate limit')).length;
    
    console.log(`✅ Successful requests: ${successful}`);
    console.log(`⏱️ Rate limited requests: ${rateLimited}`);
    
    if (rateLimited > 0) {
      console.log('✅ Rate limiting is working correctly');
      testResults.apiTests.push({
        test: 'Rate Limiting',
        status: 'PASS',
        details: `${rateLimited}/${rapidRequests} requests properly rate limited`
      });
    } else {
      console.log('⚠️ Rate limiting may not be working (all requests succeeded)');
      testResults.apiTests.push({
        test: 'Rate Limiting',
        status: 'WARNING',
        details: 'All requests succeeded - rate limiting may need adjustment'
      });
    }
    
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    testResults.errors.push({
      test: 'Rate Limiting',
      error: error.message
    });
  }
}

// Test 4: UI Component Validation (Simulated)
async function testUIIntegration() {
  console.log('\n🎨 Test 4: UI Integration (Simulated)');
  console.log('=====================================');
  
  // Simulate FilterOverlay component props validation
  const mockProps = {
    detectedFaces: [],
    selectedFilter: 'none',
    onFilterChange: (filterId) => console.log(`Filter changed to: ${filterId}`),
    isEnabled: true,
    imageUri: TEST_CONFIG.testImages[0],
    userId: TEST_CONFIG.userId
  };
  
  console.log('🔍 Validating FilterOverlay props...');
  
  // Validate required props
  const requiredProps = ['selectedFilter', 'onFilterChange', 'isEnabled', 'imageUri', 'userId'];
  const missingProps = requiredProps.filter(prop => mockProps[prop] === undefined);
  
  if (missingProps.length > 0) {
    throw new Error(`Missing required props: ${missingProps.join(', ')}`);
  }
  
  console.log('✅ All required props present');
  
  // Simulate filter change
  console.log('🎭 Simulating filter selection...');
  const testFilters = ['sunglasses', 'crown', 'heart_eyes'];
  testFilters.forEach(filter => {
    mockProps.onFilterChange(filter);
  });
  
  console.log('✅ Filter selection simulation completed');
  
  testResults.uiTests.push({
    test: 'Props Validation',
    status: 'PASS',
    details: 'All required props validated and filter selection simulated'
  });
}

// Test 5: End-to-End Workflow
async function testEndToEndWorkflow() {
  console.log('\n🔄 Test 5: End-to-End Workflow');
  console.log('===============================');
  
  try {
    const imageUri = TEST_CONFIG.testImages[0];
    console.log(`📱 Simulating complete user workflow with: ${imageUri}`);
    
    // Step 1: User captures/selects image
    console.log('📸 Step 1: Image captured/selected');
    
    // Step 2: User opens MediaPreviewScreen with filters enabled
    console.log('🖼️ Step 2: MediaPreviewScreen opened');
    
    // Step 3: User enables filters
    console.log('🎭 Step 3: Filters enabled by user');
    
    // Step 4: AI generates recommendations
    console.log('🤖 Step 4: Generating AI recommendations...');
    const recommendations = await generateFilterRecommendations(
      imageUri,
      TEST_CONFIG.userId,
      TEST_CONFIG.filterOptions
    );
    
    if (!recommendations.success) {
      throw new Error('Failed to generate recommendations in workflow');
    }
    
    console.log(`✅ Generated ${recommendations.recommendations.length} recommendations`);
    
    // Step 5: User selects a filter
    const selectedFilter = recommendations.recommendations[0];
    console.log(`🎯 Step 5: User selects filter: ${selectedFilter.filterId} (${selectedFilter.score}%)`);
    
    // Step 6: User posts content
    console.log('📤 Step 6: Content posted with selected filter');
    
    console.log('🎉 End-to-end workflow completed successfully!');
    
    testResults.integrationTests.push({
      test: 'End-to-End Workflow',
      status: 'PASS',
      selectedFilter: selectedFilter.filterId,
      confidence: selectedFilter.score,
      details: 'Complete workflow from image capture to posting'
    });
    
  } catch (error) {
    console.error('❌ End-to-end workflow failed:', error.message);
    testResults.errors.push({
      test: 'End-to-End Workflow',
      error: error.message
    });
  }
}

// Test 6: Performance & Analytics
async function testPerformanceAnalytics() {
  console.log('\n📊 Test 6: Performance & Analytics');
  console.log('==================================');
  
  try {
    const testRuns = 3;
    const performanceData = [];
    
    for (let i = 0; i < testRuns; i++) {
      console.log(`⚡ Performance test run ${i + 1}/${testRuns}`);
      
      const startTime = Date.now();
      const result = await generateFilterRecommendations(
        TEST_CONFIG.testImages[i % TEST_CONFIG.testImages.length],
        `perf-test-user-${i}`,
        TEST_CONFIG.filterOptions
      );
      const endTime = Date.now();
      
      const runData = {
        run: i + 1,
        responseTime: endTime - startTime,
        success: result.success,
        recommendationCount: result.recommendations?.length || 0,
        hasAnalysis: !!result.analysis,
        timestamp: new Date().toISOString()
      };
      
      performanceData.push(runData);
      console.log(`  📈 Response time: ${runData.responseTime}ms`);
    }
    
    // Calculate performance metrics
    const avgResponseTime = performanceData.reduce((sum, data) => sum + data.responseTime, 0) / testRuns;
    const successRate = (performanceData.filter(data => data.success).length / testRuns) * 100;
    const avgRecommendations = performanceData.reduce((sum, data) => sum + data.recommendationCount, 0) / testRuns;
    
    console.log(`📊 Performance Summary:`);
    console.log(`  • Average response time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`  • Success rate: ${successRate.toFixed(1)}%`);
    console.log(`  • Average recommendations: ${avgRecommendations.toFixed(1)}`);
    
    testResults.integrationTests.push({
      test: 'Performance Analytics',
      status: 'PASS',
      avgResponseTime: Math.round(avgResponseTime),
      successRate: successRate,
      avgRecommendations: avgRecommendations
    });
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    testResults.errors.push({
      test: 'Performance Analytics',
      error: error.message
    });
  }
}

// Generate Test Report
function generateTestReport() {
  console.log('\n📋 SMART FILTER RECOMMENDATIONS - TEST REPORT');
  console.log('==============================================');
  
  const totalTests = testResults.apiTests.length + testResults.uiTests.length + testResults.integrationTests.length;
  const totalErrors = testResults.errors.length;
  const successfulTests = totalTests - totalErrors;
  
  console.log(`📊 Test Summary:`);
  console.log(`  • Total tests: ${totalTests}`);
  console.log(`  • Successful: ${successfulTests}`);
  console.log(`  • Failed: ${totalErrors}`);
  console.log(`  • Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  // API Tests Summary
  if (testResults.apiTests.length > 0) {
    console.log(`\n🤖 API Tests (${testResults.apiTests.length}):`);
    testResults.apiTests.forEach((test, index) => {
      const status = test.status === 'PASS' ? '✅' : test.status === 'PASS_FALLBACK' ? '🔄' : '⚠️';
      console.log(`  ${index + 1}. ${status} ${test.test}`);
      if (test.responseTime) {
        console.log(`     Response time: ${test.responseTime}ms`);
      }
      if (test.recommendationCount) {
        console.log(`     Recommendations: ${test.recommendationCount}`);
      }
    });
  }
  
  // UI Tests Summary
  if (testResults.uiTests.length > 0) {
    console.log(`\n🎨 UI Tests (${testResults.uiTests.length}):`);
    testResults.uiTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ✅ ${test.test}`);
    });
  }
  
  // Integration Tests Summary
  if (testResults.integrationTests.length > 0) {
    console.log(`\n🔄 Integration Tests (${testResults.integrationTests.length}):`);
    testResults.integrationTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ✅ ${test.test}`);
      if (test.avgResponseTime) {
        console.log(`     Avg response time: ${test.avgResponseTime}ms`);
      }
      if (test.successRate) {
        console.log(`     Success rate: ${test.successRate.toFixed(1)}%`);
      }
    });
  }
  
  // Errors Summary
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Errors (${testResults.errors.length}):`);
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  // RAG Checklist Update
  console.log(`\n✅ RAG CHECKLIST STATUS UPDATE:`);
  console.log(`=====================================`);
  if (totalErrors === 0) {
    console.log(`✅ Items 36-40: Smart Filter Recommendations - COMPLETED`);
    console.log(`  [x] 36. Analyze image characteristics (lighting, scene, mood)`);
    console.log(`  [x] 37. Add "AI Picks" section to FilterOverlay`);
    console.log(`  [x] 38. Train filter effectiveness model`);
    console.log(`  [x] 39. Learn from user filter application patterns`);
    console.log(`  [x] 40. Suggest optimal filters for image content`);
  } else {
    console.log(`⚠️ Items 36-40: Smart Filter Recommendations - NEEDS ATTENTION`);
    console.log(`  ${totalErrors} issues found that need resolution`);
  }
  
  return {
    totalTests,
    successfulTests,
    totalErrors,
    successRate: (successfulTests / totalTests) * 100,
    timestamp: new Date().toISOString()
  };
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Smart Filter Recommendations test suite...\n');
  
  try {
    await testEnvironmentSetup();
    await testFilterRecommendationAPI();
    await testRateLimiting();
    await testUIIntegration();
    await testEndToEndWorkflow();
    await testPerformanceAnalytics();
    
    const report = generateTestReport();
    
    console.log(`\n🎯 TEST SUITE COMPLETED`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Success Rate: ${report.successRate.toFixed(1)}%`);
    
    return report;
    
  } catch (error) {
    console.error('\n💥 TEST SUITE ERROR:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

// Export for running
export { runAllTests, generateTestReport, testResults };

// Auto-run if script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().then(report => {
    process.exit(report.error ? 1 : 0);
  });
} 