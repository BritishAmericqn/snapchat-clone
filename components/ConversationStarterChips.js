import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';

/**
 * ConversationStarterChips Component
 * Displays AI-generated conversation starter suggestions for direct messages
 * Follows the same UI patterns as TagSuggestionSection and EmojiReactionBar
 */
export const ConversationStarterChips = ({ 
  suggestions = [], 
  onSuggestionSelect, 
  onDismiss,
  visible = false,
  loading = false,
  contextAnalysis = '',
  connectionStrength = 'moderate'
}) => {
  console.log('[ConversationStarterChips] 💬 Component called with:', {
    suggestions,
    suggestionsLength: suggestions.length,
    visible,
    loading,
    contextAnalysis,
    connectionStrength,
    onSuggestionSelect: !!onSuggestionSelect,
    onDismiss: !!onDismiss
  });
  
  if (!visible) {
    console.log('[ConversationStarterChips] ❌ Not rendering - not visible');
    return null;
  }
  
  if (loading) {
    console.log('[ConversationStarterChips] ⏳ Rendering loading state');
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.snapYellow} />
          <Text style={styles.loadingText}>Generating conversation starters...</Text>
        </View>
      </View>
    );
  }
  
  if (suggestions.length === 0) {
    console.log('[ConversationStarterChips] ❌ Not rendering - no suggestions');
    return null;
  }
  
  console.log('[ConversationStarterChips] ✅ Rendering with', suggestions.length, 'suggestions');

  const handleSuggestionPress = (suggestion) => {
    console.log('[ConversationStarterChips] 🎯 Suggestion selected:', suggestion.text);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStrength) {
      case 'strong': return '🔗';
      case 'moderate': return '🤝';
      case 'weak': return '👋';
      default: return '💬';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'mutual_friends': return '👥';
      case 'shared_interests': return '🎯';
      case 'profile_based': return '👤';
      case 'general_friendly': return '😊';
      default: return '💬';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'mutual_friends': return '#4A90E2';  // Blue for social connections
      case 'shared_interests': return '#7ED321'; // Green for shared interests
      case 'profile_based': return '#F5A623';   // Orange for profile-based
      case 'general_friendly': return Colors.snapYellow; // Yellow for friendly
      default: return Colors.lightGray;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.connectionIcon}>{getConnectionIcon()}</Text>
          <Text style={styles.title}>Ice Breakers</Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Ionicons name="close" size={16} color={Colors.lightGray} />
        </TouchableOpacity>
      </View>
      
      {contextAnalysis && (
        <Text style={styles.contextText}>{contextAnalysis}</Text>
      )}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsScroll}
        contentContainerStyle={styles.suggestionsContent}
      >
        {suggestions.map((suggestion, index) => {
          const categoryColor = getCategoryColor(suggestion.category);
          const categoryIcon = getCategoryIcon(suggestion.category);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionChip,
                { borderColor: categoryColor }
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <View style={styles.chipHeader}>
                <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor }
                ]}>
                  <Text style={styles.categoryText}>
                    {suggestion.category.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.suggestionText}>
                {suggestion.text}
              </Text>
              
              {suggestion.reasoning && (
                <Text style={styles.reasoningText}>
                  {suggestion.reasoning}
                </Text>
              )}
              
              <View style={styles.chipFooter}>
                <Ionicons 
                  name="send" 
                  size={14} 
                  color={categoryColor} 
                />
                <Text style={[styles.tapToSendText, { color: categoryColor }]}>
                  Tap to send
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contextText: {
    color: Colors.lightGray,
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  suggestionsScroll: {
    marginHorizontal: -12,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    maxWidth: 280,
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flex: 1,
  },
  categoryText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  suggestionText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500',
  },
  reasoningText: {
    color: Colors.lightGray,
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  chipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tapToSendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
}); 