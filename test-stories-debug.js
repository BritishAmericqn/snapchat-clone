// Test to debug why stories aren't showing
import { Alert } from 'react-native';

export const debugStoriesIssue = async () => {
  console.log('🔍 Debugging Stories Display Issue...');
  
  try {
    // Import necessary modules
    const { getUserProfile, getFeedPosts } = await import('./api');
    const { auth } = await import('./config');
    
    const results = {
      currentUser: null,
      userProfile: null,
      friends: [],
      posts: [],
      groupedStories: {},
      errors: []
    };
    
    // Step 1: Check current user
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        results.errors.push('No user logged in');
        throw new Error('No user logged in');
      }
      results.currentUser = currentUser.uid;
      console.log('✅ Current user:', currentUser.uid);
    } catch (error) {
      console.error('❌ Current user error:', error);
      results.errors.push(`Current user error: ${error.message}`);
    }
    
    // Step 2: Get user profile
    try {
      const userProfile = await getUserProfile(results.currentUser);
      if (!userProfile) {
        results.errors.push('User profile not found');
        throw new Error('User profile not found');
      }
      results.userProfile = userProfile;
      results.friends = userProfile.friendIds || [];
      console.log('✅ User profile loaded, friends:', results.friends);
    } catch (error) {
      console.error('❌ User profile error:', error);
      results.errors.push(`User profile error: ${error.message}`);
    }
    
    // Step 3: Get feed posts
    try {
      const feedPosts = await getFeedPosts(results.currentUser, results.friends);
      results.posts = feedPosts;
      console.log('✅ Feed posts loaded:', feedPosts.length);
      
      // Log post details
      feedPosts.forEach((post, index) => {
        console.log(`Post ${index + 1}:`, {
          id: post.id,
          author: post.authorUid,
          mediaUrl: post.mediaUrl,
          visibility: post.visibility,
          createdAt: post.createdAt,
          expiresAt: post.expiresAt
        });
      });
    } catch (error) {
      console.error('❌ Feed posts error:', error);
      results.errors.push(`Feed posts error: ${error.message}`);
    }
    
    // Step 4: Group posts by author (like StoriesScreen does)
    try {
      const groupedStories = {};
      results.posts.forEach(post => {
        if (!groupedStories[post.authorUid]) {
          groupedStories[post.authorUid] = [];
        }
        groupedStories[post.authorUid].push(post);
      });
      results.groupedStories = groupedStories;
      console.log('✅ Grouped stories:', Object.keys(groupedStories).length, 'users have stories');
    } catch (error) {
      console.error('❌ Grouping error:', error);
      results.errors.push(`Grouping error: ${error.message}`);
    }
    
    // Step 5: Check navigation state
    try {
      console.log('📱 Navigation check:');
      console.log('- MainPagerScreen should be the default screen');
      console.log('- StoriesScreen should be on page 2 (swipe left from camera)');
      console.log('- In Expo Go, using tab navigation instead of swipe');
    } catch (error) {
      console.error('❌ Navigation check error:', error);
    }
    
    // Generate report
    let report = '📊 Stories Debug Report:\n\n';
    
    if (results.currentUser) {
      report += `✅ User: ${results.currentUser}\n`;
    } else {
      report += '❌ No user logged in\n';
    }
    
    if (results.friends.length > 0) {
      report += `✅ Friends: ${results.friends.length} friends\n`;
    } else {
      report += '⚠️ No friends (stories will be empty)\n';
    }
    
    if (results.posts.length > 0) {
      report += `✅ Posts: ${results.posts.length} posts available\n`;
      report += `✅ Stories: ${Object.keys(results.groupedStories).length} users have stories\n`;
    } else {
      report += '❌ No posts found\n';
    }
    
    if (results.errors.length > 0) {
      report += '\n❌ Errors:\n';
      results.errors.forEach(error => {
        report += `- ${error}\n`;
      });
    }
    
    report += '\n💡 Troubleshooting:\n';
    report += '1. Make sure you are logged in as test@test.com\n';
    report += '2. Check that test user has friends\n';
    report += '3. Verify friends have posts\n';
    report += '4. Navigate to Stories tab (rightmost tab)\n';
    report += '5. Pull down to refresh if needed\n';
    
    console.log(report);
    Alert.alert('Stories Debug Report', report);
    
    return results;
    
  } catch (error) {
    const errorMessage = `Stories debug failed: ${error.message}`;
    console.error(errorMessage);
    Alert.alert('Debug Error', errorMessage);
    return null;
  }
};

// Additional helper to check mock data
export const checkMockData = async () => {
  console.log('🔍 Checking Mock Firebase Data...');
  
  try {
    const { db } = await import('./config');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    // Get all posts
    const postsSnapshot = await db.collection('posts').get();
    const posts = [];
    postsSnapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('📊 Mock Data Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Posts: ${posts.length}`);
    
    // Log user details
    users.forEach(user => {
      console.log(`User ${user.username}:`, {
        id: user.uid,
        friends: user.friendIds?.length || 0,
        email: user.email
      });
    });
    
    // Log post details
    posts.forEach(post => {
      console.log(`Post by ${post.authorUid}:`, {
        id: post.id,
        visibility: post.visibility,
        mediaUrl: post.mediaUrl,
        expiresAt: post.expiresAt
      });
    });
    
    const report = `Mock Data:\n${users.length} users\n${posts.length} posts`;
    Alert.alert('Mock Data Check', report);
    
  } catch (error) {
    console.error('Mock data check failed:', error);
    Alert.alert('Error', `Mock data check failed: ${error.message}`);
  }
};

export default debugStoriesIssue; 