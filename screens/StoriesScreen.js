import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { getFeedPosts, getUserProfile } from '../api';
import { GradientBackground, StoryDiscoverySection } from '../components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const StoriesScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [stories, setStories] = useState([]);
  const [persistedStories, setPersistedStories] = useState([]); // Stories that persist during reloads
  const [userProfiles, setUserProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef(true);
  // Keep a ref to the current stories to access in callbacks
  const storiesRef = React.useRef([]);
  // Track if we're currently loading to prevent multiple simultaneous loads
  const isLoadingRef = React.useRef(false);

  // Update the ref whenever stories change
  React.useEffect(() => {
    console.log('[StoriesScreen] 📊 Stories state changed:', stories.length, 'stories');
    console.log('[StoriesScreen] 📊 Story IDs:', stories.map(s => s.authorId));
    storiesRef.current = stories;
    // Update persisted stories only when we have actual stories
    if (stories.length > 0) {
      setPersistedStories(stories);
    }
  }, [stories]);

  // Debug when isLoading changes
  React.useEffect(() => {
    console.log('[StoriesScreen] 🔄 Loading state changed:', isLoading);
  }, [isLoading]);

  // Use useFocusEffect to reload stories when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[StoriesScreen] 🔄 Screen focused - current stories count:', storiesRef.current.length);
      console.log('[StoriesScreen] 🔄 Is mounted:', isMountedRef.current);
      console.log('[StoriesScreen] 🔄 Is loading:', isLoadingRef.current);
      isMountedRef.current = true;
      
      // Only load if not already loading
      if (!isLoadingRef.current) {
        loadStories();
      }
      
      // Cleanup function
      return () => {
        console.log('[StoriesScreen] 🔚 Screen unfocused - preserving', storiesRef.current.length, 'stories');
        isMountedRef.current = false;
      };
    }, []) // Empty dependency array
  );
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, []);

  const loadStories = async () => {
    try {
      if (!isMountedRef.current) {
        console.log('[StoriesScreen] Component unmounted, skipping load');
        return;
      }
      
      if (isLoadingRef.current) {
        console.log('[StoriesScreen] Already loading, skipping duplicate load');
        return;
      }
      
      isLoadingRef.current = true;
      setIsLoading(true);
      console.log('[StoriesScreen] ========== LOADING STORIES ==========');
      console.log('[StoriesScreen] Current user:', user.uid);
      console.log('[StoriesScreen] Current stories before reload:', storiesRef.current.length);
      console.log('[StoriesScreen] Story authors before reload:', storiesRef.current.map(s => s.authorId));
      console.log('[StoriesScreen] Persisted stories:', persistedStories.length);
      
      const userProfile = await getUserProfile(user.uid);
      console.log('[StoriesScreen] User profile loaded:', userProfile?.username);
      
      const friendIds = userProfile?.friendIds || [];
      console.log('[StoriesScreen] Friend IDs:', friendIds);
      
      // Get recent posts as "stories"
      const feedPosts = await getFeedPosts(user.uid, friendIds);
      console.log('[StoriesScreen] Raw feed posts returned:', feedPosts);
      console.log('[StoriesScreen] Feed posts length:', feedPosts?.length || 0);
      
      if (!isMountedRef.current) {
        console.log('[StoriesScreen] Component unmounted during load, aborting');
        return;
      }
      
      if (!feedPosts || feedPosts.length === 0) {
        console.log('[StoriesScreen] ⚠️ No feed posts returned!');
        // If we had stories before, keep them
        if (storiesRef.current.length > 0) {
          console.log('[StoriesScreen] 📌 Keeping existing stories:', storiesRef.current.length);
          // Don't clear stories, just update loading state
        } else {
          // Only set the "Your Story" bubble if we truly have no stories
          const ownStoryBubble = {
            authorId: user.uid,
            posts: [],
            hasViewed: true,
          };
          if (isMountedRef.current) {
            setStories([ownStoryBubble]);
          }
        }
        return;
      }
      
      // Group posts by author to create story format
      const groupedStories = {};
      feedPosts.forEach(post => {
        if (!groupedStories[post.authorUid]) {
          groupedStories[post.authorUid] = [];
        }
        groupedStories[post.authorUid].push(post);
      });
      
      console.log('[StoriesScreen] Grouped stories by author:', Object.keys(groupedStories));

      const storyList = Object.keys(groupedStories).map(authorId => ({
        authorId,
        posts: groupedStories[authorId],
        hasViewed: groupedStories[authorId].every(post => 
          post.viewedBy?.includes(user.uid)
        ),
      }));

      console.log('[StoriesScreen] Story list created:', storyList.length, 'stories');
      console.log('[StoriesScreen] Story authors:', storyList.map(s => s.authorId));
      
      if (isMountedRef.current) {
        // Use functional setState to ensure we're not overwriting concurrent updates
        setStories(() => storyList);
        console.log('[StoriesScreen] ✅ Stories state updated');
      }
      
      // Load author profiles
      const profiles = {};
      for (const authorId of Object.keys(groupedStories)) {
        const profile = await getUserProfile(authorId);
        if (profile) {
          profiles[authorId] = profile;
        }
      }
      
      if (isMountedRef.current) {
        setUserProfiles(() => profiles);
        console.log('[StoriesScreen] User profiles loaded:', Object.keys(profiles));
      }
      
      console.log('[StoriesScreen] ========== LOADING COMPLETE ==========');
    } catch (error) {
      console.error('[StoriesScreen] ❌ Error loading stories:', error);
      console.error('[StoriesScreen] Error details:', error.message);
      console.error('[StoriesScreen] Error stack:', error.stack);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isLoadingRef.current = false;
    }
  };

  const renderStoryBubble = ({ item }) => {
    const author = userProfiles[item.authorId] || {};
    const isOwnStory = item.authorId === user.uid;
    
    return (
      <TouchableOpacity
        style={styles.storyBubble}
        onPress={() => openStoryViewer(item)}
      >
        <View style={[
          styles.storyImageContainer,
          item.hasViewed ? styles.viewedBubble : styles.unviewedBubble,
        ]}>
          <Image
            source={{ uri: item.posts[0]?.mediaUrl }}
            style={styles.storyImage}
          />
          {isOwnStory && (
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={20} color={Colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {isOwnStory ? 'Your Story' : (author.username || 'Unknown')}
        </Text>
      </TouchableOpacity>
    );
  };

  const openStoryViewer = (story) => {
    // Navigate to StoryViewer with all stories starting from the selected one
    const storyIndex = stories.findIndex(s => s.authorId === story.authorId);
    
    navigation.navigate('StoryViewer', {
      stories: stories,
      initialIndex: storyIndex,
      userProfiles: userProfiles,
    });
  };

  const handleDiscoveryStoryPress = (story, recommendation) => {
    // Navigate to story viewer with discovery story
    navigation.navigate('StoryViewer', {
      stories: [{ 
        authorId: story.authorUid,
        posts: [story],
        hasViewed: false
      }],
      initialIndex: 0,
      userProfiles: userProfiles,
      isDiscovery: true,
      recommendationContext: {
        reason: recommendation.reason,
        discoveryValue: recommendation.discoveryValue,
        engagementScore: recommendation.engagementScore
      }
    });
  };

  const forceReload = async () => {
    console.log('[StoriesScreen] 🔄 Manual refresh triggered');
    // Clear stories to show loading state
    setStories([]);
    // Load fresh data
    await loadStories();
  };

  return (
    <GradientBackground gradientType="darkSwirl" style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with frosted glass */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={forceReload} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Camera')} style={styles.headerButton}>
            <Ionicons name="camera" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content - Using separate containers to prevent conflicts */}
      <View style={styles.mainContent}>
        {/* Stories List Container */}
        <View style={styles.storiesSection}>
          <Text style={styles.sectionTitle}>Your Feed</Text>
          {isLoading && stories.length === 0 && persistedStories.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading stories...</Text>
            </View>
          ) : (stories.length > 0 || persistedStories.length > 0) ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContainer}
            >
              {(stories.length > 0 ? stories : persistedStories).map((story) => (
                <View key={`story-${story.authorId}`}>
                  {renderStoryBubble({ item: story })}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noStoriesContainer}>
              <Text style={styles.noStoriesText}>No stories to show</Text>
            </View>
          )}
        </View>

        {/* AI-Powered Discovery Section */}
        <View style={styles.discoverScrollView}>
          <View style={styles.discoverSectionContainer}>
            <StoryDiscoverySection
              navigation={navigation}
              onStoryPress={handleDiscoveryStoryPress}
              limit={8}
              showHeader={true}
              style={styles.discoverSection}
            />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60, // Account for translucent status bar
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Frosted glass effect
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  mainContent: {
    flex: 1,
  },
  storiesSection: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  storyBubble: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  storyImageContainer: {
    position: 'relative',
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storyImage: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  unviewedBubble: {
    borderWidth: 3,
    borderColor: Colors.primary,
    padding: 0,
  },
  viewedBubble: {
    borderWidth: 2,
    borderColor: Colors.gray,
    padding: 0,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.snapYellow,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  storyUsername: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 14,
    marginTop: 8,
  },
  noStoriesContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  noStoriesText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  discoverScrollView: {
    flex: 1,
  },
  discoverSectionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    minHeight: 400, // Minimum height to ensure content is visible
  },
  discoverSection: {
    minHeight: 350, // Ensure discovery section has adequate height
  },
});

export default StoriesScreen; 