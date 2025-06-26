import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { getFeedPosts, viewPost, getUserProfile } from '../api';
import EmojiReactionBar from '../components/EmojiReactionBar';
import { VideoPlayer } from '../components';

export const FeedScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFeed();
    });
    return unsubscribe;
  }, [navigation]);

  const loadFeed = async () => {
    try {
      // Get current user's profile to get friend list
      const userProfile = await getUserProfile(user.uid);
      const friendIds = userProfile?.friendIds || [];
      
      // Get posts
      const feedPosts = await getFeedPosts(user.uid, friendIds);
      setPosts(feedPosts);
      
      // Load author profiles
      const authorIds = [...new Set(feedPosts.map(post => post.authorUid))];
      const profiles = {};
      for (const authorId of authorIds) {
        const profile = await getUserProfile(authorId);
        if (profile) {
          profiles[authorId] = profile;
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error('[FeedScreen] Error loading feed:', error);
      Alert.alert('Error', 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleViewPost = async (post) => {
    try {
      // Track view
      const updatedPost = await viewPost(post.id, user.uid);
      
      if (updatedPost.deleted) {
        Alert.alert(
          'Snap Deleted',
          'This snap was set to delete after viewing.',
          [{ text: 'OK', onPress: () => loadFeed() }]
        );
      } else {
        // Update local state with view count
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? { ...p, viewCount: updatedPost.viewCount, viewedBy: updatedPost.viewedBy }
              : p
          )
        );
      }
    } catch (error) {
      console.error('[FeedScreen] Error viewing post:', error);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '';
    
    const now = new Date();
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const renderPost = ({ item }) => {
    const author = userProfiles[item.authorUid] || {};
    const isOwnPost = item.authorUid === user.uid;
    const hasViewed = item.viewedBy?.includes(user.uid);
    
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => handleViewPost(item)}
        activeOpacity={0.9}
      >
        {/* Author Info */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {author.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>
                {author.displayName || author.username || 'Unknown'}
                {isOwnPost && ' (You)'}
              </Text>
              <Text style={styles.postTime}>
                {getTimeRemaining(item.expiresAt)}
              </Text>
            </View>
          </View>
          
          <View style={styles.postMeta}>
            {item.deleteOnView && (
              <Ionicons name="eye-off" size={20} color={Colors.red} style={styles.metaIcon} />
            )}
            <Text style={styles.viewCount}>{item.viewCount || 0} views</Text>
          </View>
        </View>

        {/* Media Preview */}
        <View style={[styles.mediaContainer, hasViewed && styles.viewedMedia]}>
          {item.mediaType === 'video' ? (
            <VideoPlayer
              source={{ uri: item.mediaUrl }}
              style={styles.mediaImage}
              showControls={true}
              autoPlay={false}
              isMuted={true}
              isLooping={false}
            />
          ) : (
            <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
          )}
          
          {hasViewed && (
            <View style={styles.viewedOverlay}>
              <Ionicons name="checkmark-circle" size={50} color={Colors.white} />
              <Text style={styles.viewedText}>Viewed</Text>
            </View>
          )}
        </View>

        {/* Caption */}
        {item.caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{item.caption}</Text>
          </View>
        ) : null}

        {/* Emoji Reactions */}
        <View style={styles.reactionsContainer}>
          <EmojiReactionBar
            targetId={item.id}
            targetType="post"
            currentUserId={user.uid}
            onReactionChange={(result) => {
              console.log('[FeedScreen] Reaction changed:', result);
              // Optionally trigger feed refresh or update local state
            }}
          />
        </View>

        {/* Post Info */}
        <View style={styles.postFooter}>
          <View style={styles.visibilityBadge}>
            <Ionicons
              name={
                item.visibility === 'public'
                  ? 'globe'
                  : item.visibility === 'friendsOfFriends'
                  ? 'people-circle'
                  : 'people'
              }
              size={16}
              color={Colors.gray}
            />
            <Text style={styles.visibilityText}>
              {item.visibility === 'public'
                ? 'Public'
                : item.visibility === 'friendsOfFriends'
                ? 'Friends of Friends'
                : 'Friends Only'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
        <Text style={styles.loadingText}>Loading snaps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.snapYellow}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={80} color={Colors.lightGray} />
            <Text style={styles.emptyText}>No snaps yet!</Text>
            <Text style={styles.emptySubtext}>
              Take a snap or wait for your friends to post
            </Text>
            <TouchableOpacity
              style={styles.snapButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Text style={styles.snapButtonText}>Take a Snap</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  listContent: {
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  loadingText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
  },
  postCard: {
    backgroundColor: Colors.darkGray,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.snapYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: Colors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  postTime: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 5,
  },
  viewCount: {
    color: Colors.gray,
    fontSize: 14,
  },
  mediaContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.black,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  viewedMedia: {
    opacity: 0.7,
  },
  viewedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewedText: {
    color: Colors.white,
    fontSize: 18,
    marginTop: 10,
  },
  captionContainer: {
    padding: 12,
  },
  caption: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 20,
  },
  reactionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postFooter: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityText: {
    color: Colors.gray,
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtext: {
    color: Colors.gray,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  snapButton: {
    backgroundColor: Colors.snapYellow,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  snapButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
}); 