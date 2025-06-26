import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';
import { 
  isExpoGo, 
  isNativeCameraAvailable 
} from '../utils/environmentDetection';

// Conditional import for image manipulator
let ImageManipulator = null;
if (!isExpoGo()) {
  try {
    ImageManipulator = require('expo-image-manipulator');
    console.log('[ImageFilterProcessor] Image manipulator loaded successfully');
  } catch (error) {
    console.log('[ImageFilterProcessor] Image manipulator not available:', error.message);
  }
}

// Pre-defined image filters
const IMAGE_FILTERS = {
  none: {
    id: 'none',
    name: 'Original',
    icon: 'image',
    enabled: true,
    transforms: [],
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    icon: 'camera-reverse',
    enabled: true,
    transforms: [
      { resize: { width: undefined, height: undefined } }, // Maintain original size
      // Note: expo-image-manipulator has limited filter options
      // Advanced filters would require expo-gl or custom shaders
    ],
  },
  blackwhite: {
    id: 'blackwhite',
    name: 'B&W',
    icon: 'contrast',
    enabled: true,
    transforms: [
      // Grayscale effect would be implemented with expo-gl
      // For now, this is a placeholder for the UI
    ],
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    icon: 'sunny',
    enabled: true,
    transforms: [
      // Sepia effect would be implemented with expo-gl
      // For now, this is a placeholder for the UI
    ],
  },
  blur: {
    id: 'blur',
    name: 'Blur',
    icon: 'ellipse',
    enabled: true,
    transforms: [
      // Blur effect available in some image manipulation libraries
    ],
  },
};

export const ImageFilterProcessor = ({ 
  imageUri,
  selectedFilter = 'none',
  onFilterChange,
  onProcessedImage,
  isEnabled = true,
  style 
}) => {
  const [availableFilters] = useState(Object.values(IMAGE_FILTERS));
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUri, setProcessedImageUri] = useState(null);

  // Check if image manipulator is available
  const isImageManipulatorAvailable = () => {
    return ImageManipulator && isNativeCameraAvailable();
  };

  // Process image with selected filter
  const processImageWithFilter = async (uri, filter) => {
    if (!isImageManipulatorAvailable() || !uri) {
      console.log('[ImageFilterProcessor] Image manipulator not available or no URI provided');
      return uri;
    }

    try {
      setIsProcessing(true);
      
      const filter_config = IMAGE_FILTERS[filter];
      if (!filter_config || filter === 'none') {
        return uri; // Return original URI for 'none' filter
      }

      // Basic image manipulation (resize, rotate, crop, flip)
      const actions = [];
      
      // Add filter-specific transforms
      switch (filter) {
        case 'vintage':
          // For vintage effect, we can adjust dimensions or add a slight rotation
          // Real color filters would require expo-gl
          actions.push({ resize: { width: undefined, height: undefined } });
          break;
          
        case 'blackwhite':
        case 'sepia':
        case 'blur':
          // These would require advanced image processing
          // For now, we'll show a placeholder message
          console.log(`[ImageFilterProcessor] ${filter} filter requires advanced image processing`);
          break;
          
        default:
          // No transforms for unknown filters
          break;
      }

      if (actions.length === 0) {
        // If no actual transforms, return original URI
        // but log that this filter is not implemented
        console.log(`[ImageFilterProcessor] Filter '${filter}' not fully implemented`);
        return uri;
      }

      // Apply transformations using expo-image-manipulator
      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false 
        }
      );

      console.log('[ImageFilterProcessor] Image processed successfully:', {
        filter,
        originalUri: uri,
        processedUri: result.uri,
        width: result.width,
        height: result.height,
      });

      return result.uri;
      
    } catch (error) {
      console.error('[ImageFilterProcessor] Error processing image:', error);
      Alert.alert(
        'Filter Error', 
        'Failed to apply filter. Using original image.',
        [{ text: 'OK' }]
      );
      return uri; // Return original URI on error
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle filter selection
  const handleFilterSelection = async (filterId) => {
    if (!imageUri) {
      console.log('[ImageFilterProcessor] No image URI to process');
      return;
    }

    console.log('[ImageFilterProcessor] Applying filter:', filterId);
    
    // Notify parent of filter change
    if (onFilterChange) {
      onFilterChange(filterId);
    }

    // Process image if not 'none' filter
    const processedUri = await processImageWithFilter(imageUri, filterId);
    setProcessedImageUri(processedUri);

    // Notify parent of processed image
    if (onProcessedImage && processedUri !== imageUri) {
      onProcessedImage(processedUri);
    }
  };

  // Effect to process image when imageUri changes
  useEffect(() => {
    if (imageUri && selectedFilter !== 'none') {
      handleFilterSelection(selectedFilter);
    }
  }, [imageUri]);

  const renderFilterButtons = () => {
    if (!isEnabled) return null;

    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filters</Text>
        <View style={styles.filterButtons}>
          {availableFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive,
                isProcessing && styles.filterButtonDisabled,
              ]}
              onPress={() => handleFilterSelection(filter.id)}
              disabled={isProcessing}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
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
        
        {isProcessing && (
          <Text style={styles.processingText}>Applying filter...</Text>
        )}
        
        {!isImageManipulatorAvailable() && (
          <Text style={styles.unavailableText}>
            Advanced filters require development build
          </Text>
        )}
      </View>
    );
  };

  const renderFilterInfo = () => {
    if (!isEnabled || selectedFilter === 'none') return null;

    const filter = IMAGE_FILTERS[selectedFilter];
    if (!filter) return null;

    return (
      <View style={styles.filterInfo}>
        <Text style={styles.filterInfoText}>
          Filter: {filter.name}
        </Text>
      </View>
    );
  };

  if (!isEnabled) return null;

  return (
    <View style={[styles.container, style]}>
      {renderFilterButtons()}
      {renderFilterInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.snapYellow,
  },
  filterButtonDisabled: {
    opacity: 0.5,
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: Colors.black,
  },
  processingText: {
    color: Colors.snapYellow,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  unavailableText: {
    color: '#FF9800',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  filterInfo: {
    position: 'absolute',
    top: -50,
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

export default ImageFilterProcessor; 