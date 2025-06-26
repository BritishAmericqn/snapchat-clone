import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { viewPost } from '../api';
import { VideoPlayer } from '../components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const StoryViewerScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const { stories, initialIndex, userProfiles } = route.params;
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex || 0);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  
  // Get current story and post
  const currentStory = stories[currentStoryIndex];
  const currentPost = currentStory?.posts[currentPostIndex];
  const author = userProfiles[currentStory?.authorId] || {};
  
  useEffect(() => {
    // Mark post as viewed
    if (currentPost && currentPost.authorUid !== user.uid && !currentPost.viewedBy?.includes(user.uid)) {
      viewPost(currentPost.postId, user.uid);
    }
    
    // Auto-advance after 5 seconds
    const timer = setTimeout(() => {
      handleNext();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [currentStoryIndex, currentPostIndex]);
  
  const handleNext = () => {
    if (currentPostIndex < currentStory.posts.length - 1) {
      // Next post in current story
      setCurrentPostIndex(currentPostIndex + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      // Next story
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentPostIndex(0);
    } else {
      // End of all stories
      navigation.goBack();
    }
  };
  
  const handlePrevious = () => {
    if (currentPostIndex > 0) {
      // Previous post in current story
      setCurrentPostIndex(currentPostIndex - 1);
    } else if (currentStoryIndex > 0) {
      // Previous story
      setCurrentStoryIndex(currentStoryIndex - 1);
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentPostIndex(prevStory.posts.length - 1);
    }
  };
  
  const handleClose = () => {
    navigation.goBack();
  };
  
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Story Media */}
      {currentPost?.mediaType === 'video' ? (
        <VideoPlayer
          source={{ uri: currentPost?.mediaUrl }}
          style={styles.storyMedia}
          showControls={false}
          autoPlay={true}
          isMuted={true}
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            // Auto-advance when video ends if not manually controlling
            if (status.didJustFinish) {
              handleNext();
            }
          }}
        />
      ) : (
        <Image
          source={{ uri: currentPost?.mediaUrl }}
          style={styles.storyMedia}
          resizeMode="contain"
        />
      )}
      
      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {currentStory?.posts.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              index < currentPostIndex && styles.progressBarCompleted,
              index === currentPostIndex && styles.progressBarActive,
            ]}
          />
        ))}
      </View>
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.authorInfo}>
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarText}>
                {author.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.authorName}>
              {author.username || 'Unknown'}
            </Text>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(currentPost?.createdAt)}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={30} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      {/* Touch areas */}
      <View style={styles.touchContainer}>
        <TouchableOpacity
          style={styles.touchLeft}
          onPress={handlePrevious}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.touchRight}
          onPress={handleNext}
          activeOpacity={1}
        />
      </View>
      
      {/* Caption */}
      {currentPost?.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{currentPost.caption}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 2,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 1.5,
  },
  progressBarCompleted: {
    backgroundColor: Colors.white,
  },
  progressBarActive: {
    backgroundColor: Colors.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.snapYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorName: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  timeAgo: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  touchContainer: {
    position: 'absolute',
    top: 100,
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 1,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
  },
  caption: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default StoryViewerScreen; 