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
 * Displays AI-generated conversation starter suggestions with advanced intelligence
 * Now includes Features 41-45: conversation history, timing intelligence, enhanced context, 
 * activity-based topics, and success tracking
 */
export const ConversationStarterChips = ({ 
  suggestions = [], 
  onSuggestionSelect, 
  onDismiss,
  visible = false,
  loading = false,
  contextAnalysis = '',
  connectionStrength = 'moderate',
  // Enhanced intelligence props (Features 41-45)
  conversationStage = 'new',
  timingRecommendation = null,
  successAnalytics = null,
  enhancedFeatures = {}
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

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'new': return '🆕';
      case 'early': return '🌱'; 
      case 'active': return '💬';
      case 'dormant': return '💤';
      case 'lapsed': return '⏰';
      default: return '💭';
    }
  };

  const getIntelligenceIcon = () => {
    const activeFeatures = Object.values(enhancedFeatures || {}).filter(Boolean).length;
    if (activeFeatures >= 4) return '🧠'; // All features active
    if (activeFeatures >= 2) return '🎯'; // Some features active
    return '🤖'; // Basic AI
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'conversation_history': return '📈';
      case 'shared_activity': return '🎯';  
      case 'mutual_interest': return '🤝';
      case 'timing_based': return '⏰';
      case 'mutual_friends': return '👥';
      case 'shared_interests': return '💝';
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
          <Text style={styles.connectionIcon}>{getIntelligenceIcon()}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Smart Conversation Starters</Text>
            <View style={styles.intelligenceIndicators}>
              <Text style={styles.stageIndicator}>
                {getStageIcon(conversationStage)} {conversationStage}
              </Text>
              {enhancedFeatures && Object.values(enhancedFeatures).some(Boolean) && (
                <Text style={styles.aiIndicator}>
                  AI • {Object.values(enhancedFeatures).filter(Boolean).length}/4 features
                </Text>
              )}
            </View>
          </View>
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
      
      {/* Enhanced Intelligence Display */}
      {(timingRecommendation || successAnalytics) && (
        <View style={styles.intelligenceSection}>
          {timingRecommendation && (
            <View style={styles.intelligenceRow}>
              <Text style={styles.intelligenceIcon}>⏰</Text>
              <Text style={styles.intelligenceText}>
                Timing: {timingRecommendation}
              </Text>
            </View>
          )}
          
          {successAnalytics && successAnalytics.totalTracked > 0 && (
            <View style={styles.intelligenceRow}>
              <Text style={styles.intelligenceIcon}>📊</Text>
              <Text style={styles.intelligenceText}>
                Success Rate: {successAnalytics.successRate}% ({successAnalytics.totalTracked} tracked)
              </Text>
            </View>
          )}
          
          {enhancedFeatures && Object.values(enhancedFeatures).filter(Boolean).length > 0 && (
            <View style={styles.intelligenceRow}>
              <Text style={styles.intelligenceIcon}>🎯</Text>
              <Text style={styles.intelligenceText}>
                Enhanced with: {Object.entries(enhancedFeatures)
                  .filter(([_, active]) => active)
                  .map(([feature, _]) => feature.replace(/([A-Z])/g, ' $1').toLowerCase())
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>
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
          const confidence = suggestion.confidence || 'medium';
          const confidenceColor = confidence === 'high' ? '#4CAF50' : 
                                 confidence === 'medium' ? '#FF9800' : '#9E9E9E';
          
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
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: confidenceColor }
                ]}>
                  <Text style={styles.confidenceText}>
                    {confidence}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.suggestionText}>
                {suggestion.text}
              </Text>
              
              {suggestion.reasoning && (
                <Text style={styles.reasoningText}>
                  💡 {suggestion.reasoning}
                </Text>
              )}
              
              {/* Enhanced metadata display */}
              {suggestion.intelligenceUsed && Object.values(suggestion.intelligenceUsed).some(Boolean) && (
                <View style={styles.intelligenceUsedContainer}>
                  <Text style={styles.intelligenceUsedText}>
                    AI Features: {Object.entries(suggestion.intelligenceUsed)
                      .filter(([_, used]) => used)
                      .map(([feature, _]) => {
                        switch(feature) {
                          case 'conversationHistory': return '📈';
                          case 'enhancedContext': return '🎭';
                          case 'timingIntelligence': return '⏰';
                          case 'activityBased': return '🎯';
                          default: return '🤖';
                        }
                      })
                      .join(' ')
                    }
                  </Text>
                </View>
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
                {suggestion.metadata?.basedOnActivities > 0 && (
                  <Text style={styles.activityIndicator}>
                    +{suggestion.metadata.basedOnActivities} activities
                  </Text>
                )}
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
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  intelligenceIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stageIndicator: {
    color: Colors.lightGray,
    fontSize: 11,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  aiIndicator: {
    color: Colors.snapYellow,
    fontSize: 10,
    fontWeight: '500',
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
  intelligenceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  intelligenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  intelligenceIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  intelligenceText: {
    color: Colors.lightGray,
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
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
    minWidth: 220,
    maxWidth: 300,
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
  confidenceBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  confidenceText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  intelligenceUsedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  intelligenceUsedText: {
    color: Colors.snapYellow,
    fontSize: 10,
    fontWeight: '500',
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
  activityIndicator: {
    fontSize: 9,
    color: Colors.lightGray,
    marginLeft: 8,
    fontStyle: 'italic',
  },
}); 