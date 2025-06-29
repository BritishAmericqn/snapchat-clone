import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { List, Avatar, Button, Chip } from 'react-native-paper';
import { AuthenticatedUserContext } from '../providers';
import { useRAGNotification } from '../providers';
import { Colors } from '../config';
import { generateUserRecommendations } from '../api/embeddings';
import { sendFriendRequest, checkFriendStatus } from '../api';
import { withRAGNotification, RAG_OPERATION_MESSAGES } from '../utils';

export const UserRecommendationSection = ({ 
  navigation, 
  onUserPress,
  style,
  limit = 5,
  showHeader = true 
}) => {
  const { user } = useContext(AuthenticatedUserContext);
  const notificationHandlers = useRAGNotification();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestStatuses, setRequestStatuses] = useState({});
  const [analysis, setAnalysis] = useState('');
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadRecommendations();
    }
  }, [user?.uid]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    
    // Clear previous state to show loading
    setRecommendations([]);
    setAnalysis('');
    setCached(false);
    
    try {
      console.log('[UserRecommendationSection] 🔄 REFRESH TRIGGERED - Starting recommendation load...');
      console.log('[UserRecommendationSection] 🤖 Loading AI recommendations...');
      console.log('[UserRecommendationSection] 🔍 User ID:', user.uid);
      
      // 🎯 FIX: Load fresh profile to get updated bio
      const { getUserProfile } = require('../api/users');
      const freshProfile = await getUserProfile(user.uid);
      const currentBio = freshProfile?.bio || user.bio;
      
      console.log('[UserRecommendationSection] 🔍 Fresh Profile Bio:', currentBio);
      console.log('[UserRecommendationSection] 🔍 Context Bio:', user.bio);
      console.log('[UserRecommendationSection] 🔍 Using Bio:', currentBio);
      console.log('[UserRecommendationSection] 🔍 Limit:', limit);
      
      // 🎯 FIX: Clear cache if bio changed to force fresh analysis
      if (currentBio !== user.bio) {
        console.log('[UserRecommendationSection] 🔄 Bio changed - clearing recommendation cache');
        const { clearRecommendationCache } = require('../api/embeddings');
        clearRecommendationCache();
      }
      
      // Wrap the RAG operation with notification
      const result = await withRAGNotification(
        async () => {
          return await generateUserRecommendations(user.uid, {
            limit,
            includeAnalysis: true
          });
        },
        notificationHandlers,
        `user_recommendations_${user.uid}_${Date.now()}`,
        RAG_OPERATION_MESSAGES.USER_RECOMMENDATIONS
      );
      
      console.log('[UserRecommendationSection] 📊 Result received:', {
        success: result.success,
        recommendationsCount: result.recommendations?.length || 0,
        error: result.error,
        cached: result.cached
      });
      
      if (result.success) {
        setRecommendations(result.recommendations || []);
        setAnalysis(result.analysis || '');
        setCached(result.cached || false);
        
        // Check friend status for each recommendation
        const statuses = {};
        for (const rec of result.recommendations) {
          if (rec.user) {
            const status = await checkFriendStatus(user.uid, rec.user.id || rec.user.uid);
            statuses[rec.user.id || rec.user.uid] = status;
          }
        }
        setRequestStatuses(statuses);
        
        console.log('[UserRecommendationSection] ✅ REFRESH SUCCESS:', result.recommendations.length, 'recommendations loaded');
        if (result.cached) {
          console.log('[UserRecommendationSection] 📦 Using cached results');
        }
      } else {
        console.log('[UserRecommendationSection] ❌ REFRESH COMPLETED - No recommendations:', result.error);
        setError(result.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('[UserRecommendationSection] 💥 REFRESH ERROR:', err);
      console.error('[UserRecommendationSection] 💥 Error name:', err.name);
      console.error('[UserRecommendationSection] 💥 Error message:', err.message);
      console.error('[UserRecommendationSection] 💥 Error stack:', err.stack);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
      console.log('[UserRecommendationSection] 🏁 REFRESH COMPLETED - Loading state cleared');
    }
  };

  const handleSendFriendRequest = async (recommendedUser) => {
    try {
      const userId = recommendedUser.id || recommendedUser.uid;
      await sendFriendRequest(user.uid, userId);
      
      // Update the request status
      const newStatus = {
        isFriend: false,
        hasPendingRequest: true,
        requestDirection: 'sent',
      };
      setRequestStatuses(prev => ({
        ...prev,
        [userId]: newStatus,
      }));
      
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      console.error('[UserRecommendationSection] ❌ Send request error:', err);
      Alert.alert('Error', err.message || 'Failed to send friend request');
    }
  };

  const handleUserPress = (recommendation) => {
    if (onUserPress) {
      onUserPress(recommendation.user);
    } else {
      navigation?.navigate('UserProfile', { userId: recommendation.user.id || recommendation.user.uid });
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 85) return Colors.green;
    if (score >= 70) return Colors.primary;
    return Colors.orange;
  };

  const renderRecommendationItem = ({ item: recommendation }) => {
    const { user: recommendedUser, matchScore, reason, conversationStarter } = recommendation;
    const userId = recommendedUser.id || recommendedUser.uid;
    const status = requestStatuses[userId] || {};
    const profilePhotoUrl = recommendedUser.profilePhotoUrl || 'https://via.placeholder.com/100';
    
    return (
      <TouchableOpacity
        style={styles.recommendationCard}
        onPress={() => handleUserPress(recommendation)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.userInfo}>
            <Avatar.Image 
              size={50} 
              source={{ uri: profilePhotoUrl }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.nameContainer}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {recommendedUser.displayName || recommendedUser.username}
                </Text>
                <View style={styles.matchChipWrapper}>
                  <View 
                    style={[styles.matchChip, { backgroundColor: getMatchScoreColor(matchScore) }]}
                  >
                    <Text style={styles.matchText}>
                      {matchScore}% match
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.username} numberOfLines={1}>
                @{recommendedUser.username}
              </Text>
              <Text style={styles.reason} numberOfLines={2}>
                💡 {reason}
              </Text>
              {conversationStarter && (
                <Text style={styles.conversationStarter} numberOfLines={2}>
                  💬 "{conversationStarter}"
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.actionContainer}>
            {status.hasPendingRequest ? (
              <Button 
                mode="outlined" 
                compact
                disabled
                style={styles.pendingButton}
                labelStyle={styles.pendingButtonLabel}
              >
                Request Sent
              </Button>
            ) : (
              <Button 
                mode="contained" 
                compact
                onPress={() => handleSendFriendRequest(recommendedUser)}
                style={styles.addButton}
                labelStyle={styles.addButtonLabel}
                icon="account-plus"
              >
                Add Friend
              </Button>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No AI recommendations available</Text>
        <Text style={styles.emptySubtext}>
          Add more friends or update your bio to get better recommendations
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>✨ Suggested for You</Text>
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
          onPress={loadRecommendations}
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

  if (error && recommendations.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Button 
            mode="outlined" 
            onPress={loadRecommendations}
            style={styles.retryButton}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Try Again'}
          </Button>
        </View>
      </View>
    );
  }

  if (!loading && recommendations.length === 0) {
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
      
      {loading && recommendations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your interests...</Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.user.id || item.user.uid}
          renderItem={renderRecommendationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
    color: Colors.black,
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
    color: Colors.black,
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
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  matchChipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    flexShrink: 0,
  },
  matchChip: {
    height: 26,
    flexShrink: 0,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignSelf: 'center',
  },
  matchText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  username: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 6,
  },
  reason: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  conversationStarter: {
    fontSize: 12,
    color: Colors.zimaBlue,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  addButtonLabel: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingButton: {
    borderColor: Colors.darkGray,
    borderRadius: 20,
  },
  pendingButtonLabel: {
    color: Colors.darkGray,
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.black,
    fontSize: 14,
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
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

export default UserRecommendationSection; 