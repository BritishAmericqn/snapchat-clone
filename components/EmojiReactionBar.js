import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';
import { 
  toggleReaction, 
  getPostReactions, 
  getUserReactionToPost 
} from '../api/reactions';
import EmojiPicker from './EmojiPicker';

const EmojiReactionBar = ({ 
  targetId, 
  targetType = 'post', 
  currentUserId, 
  onReactionChange 
}) => {
  const [reactions, setReactions] = useState({});
  const [userReactions, setUserReactions] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick reaction emojis (most commonly used)
  const quickEmojis = ['❤️', '😍', '🔥', '👍', '😂', '😮'];

  useEffect(() => {
    loadReactions();
  }, [targetId]);

  const loadReactions = async () => {
    try {
      const [postReactions, userReactionsData] = await Promise.all([
        getPostReactions(targetId),
        getUserReactionToPost(targetId, currentUserId)
      ]);
      
      setReactions(postReactions);
      setUserReactions(userReactionsData);
    } catch (error) {
      console.error('[EmojiReactionBar] Error loading reactions:', error);
    }
  };

  const handleQuickReaction = async (emoji) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Haptic feedback
      Vibration.vibrate(50);
      
      // Optimistic update
      const isCurrentlyReacted = userReactions.some(r => r.emoji === emoji);
      
      if (!isCurrentlyReacted) {
        // Add reaction optimistically
        const newUserReaction = {
          emoji,
          senderUid: currentUserId,
          targetId,
          createdAt: new Date()
        };
        setUserReactions(prev => [...prev, newUserReaction]);
      } else {
        // Remove reaction optimistically
        setUserReactions(prev => prev.filter(r => r.emoji !== emoji));
      }
      
      // Perform actual API call
      const result = await toggleReaction(targetId, emoji, currentUserId, targetType);
      
      // Reload reactions to get accurate counts
      await loadReactions();
      
      // Notify parent component
      if (onReactionChange) {
        onReactionChange(result);
      }
      
    } catch (error) {
      console.error('[EmojiReactionBar] Error handling reaction:', error);
      Alert.alert('Error', 'Failed to add reaction. Please try again.');
      
      // Revert optimistic update on error
      await loadReactions();
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = async (emoji) => {
    setShowEmojiPicker(false);
    await handleQuickReaction(emoji);
  };

  const getUserReactionText = (reactionGroup) => {
    const userReacted = userReactions.some(r => r.emoji === reactionGroup.emoji);
    const count = reactionGroup.count;
    
    if (userReacted && count === 1) {
      return 'You';
    } else if (userReacted && count === 2) {
      return 'You and 1 other';
    } else if (userReacted) {
      return `You and ${count - 1} others`;
    } else if (count === 1) {
      return '1 person';
    } else {
      return `${count} people`;
    }
  };

  const renderReactionSummary = () => {
    const reactionEntries = Object.entries(reactions);
    
    if (reactionEntries.length === 0) {
      return null;
    }

    // Sort by count descending
    const sortedReactions = reactionEntries
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 6); // Show max 6 emoji types

    return (
      <View style={styles.reactionSummary}>
        {sortedReactions.map(([emoji, reactionGroup]) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionSummaryItem}
            onPress={() => handleQuickReaction(emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{reactionGroup.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderQuickReactions = () => {
    return (
      <View style={styles.quickReactions}>
        {quickEmojis.map((emoji) => {
          const isUserReacted = userReactions.some(r => r.emoji === emoji);
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.quickReactionButton,
                isUserReacted && styles.quickReactionButtonActive
              ]}
              onPress={() => handleQuickReaction(emoji)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.quickReactionEmoji,
                isUserReacted && styles.quickReactionEmojiActive
              ]}>
                {emoji}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity
          style={styles.moreEmojisButton}
          onPress={() => setShowEmojiPicker(true)}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={24} 
            color={Colors.gray} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Reaction Summary */}
      {renderReactionSummary()}
      
      {/* Quick Reactions */}
      {renderQuickReactions()}
      
      {/* Emoji Picker Modal */}
      <EmojiPicker
        visible={showEmojiPicker}
        onSelectEmoji={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
        recentEmojis={userReactions.map(r => r.emoji)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  reactionSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  reactionSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.darkGray,
    fontWeight: '600',
  },
  quickReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickReactionButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  quickReactionButtonActive: {
    backgroundColor: Colors.snapYellow,
    borderColor: Colors.snapYellow,
  },
  quickReactionEmoji: {
    fontSize: 20,
  },
  quickReactionEmojiActive: {
    transform: [{ scale: 1.1 }],
  },
  moreEmojisButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default EmojiReactionBar; 