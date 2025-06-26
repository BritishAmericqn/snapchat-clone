import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pre-defined filter configurations
const FILTERS = {
  none: {
    id: 'none',
    name: 'None',
    icon: 'close',
    enabled: false,
  },
  sunglasses: {
    id: 'sunglasses',
    name: 'Sunglasses',
    icon: 'sunny',
    enabled: true,
    emoji: '🕶️',
    position: 'eyes',
    scale: 1.5,
  },
  mustache: {
    id: 'mustache',
    name: 'Mustache',
    icon: 'man',
    enabled: true,
    emoji: '👨',
    position: 'mouth',
    scale: 1.2,
  },
  crown: {
    id: 'crown',
    name: 'Crown',
    icon: 'star',
    enabled: true,
    emoji: '👑',
    position: 'forehead',
    scale: 1.3,
  },
  heart_eyes: {
    id: 'heart_eyes',
    name: 'Heart Eyes',
    icon: 'heart',
    enabled: true,
    emoji: '😍',
    position: 'face',
    scale: 1.0,
  },
};

export const FilterOverlay = ({ 
  detectedFaces = [], 
  selectedFilter = 'none', 
  onFilterChange,
  isEnabled = true,
  style 
}) => {
  const [availableFilters] = useState(Object.values(FILTERS));

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

  const renderFilter = (face, index) => {
    const filter = FILTERS[selectedFilter];
    if (!filter || !filter.enabled || selectedFilter === 'none') {
      return null;
    }

    const position = calculateFilterPosition(face, filter);
    if (!position) return null;

    const filterSize = Math.min(face.bounds.size.width, face.bounds.size.height) * filter.scale;

    return (
      <View
        key={`filter-${index}`}
        style={[
          styles.filterElement,
          {
            left: position.x - filterSize / 2,
            top: position.y - filterSize / 2,
            width: filterSize,
            height: filterSize,
          }
        ]}
      >
        <Text style={[styles.filterEmoji, { fontSize: filterSize * 0.8 }]}>
          {filter.emoji}
        </Text>
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
    if (!isEnabled || selectedFilter === 'none' || detectedFaces.length === 0) {
      return null;
    }

    const filter = FILTERS[selectedFilter];
    if (!filter) return null;

    return (
      <View style={styles.filterInfo}>
        <Text style={styles.filterInfoText}>
          {filter.name} • {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  if (!isEnabled) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Render filters on detected faces */}
      {detectedFaces.map((face, index) => renderFilter(face, index))}
      
      {/* Filter selector UI */}
      {renderFilterSelector()}
      
      {/* Filter info */}
      {renderFilterInfo()}
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
  filterElement: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle drop shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  filterEmoji: {
    textAlign: 'center',
    // Ensure emoji renders properly
    fontFamily: 'System',
  },
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
  },
  filterButtonActive: {
    backgroundColor: Colors.snapYellow,
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
});

export default FilterOverlay; 