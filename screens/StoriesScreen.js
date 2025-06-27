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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { getFeedPosts, getUserProfile } from '../api';
import { GradientBackground, StoryDiscoverySection } from '../components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const StoriesScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [stories, setStories] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const userProfile = await getUserProfile(user.uid);
      const friendIds = userProfile?.friendIds || [];
      
      // Get recent posts as "stories"
      const feedPosts = await getFeedPosts(user.uid, friendIds);
      
      // Group posts by author to create story format
      const groupedStories = {};
      feedPosts.forEach(post => {
        if (!groupedStories[post.authorUid]) {
          groupedStories[post.authorUid] = [];
        }
        groupedStories[post.authorUid].push(post);
      });

      const storyList = Object.keys(groupedStories).map(authorId => ({
        authorId,
        posts: groupedStories[authorId],
        hasViewed: groupedStories[authorId].every(post => 
          post.viewedBy?.includes(user.uid)
        ),
      }));

      setStories(storyList);
      
      // Load author profiles
      const profiles = {};
      for (const authorId of Object.keys(groupedStories)) {
        const profile = await getUserProfile(authorId);
        if (profile) {
          profiles[authorId] = profile;
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error('[StoriesScreen] Error loading stories:', error);
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

  return (
    <GradientBackground gradientType="darkSwirl" style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with frosted glass */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Camera')}>
          <Ionicons name="camera" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stories List */}
      <FlatList
        data={stories}
        renderItem={renderStoryBubble}
        keyExtractor={(item) => item.authorId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      />

      {/* AI-Powered Discovery Section */}
      <View style={styles.discoverSectionContainer}>
        <StoryDiscoverySection
          navigation={navigation}
          onStoryPress={handleDiscoveryStoryPress}
          limit={8}
          showHeader={true}
          style={styles.discoverSection}
        />
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
  discoverSectionContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  discoverSection: {
    flex: 1,
  },
});

export default StoriesScreen; 