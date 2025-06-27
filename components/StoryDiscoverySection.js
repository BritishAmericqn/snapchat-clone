import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Avatar, Button, Chip } from 'react-native-paper';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { generateStoryDiscovery } from '../api/embeddings';
import { getUserProfile } from '../api/users';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_WIDTH = (SCREEN_WIDTH - 60) / 2; // Two columns with padding

export const StoryDiscoverySection = ({ 
  navigation,
  onStoryPress,
  style,
  limit = 10,
  showHeader = true 
}) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [storyRecommendations, setStoryRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [cached, setCached] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    if (user?.uid) {
      loadStoryDiscovery();
    }
  }, [user?.uid]);

  const loadStoryDiscovery = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('[StoryDiscoverySection] 🎬 Loading AI story discovery...');
      
      const result = await generateStoryDiscovery(user.uid, {
        limit,
        includeAnalysis: true
      });
      
      if (result.success) {
        setStoryRecommendations(result.stories || []);
        setAnalysis(result.analysis || '');
        setCached(result.cached || false);
        
        // Load author profiles for stories
        const profiles = {};
        const uniqueAuthorIds = [...new Set(result.stories.map(rec => rec.story?.authorUid).filter(Boolean))];
        
        for (const authorId of uniqueAuthorIds) {
          try {
            const profile = await getUserProfile(authorId);
            if (profile) {
              profiles[authorId] = profile;
            }
          } catch (profileError) {
            console.warn('[StoryDiscoverySection] Error loading profile for', authorId, profileError);
          }
        }
        setUserProfiles(profiles);
        
        console.log('[StoryDiscoverySection] ✅ Loaded', result.stories.length, 'story recommendations');
        if (result.cached) {
          console.log('[StoryDiscoverySection] 📦 Using cached results');
        }
      } else {
        setError(result.error || 'Failed to load story discovery');
      }
    } catch (err) {
      console.error('[StoryDiscoverySection] ❌ Error loading story discovery:', err);
      setError('Failed to load story discovery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryPress = (recommendation) => {
    if (onStoryPress) {
      onStoryPress(recommendation.story, recommendation);
    } else {
      // Navigate to story viewer with this story
      navigation?.navigate('StoryViewer', {
        stories: [{ 
          authorId: recommendation.story.authorUid,
          posts: [recommendation.story],
          hasViewed: false
        }],
        initialIndex: 0,
        userProfiles: userProfiles,
        isDiscovery: true
      });
    }
  };

  const getEngagementScoreColor = (score) => {
    if (score >= 85) return Colors.green;
    if (score >= 70) return Colors.primary;
    return Colors.orange;
  };

  const renderStoryItem = ({ item: recommendation, index }) => {
    const { story, engagementScore, reason, discoveryValue } = recommendation;
    const author = userProfiles[story.authorUid] || {};
    const authorDisplayName = author.displayName || author.username || 'Unknown';
    
    return (
      <TouchableOpacity
        style={[
          styles.storyCard,
          index % 2 === 0 ? styles.leftColumn : styles.rightColumn
        ]}
        onPress={() => handleStoryPress(recommendation)}
        activeOpacity={0.8}
      >
        <View style={styles.storyImageContainer}>
          <Image
            source={{ uri: story.mediaUrl }}
            style={styles.storyImage}
            resizeMode="cover"
          />
          
          {/* Engagement score overlay */}
          <View style={styles.scoreOverlay}>
            <Chip 
              style={[styles.scoreChip, { backgroundColor: getEngagementScoreColor(engagementScore) }]}
              textStyle={styles.scoreText}
              compact
            >
              {engagementScore}%
            </Chip>
          </View>
          
          {/* Author info overlay */}
          <View style={styles.authorOverlay}>
            <Avatar.Image 
              size={30} 
              source={{ uri: author.profilePhotoUrl || 'https://via.placeholder.com/100' }}
              style={styles.authorAvatar}
            />
            <Text style={styles.authorName} numberOfLines={1}>
              {authorDisplayName}
            </Text>
          </View>
          
          {/* Gradient overlay for text readability */}
          <View style={styles.gradientOverlay} />
        </View>
        
        <View style={styles.storyInfo}>
          {story.caption ? (
            <Text style={styles.storyCaption} numberOfLines={2}>
              {story.caption}
            </Text>
          ) : null}
          
          <View style={styles.reasonContainer}>
            <Text style={styles.reason} numberOfLines={2}>
              💡 {reason}
            </Text>
            <Text style={styles.discoveryValue} numberOfLines={1}>
              ✨ {discoveryValue}
            </Text>
          </View>
          
          <View style={styles.storyStats}>
            <Text style={styles.statText}>
              👁️ {story.viewCount || 0} views
            </Text>
            <Text style={styles.statText}>
              {story.visibility === 'public' ? '🌍 Public' : '👥 Friends'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No story discoveries available</Text>
        <Text style={styles.emptySubtext}>
          View more stories or add friends to get personalized recommendations
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>🔍 Discover Stories</Text>
          {cached && (
            <Chip 
              style={styles.cachedChip}
              textStyle={styles.cachedText}
              compact
              icon="cached"
            >
              Cached
            </Chip>
          )}
        </View>
        {analysis ? (
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {analysis}
          </Text>
        ) : null}
        <TouchableOpacity 
          onPress={loadStoryDiscovery}
          style={styles.refreshButton}
          disabled={loading}
        >
          <Text style={styles.refreshText}>
            {loading ? 'Analyzing...' : '🔄 Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (error && storyRecommendations.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Button 
            mode="outlined" 
            onPress={loadStoryDiscovery}
            style={styles.retryButton}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Try Again'}
          </Button>
        </View>
      </View>
    );
  }

  if (!loading && storyRecommendations.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderHeader()}
        {renderEmpty()}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {renderHeader()}
      
      {loading && storyRecommendations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Discovering stories for you...</Text>
        </View>
      ) : (
        <FlatList
          data={storyRecommendations}
          keyExtractor={(item, index) => `${item.story?.id || item.story?.postId}-${index}`}
          renderItem={renderStoryItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    // Removed flex: 1 for better ScrollView compatibility
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  cachedChip: {
    backgroundColor: 'rgba(97, 194, 227, 0.3)',
    borderColor: Colors.primary,
  },
  cachedText: {
    color: Colors.primary,
    fontSize: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 8,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  storyCard: {
    width: STORY_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  leftColumn: {
    marginRight: 8,
  },
  rightColumn: {
    marginLeft: 8,
  },
  storyImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    // Note: React Native doesn't support CSS gradients, but this creates a dark overlay
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scoreOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  scoreChip: {
    height: 20,
  },
  scoreText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  authorOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  authorName: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: 80,
  },
  storyInfo: {
    padding: 12,
  },
  storyCaption: {
    fontSize: 13,
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 18,
  },
  reasonContainer: {
    marginBottom: 8,
  },
  reason: {
    fontSize: 11,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  discoveryValue: {
    fontSize: 10,
    color: Colors.zimaBlue,
    fontStyle: 'italic',
  },
  storyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    fontSize: 10,
    color: Colors.lightGray,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    minHeight: 200, // Fixed height instead of flex: 1 for ScrollView compatibility
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.lightGray,
    fontSize: 14,
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    minHeight: 200, // Fixed height instead of flex: 1 for ScrollView compatibility
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    minHeight: 180, // Fixed height instead of flex: 1 for ScrollView compatibility
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    borderColor: Colors.primary,
  },
});

export default StoryDiscoverySection; 