// Quick verification test for Story Discovery Fix
// Run this in Expo console to see the fix working

import { Alert } from 'react-native';

export const verifyStoryDiscoveryFix = async () => {
  console.log('🔧 Verifying Story Discovery Fix...');
  
  try {
    const { generateStoryDiscovery } = await import('./api/embeddings');
    const testUserId = '12345'; // Test user
    
    console.log('📊 Running story discovery for test user...');
    
    const result = await generateStoryDiscovery(testUserId, {
      limit: 8,
      includeAnalysis: true
    });
    
    console.log('\n✅ Story Discovery Result:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Stories found: ${result.stories?.length || 0}`);
    console.log(`- Analysis: ${result.analysis}`);
    
    if (result.success && result.stories && result.stories.length > 0) {
      console.log('\n🎯 Story Recommendations:');
      result.stories.forEach((rec, index) => {
        console.log(`${index + 1}. Post ${rec.story?.id} by ${rec.story?.authorUid}:`);
        console.log(`   - Caption: "${rec.story?.caption}"`);
        console.log(`   - Visibility: ${rec.story?.visibility}`);
        console.log(`   - Engagement Score: ${rec.engagementScore}%`);
        console.log(`   - Reason: ${rec.reason}`);
        console.log(`   - Discovery Value: ${rec.discoveryValue}`);
        console.log('');
      });
      
      const report = `✅ Story Discovery Fix SUCCESSFUL!\n\nFound ${result.stories.length} story recommendations\n\nCheck console for detailed results.`;
      Alert.alert('✅ Fix Verified', report);
      
      return true;
    } else {
      const errorReport = `❌ Story Discovery still not working:\n\n${result.error || 'No stories returned'}\n\nCheck console logs for details.`;
      Alert.alert('❌ Fix Not Working', errorReport);
      
      return false;
    }
    
  } catch (error) {
    const errorMessage = `❌ Verification failed: ${error.message}`;
    console.error(errorMessage);
    Alert.alert('❌ Test Error', errorMessage);
    return false;
  }
};

// Quick data inspection to see what posts exist
export const inspectTestData = async () => {
  console.log('🔍 Inspecting Test Data for Story Discovery...');
  
  try {
    const { db } = require('./config');
    const { getUserProfile } = require('./api/users');
    
    // Get test user info
    const testUser = await getUserProfile('12345');
    console.log('👤 Test User Friends:', testUser.friendIds);
    
    // Get all posts
    const snapshot = await db.collection('posts').get();
    const posts = [];
    
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📝 Total Posts: ${posts.length}`);
    
    // Categorize posts
    const friendPosts = posts.filter(p => testUser.friendIds.includes(p.authorUid));
    const nonFriendPosts = posts.filter(p => p.authorUid !== '12345' && !testUser.friendIds.includes(p.authorUid));
    const publicPosts = posts.filter(p => p.visibility === 'public');
    const friendsOfFriendsPosts = posts.filter(p => p.visibility === 'friendsOfFriends');
    
    console.log('\n📊 Post Categories:');
    console.log(`- Friend posts: ${friendPosts.length}`);
    console.log(`- Non-friend posts: ${nonFriendPosts.length}`);
    console.log(`- Public posts: ${publicPosts.length}`);
    console.log(`- FriendsOfFriends posts: ${friendsOfFriendsPosts.length}`);
    
    // Check discoverable posts
    const discoverablePosts = posts.filter(p => {
      const isNonFriend = p.authorUid !== '12345' && !testUser.friendIds.includes(p.authorUid);
      const isDiscoverable = ['public', 'friendsOfFriends'].includes(p.visibility);
      return isNonFriend && isDiscoverable;
    });
    
    console.log(`\n🎯 Discoverable Posts: ${discoverablePosts.length}`);
    discoverablePosts.forEach(post => {
      console.log(`  - ${post.id} by ${post.authorUid}: "${post.caption}" (${post.visibility})`);
    });
    
    const report = `📊 Test Data Inspection:\n\nTotal Posts: ${posts.length}\nDiscoverable Posts: ${discoverablePosts.length}\n\n${discoverablePosts.length > 0 ? '✅ Data looks good for discovery!' : '❌ No discoverable posts found'}`;
    Alert.alert('📊 Data Inspection', report);
    
    return discoverablePosts.length > 0;
    
  } catch (error) {
    console.error('Data inspection failed:', error);
    Alert.alert('❌ Inspection Error', error.message);
    return false;
  }
};

export default { verifyStoryDiscoveryFix, inspectTestData }; 