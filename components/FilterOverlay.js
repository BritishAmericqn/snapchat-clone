import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';
import { generateFilterRecommendations } from '../api/embeddings';
import { AuthenticatedUserContext, useRAGNotification } from '../providers';
import { withRAGNotification, RAG_OPERATION_MESSAGES } from '../utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pre-defined filter configurations
const FILTERS = {
  none: {
    id: 'none',
    name: 'None',
    icon: 'close',
    enabled: false,
  },
  
  // Face Filters
  sunglasses: {
    id: 'sunglasses',
    name: 'Sunglasses',
    icon: 'sunny',
    enabled: true,
    emoji: '🕶️',
    position: 'eyes',
    scale: 1.8,
    category: 'face'
  },
  heart_eyes: {
    id: 'heart_eyes',
    name: 'Heart Eyes',
    icon: 'heart',
    enabled: true,
    emoji: '😍',
    position: 'face',
    scale: 1.4,
    category: 'face'
  },
  cool_face: {
    id: 'cool_face',
    name: 'Cool',
    icon: 'sunny',
    enabled: true,
    emoji: '😎',
    position: 'face',
    scale: 1.4,
    category: 'face'
  },
  crown: {
    id: 'crown',
    name: 'Crown',
    icon: 'star',
    enabled: true,
    emoji: '👑',
    position: 'forehead',
    scale: 1.7,
    category: 'face'
  },
  
  // Nature & Outdoor Filters
  waterfall: {
    id: 'waterfall',
    name: 'Waterfall',
    icon: 'water',
    enabled: true,
    emoji: '🏞️',
    position: 'face',
    scale: 1.5,
    category: 'nature'
  },
  mountain: {
    id: 'mountain',
    name: 'Mountain',
    icon: 'triangle',
    enabled: true,
    emoji: '🏔️',
    position: 'face',
    scale: 1.5,
    category: 'nature'
  },
  tree: {
    id: 'tree',
    name: 'Tree',
    icon: 'leaf',
    enabled: true,
    emoji: '🌲',
    position: 'face',
    scale: 1.6,
    category: 'nature'
  },
  flower: {
    id: 'flower',
    name: 'Flower',
    icon: 'flower',
    enabled: true,
    emoji: '🌸',
    position: 'face',
    scale: 1.3,
    category: 'nature'
  },
  sun: {
    id: 'sun',
    name: 'Sunshine',
    icon: 'sunny',
    enabled: true,
    emoji: '☀️',
    position: 'face',
    scale: 1.6,
    category: 'nature'
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    icon: 'color-palette',
    enabled: true,
    emoji: '🌈',
    position: 'face',
    scale: 1.7,
    category: 'nature'
  },
  
  // Activity & Mood Filters  
  fire: {
    id: 'fire',
    name: 'Fire',
    icon: 'flame',
    enabled: true,
    emoji: '🔥',
    position: 'face',
    scale: 1.5,
    category: 'mood'
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    icon: 'flash',
    enabled: true,
    emoji: '⚡',
    position: 'face',
    scale: 1.4,
    category: 'mood'
  },
  star: {
    id: 'star',
    name: 'Star',
    icon: 'star',
    enabled: true,
    emoji: '⭐',
    position: 'face',
    scale: 1.3,
    category: 'mood'
  },
  sparkle: {
    id: 'sparkle',
    name: 'Sparkle',
    icon: 'sparkles',
    enabled: true,
    emoji: '✨',
    position: 'face',
    scale: 1.4,
    category: 'mood'
  },
  
  // Food & Lifestyle Filters
  coffee: {
    id: 'coffee',
    name: 'Coffee',
    icon: 'cafe',
    enabled: true,
    emoji: '☕',
    position: 'face',
    scale: 1.3,
    category: 'lifestyle'
  },
  pizza: {
    id: 'pizza',
    name: 'Pizza',
    icon: 'restaurant',
    enabled: true,
    emoji: '🍕',
    position: 'face',
    scale: 1.4,
    category: 'lifestyle'
  },
  camera: {
    id: 'camera',
    name: 'Camera',
    icon: 'camera',
    enabled: true,
    emoji: '📸',
    position: 'face',
    scale: 1.3,
    category: 'lifestyle'
  },
  music: {
    id: 'music',
    name: 'Music',
    icon: 'musical-notes',
    enabled: true,
    emoji: '🎵',
    position: 'face',
    scale: 1.3,
    category: 'lifestyle'
  },
  
  // Animals
  cat: {
    id: 'cat',
    name: 'Cat',
    icon: 'paw',
    enabled: true,
    emoji: '🐱',
    position: 'face',
    scale: 1.4,
    category: 'animals'
  },
  dog: {
    id: 'dog',
    name: 'Dog',
    icon: 'paw',
    enabled: true,
    emoji: '🐶',
    position: 'face',
    scale: 1.4,
    category: 'animals'
  },
  butterfly: {
    id: 'butterfly',
    name: 'Butterfly',
    icon: 'bug',
    enabled: true,
    emoji: '🦋',
    position: 'face',
    scale: 1.5,
    category: 'animals'
  },
  
  // Seasonal & Weather
  snowflake: {
    id: 'snowflake',
    name: 'Snowflake',
    icon: 'snow',
    enabled: true,
    emoji: '❄️',
    position: 'face',
    scale: 1.3,
    category: 'weather'
  },
  cloud: {
    id: 'cloud',
    name: 'Cloud',
    icon: 'cloud',
    enabled: true,
    emoji: '☁️',
    position: 'face',
    scale: 1.5,
    category: 'weather'
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    icon: 'moon',
    enabled: true,
    emoji: '🌙',
    position: 'face',
    scale: 1.4,
    category: 'weather'
  }
};

export const FilterOverlay = ({ 
  detectedFaces = [], 
  selectedFilter = 'none', 
  onFilterChange,
  appliedFilters: externalAppliedFilters = [],
  onFiltersChange,
  isEnabled = true,
  showMenuOnly = false,
  style,
  imageUri = null,
  userId = null
}) => {
  const { user } = useContext(AuthenticatedUserContext);
  const notificationHandlers = useRAGNotification();
  const [availableFilters] = useState(Object.values(FILTERS));
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [showAiPicks, setShowAiPicks] = useState(true);
  const [showFilterSelector, setShowFilterSelector] = useState(false);
  
  // New persistent filter system
  const [appliedFilters, setAppliedFilters] = useState(externalAppliedFilters);
  const [selectedFilterForEdit, setSelectedFilterForEdit] = useState(null);
  const gestureState = useRef({});

  // Sync with external filters
  useEffect(() => {
    setAppliedFilters(externalAppliedFilters);
  }, [externalAppliedFilters]);

  // Generate AI recommendations when image is available
  useEffect(() => {
    if (imageUri && userId && isEnabled && !aiRecommendations && !loadingRecommendations) {
      generateAiRecommendations();
    }
  }, [imageUri, userId, isEnabled]);

  const generateAiRecommendations = async () => {
    if (!imageUri || !userId) return;
    
    try {
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      
      console.log('[FilterOverlay] Generating AI filter recommendations...');
      
      // Wrap the filter recommendations with notification
      const result = await withRAGNotification(
        async () => {
          return await generateFilterRecommendations(imageUri, userId, {
            availableFilters: Object.keys(FILTERS).filter(id => id !== 'none'),
            includeReasoning: true
          });
        },
        notificationHandlers,
        `filter_recommendations_${userId}_${Date.now()}`,
        RAG_OPERATION_MESSAGES.FILTER_RECOMMENDATIONS
      );
      
      if (result.success && result.recommendations) {
        setAiRecommendations(result);
        console.log('[FilterOverlay] AI recommendations generated:', result.recommendations.length);
      } else {
        console.warn('[FilterOverlay] AI recommendations failed:', result.error);
        setRecommendationsError(result.error || 'Failed to generate recommendations');
      }
      
    } catch (error) {
      console.error('[FilterOverlay] Error generating AI recommendations:', error);
      setRecommendationsError(error.message);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // New filter management functions
  const addFilter = (filterId) => {
    const filter = FILTERS[filterId];
    if (!filter || filterId === 'none') return;
    
    const newFilter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filterId: filterId,
      position: getDefaultFilterPosition(filter),
      size: 120,
      isSelected: false
    };
    
    const newFilters = [...appliedFilters, newFilter];
    setAppliedFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
    setShowFilterSelector(false);
    console.log(`[FilterOverlay] Filter added: ${filterId}`);
  };

  const removeFilter = (id) => {
    const newFilters = appliedFilters.filter(filter => filter.id !== id);
    setAppliedFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
    setSelectedFilterForEdit(null);
    console.log(`[FilterOverlay] Filter removed: ${id}`);
  };

  const updateFilterPosition = (id, newPosition) => {
    const newFilters = appliedFilters.map(filter => 
      filter.id === id ? { ...filter, position: newPosition } : filter
    );
    setAppliedFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const selectFilterForEdit = (id) => {
    setSelectedFilterForEdit(selectedFilterForEdit === id ? null : id);
    setAppliedFilters(prev => prev.map(filter => ({
      ...filter,
      isSelected: filter.id === id
    })));
  };

  const handleFilterSelect = (filterId) => {
    console.log(`[FilterOverlay] Filter selected: ${filterId}`);
    addFilter(filterId);
  };

  const handleAiFilterSelect = (filterId, recommendation) => {
    console.log(`[FilterOverlay] AI recommendation applied: ${filterId} (score: ${recommendation.score})`);
    
    // Track AI recommendation usage for analytics
    if (aiRecommendations?.metadata) {
      console.log('[FilterOverlay] Analytics: AI filter applied', {
        filterId,
        score: recommendation.score,
        reasoning: recommendation.reasoning,
        userId,
        timestamp: new Date().toISOString()
      });
    }
    
    addFilter(filterId);
  };

  // Gesture handling for dragging filters
  const handleFilterDrag = (id, gestureEvent) => {
    const { translationX, translationY, state } = gestureEvent.nativeEvent;
    const filter = appliedFilters.find(f => f.id === id);
    
    if (state === State.BEGAN) {
      gestureState.current[id] = {
        initialX: filter.position.x,
        initialY: filter.position.y,
      };
    } else if (state === State.ACTIVE) {
      const { initialX, initialY } = gestureState.current[id];
      const containerWidth = SCREEN_WIDTH;
      const containerHeight = 300;
      
      const newX = Math.max(50, Math.min(containerWidth - 50, initialX + translationX));
      const newY = Math.max(20, Math.min(containerHeight - 20, initialY + translationY));
      
      updateFilterPosition(id, { x: newX, y: newY });
    } else if (state === State.END) {
      delete gestureState.current[id];
    }
  };

  // Helper function to format analysis object into readable text
  const formatAnalysisText = (analysis) => {
    if (!analysis || typeof analysis !== 'object') return '';
    
    const parts = [];
    if (analysis.lighting) parts.push(`${analysis.lighting} lighting`);
    if (analysis.mood) parts.push(`${analysis.mood} mood`);
    if (analysis.scene) parts.push(`${analysis.scene} scene`);
    if (analysis.faces_detected) parts.push('faces detected');
    
    return parts.length > 0 ? `Detected: ${parts.join(', ')}` : 'Image analyzed';
  };

  // Calculate filter position based on face landmarks
  const calculateFilterPosition = (face, filter) => {
    if (!face.bounds || !face.landmarks) {
      return null;
    }

    const { bounds, landmarks } = face;
    let position = { x: 0, y: 0 };

    switch (filter.position) {
      case 'eyes':
        // Position between the eyes
        if (landmarks.leftEye && landmarks.rightEye) {
          position.x = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
          position.y = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
        } else {
          // Fallback to upper portion of face bounds
          position.x = bounds.origin.x + bounds.size.width / 2;
          position.y = bounds.origin.y + bounds.size.height * 0.3;
        }
        break;

      case 'mouth':
        // Position at mouth
        if (landmarks.mouth) {
          position.x = landmarks.mouth.x;
          position.y = landmarks.mouth.y;
        } else {
          // Fallback to lower portion of face bounds
          position.x = bounds.origin.x + bounds.size.width / 2;
          position.y = bounds.origin.y + bounds.size.height * 0.7;
        }
        break;

      case 'forehead':
        // Position above the face
        position.x = bounds.origin.x + bounds.size.width / 2;
        position.y = bounds.origin.y - bounds.size.height * 0.2;
        break;

      case 'face':
        // Position at center of face
        position.x = bounds.origin.x + bounds.size.width / 2;
        position.y = bounds.origin.y + bounds.size.height / 2;
        break;

      default:
        // Default to center of face bounds
        position.x = bounds.origin.x + bounds.size.width / 2;
        position.y = bounds.origin.y + bounds.size.height / 2;
    }

    return position;
  };

  // New persistent filter rendering
  const renderPersistentFilter = (appliedFilter) => {
    const filter = FILTERS[appliedFilter.filterId];
    if (!filter || !filter.enabled) return null;

    const isSelected = appliedFilter.isSelected;
    
    return (
      <PanGestureHandler
        key={appliedFilter.id}
        onGestureEvent={(event) => handleFilterDrag(appliedFilter.id, event)}
        onHandlerStateChange={(event) => handleFilterDrag(appliedFilter.id, event)}
      >
        <View
          style={[
            styles.persistentFilterElement,
            {
              left: appliedFilter.position.x - appliedFilter.size / 2,
              top: appliedFilter.position.y - appliedFilter.size / 2,
              width: appliedFilter.size,
              height: appliedFilter.size,
            },
            isSelected && styles.persistentFilterElementSelected
          ]}
        >
          <TouchableOpacity
            style={styles.filterTouchArea}
            onPress={() => selectFilterForEdit(appliedFilter.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.persistentFilterEmoji, { fontSize: appliedFilter.size * 0.7 }]}>
              {filter.emoji}
            </Text>
          </TouchableOpacity>
          
          {/* Delete button - only show when selected */}
          {isSelected && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeFilter(appliedFilter.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.deleteButtonBackground}>
                <Ionicons name="close" size={12} color={Colors.white} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </PanGestureHandler>
    );
  };

  // Helper function to provide default filter positions when no face detection
  const getDefaultFilterPosition = (filter) => {
    // Use actual screen dimensions for better positioning
    const { width: screenWidth } = Dimensions.get('window');
    const containerWidth = screenWidth; // Full screen width
    const containerHeight = 300; // From MediaPreviewScreen styles
    
    switch (filter.position) {
      case 'eyes':
        return { x: containerWidth / 2, y: containerHeight * 0.3 }; // Upper face area - moved up
      case 'mouth':
        return { x: containerWidth / 2, y: containerHeight * 0.7 }; // Lower face area
      case 'forehead':
        return { x: containerWidth / 2, y: containerHeight * 0.15 }; // Top area - higher up
      case 'face':
      default:
        return { x: containerWidth / 2, y: containerHeight * 0.5 }; // Center
    }
  };

  const renderAiPicksSection = () => {
    if (!isEnabled) return null;

    return (
      <View style={styles.aiPicksSection}>
        {/* AI Picks Header - Always visible */}
        <View style={styles.aiPicksHeader}>
          <View style={styles.aiPicksHeaderContent}>
            <Ionicons name="sparkles" size={16} color={Colors.snapYellow} />
            <Text style={styles.aiPicksTitle}>AI Picks</Text>
            {loadingRecommendations && (
              <ActivityIndicator size="small" color={Colors.snapYellow} style={styles.aiPicksLoader} />
            )}
          </View>
          <TouchableOpacity
            style={styles.aiPicksToggle}
            onPress={() => setShowAiPicks(!showAiPicks)}
          >
            <Ionicons 
              name={showAiPicks ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={Colors.white} 
            />
          </TouchableOpacity>
        </View>

        {/* AI Recommendations - Only show when expanded */}
        {showAiPicks && (
          <View style={styles.aiRecommendations}>
            {recommendationsError ? (
              <View style={styles.aiError}>
                <Text style={styles.aiErrorText}>AI suggestions unavailable</Text>
                <TouchableOpacity onPress={generateAiRecommendations} style={styles.aiRetryButton}>
                  <Text style={styles.aiRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : aiRecommendations?.recommendations ? (
              <>
                {/* Scene Analysis */}
                {aiRecommendations.analysis && (
                  <Text style={styles.aiAnalysisText}>
                    {formatAnalysisText(aiRecommendations.analysis)}
                  </Text>
                )}
                
                {/* Filter Recommendations */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.aiRecommendationsList}
                >
                  {aiRecommendations.recommendations.map((rec, index) => {
                    const filter = FILTERS[rec.filterId];
                    if (!filter) return null;
                    
                    const isSelected = selectedFilter === rec.filterId;
                    const scoreColor = rec.score >= 90 ? Colors.green : 
                                      rec.score >= 70 ? Colors.snapYellow : Colors.white;
                    
                    return (
                      <TouchableOpacity
                        key={`ai-rec-${index}`}
                        style={[
                          styles.aiRecommendationChip,
                          isSelected && styles.aiRecommendationChipActive
                        ]}
                        onPress={() => handleAiFilterSelect(rec.filterId, rec)}
                      >
                        <View style={styles.aiRecommendationContent}>
                          <Text style={styles.aiRecommendationEmoji}>{filter.emoji}</Text>
                          <Text style={[
                            styles.aiRecommendationName,
                            isSelected && styles.aiRecommendationNameActive
                          ]}>
                            {filter.name}
                          </Text>
                          <Text style={[styles.aiRecommendationScore, { color: scoreColor }]}>
                            {rec.score}%
                          </Text>
                        </View>
                        {rec.reasoning && (
                          <Text style={styles.aiRecommendationReason} numberOfLines={2}>
                            {rec.reasoning}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : loadingRecommendations ? (
              <View style={styles.aiLoading}>
                <ActivityIndicator size="small" color={Colors.snapYellow} />
                <Text style={styles.aiLoadingText}>Analyzing your photo...</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const renderFilterSelector = () => {
    if (!isEnabled) return null;

    return (
      <View style={styles.filterSelector}>
        <Text style={styles.filterSelectorTitle}>Filters</Text>
        <View style={styles.filterButtons}>
          {availableFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => onFilterChange && onFilterChange(filter.id)}
            >
              <Ionicons 
                name={filter.icon} 
                size={20} 
                color={selectedFilter === filter.id ? Colors.black : Colors.white} 
              />
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.filterButtonTextActive
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFilterInfo = () => {
    if (!isEnabled || selectedFilter === 'none') {
      return null;
    }

    const filter = FILTERS[selectedFilter];
    if (!filter) return null;

    const faceCount = detectedFaces.length;
    const infoText = faceCount > 0 
      ? `${filter.name} • ${faceCount} face${faceCount !== 1 ? 's' : ''}`
      : `${filter.name} • Applied`;

    return (
      <View style={styles.filterInfo}>
        <Text style={styles.filterInfoText}>{infoText}</Text>
      </View>
    );
  };

  if (!isEnabled) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Render persistent applied filters */}
      {appliedFilters.map(appliedFilter => renderPersistentFilter(appliedFilter))}
      
      {/* Compact Filter Controls - Only show when menu is enabled, not when showing filters only */}
      {isEnabled && !showMenuOnly && (
        <View style={styles.compactFilterControls}>
          {/* Filter Toggle Button */}
          <TouchableOpacity
            style={[styles.compactToggle, showFilterSelector && styles.compactToggleActive]}
            onPress={() => setShowFilterSelector(!showFilterSelector)}
          >
            <Ionicons name="camera" size={24} color={Colors.white} />
          </TouchableOpacity>
          
          {/* Compact Filter Selector - Expandable */}
          {showFilterSelector && (
            <View style={styles.compactFilterList}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.values(FILTERS).map(filter => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.compactFilterButton,
                      selectedFilter === filter.id && styles.compactFilterButtonActive
                    ]}
                    onPress={() => handleFilterSelect(filter.id)}
                  >
                    {filter.emoji ? (
                      <Text style={styles.compactFilterEmoji}>{filter.emoji}</Text>
                    ) : (
                      <Ionicons 
                        name={filter.icon} 
                        size={20} 
                        color={selectedFilter === filter.id ? Colors.black : Colors.white} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* AI Picks - Compact Version */}
          {(loadingRecommendations || (aiRecommendations && aiRecommendations.recommendations)) && (
            <TouchableOpacity
              style={styles.aiPicksCompactButton}
              onPress={() => setShowAiPicks(!showAiPicks)}
            >
              <Ionicons name="sparkles" size={16} color={Colors.snapYellow} />
              <Text style={styles.aiPicksCompactText}>
                {loadingRecommendations ? 'Analyzing...' : 'AI Picks'}
              </Text>
              {loadingRecommendations && (
                <ActivityIndicator size="small" color={Colors.snapYellow} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          )}
          
          {/* AI Recommendations - Compact */}
          {showAiPicks && aiRecommendations && aiRecommendations.recommendations && (
            <View style={styles.compactAiPicks}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {aiRecommendations.recommendations.slice(0, 3).map((rec, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.compactAiPickButton}
                    onPress={() => handleAiFilterSelect(rec.filterId, rec)}
                  >
                    <Text style={styles.compactAiPickEmoji}>{FILTERS[rec.filterId]?.emoji}</Text>
                    <Text style={styles.compactAiPickScore}>{rec.score}%</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // New persistent filter styles
  persistentFilterElement: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 252, 0, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  persistentFilterElementSelected: {
    borderColor: Colors.snapYellow,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 252, 0, 0.2)',
    shadowColor: Colors.snapYellow,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  filterTouchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  persistentFilterEmoji: {
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  deleteButtonBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  
  // AI Picks Styles
  aiPicksSection: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  aiPicksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  aiPicksHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiPicksTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  aiPicksLoader: {
    marginLeft: 8,
  },
  aiPicksToggle: {
    padding: 4,
  },
  aiRecommendations: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
  },
  aiAnalysisText: {
    color: Colors.white,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 16,
  },
  aiRecommendationsList: {
    maxHeight: 120,
  },
  aiRecommendationChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    minWidth: 100,
    maxWidth: 120,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  aiRecommendationChipActive: {
    backgroundColor: Colors.snapYellow,
    borderColor: Colors.snapYellow,
  },
  aiRecommendationContent: {
    alignItems: 'center',
    marginBottom: 4,
  },
  aiRecommendationEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  aiRecommendationName: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiRecommendationNameActive: {
    color: Colors.black,
  },
  aiRecommendationScore: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  aiRecommendationReason: {
    color: Colors.white,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
    opacity: 0.8,
  },
  aiError: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  aiErrorText: {
    color: Colors.white,
    fontSize: 12,
    marginBottom: 8,
  },
  aiRetryButton: {
    backgroundColor: Colors.snapYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiRetryText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '600',
  },
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  aiLoadingText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 8,
  },
  
  // Original Filter Selector Styles
  filterSelector: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  filterSelectorTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    // Add shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: Colors.snapYellow,
    borderColor: Colors.white,
    // Enhanced shadow for active state
    shadowColor: Colors.snapYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
    transform: [{ scale: 1.05 }], // Slightly larger when active
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: Colors.black,
  },
  filterInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterInfoText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Compact Filter Controls Styles
  compactFilterControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  compactToggle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  compactToggleActive: {
    backgroundColor: Colors.snapYellow,
    borderColor: Colors.white,
  },
  compactFilterList: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  compactFilterButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  compactFilterButtonActive: {
    backgroundColor: Colors.snapYellow,
    borderColor: Colors.white,
  },
  compactFilterEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  aiPicksCompactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  aiPicksCompactText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  compactAiPicks: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  compactAiPickButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255, 252, 0, 0.2)',
    borderRadius: 15,
    minWidth: 50,
  },
  compactAiPickEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  compactAiPickScore: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default FilterOverlay; 