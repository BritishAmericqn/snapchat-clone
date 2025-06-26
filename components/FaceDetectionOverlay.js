import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { 
  isExpoGo, 
  isNativeCameraAvailable 
} from '../utils/environmentDetection';

// Conditional import for face detector
let FaceDetector = null;
if (!isExpoGo()) {
  try {
    FaceDetector = require('expo-face-detector');
    console.log('[FaceDetectionOverlay] Face detector loaded successfully');
  } catch (error) {
    console.log('[FaceDetectionOverlay] Face detector not available:', error.message);
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FaceDetectionOverlay = ({ 
  isEnabled = true, 
  onFacesDetected, 
  showBoundingBoxes = true,
  style 
}) => {
  const [faces, setFaces] = useState([]);
  const [detectionSettings, setDetectionSettings] = useState(null);

  useEffect(() => {
    // Initialize face detection settings
    if (FaceDetector && isNativeCameraAvailable()) {
      const settings = {
        mode: FaceDetector.FaceDetectorMode?.fast || 'fast',
        detectLandmarks: FaceDetector.FaceDetectorLandmarks?.all || 'all',
        runClassifications: FaceDetector.FaceDetectorClassifications?.all || 'all',
        minDetectionInterval: 100,
        tracking: true,
      };
      setDetectionSettings(settings);
      console.log('[FaceDetectionOverlay] Detection settings initialized:', settings);
    }
  }, []);

  const handleFacesDetected = ({ faces: detectedFaces }) => {
    try {
      setFaces(detectedFaces || []);
      
      // Pass face data to parent component
      if (onFacesDetected) {
        onFacesDetected(detectedFaces || []);
      }

      if (detectedFaces?.length > 0) {
        console.log(`[FaceDetectionOverlay] Detected ${detectedFaces.length} face(s)`);
      }
    } catch (error) {
      console.error('[FaceDetectionOverlay] Error handling face detection:', error);
    }
  };

  const renderFaceBoundingBoxes = () => {
    if (!showBoundingBoxes || !faces.length) return null;

    return faces.map((face, index) => {
      const { bounds } = face;
      if (!bounds) return null;

      return (
        <View
          key={`face-${index}`}
          style={[
            styles.faceBoundingBox,
            {
              left: bounds.origin.x,
              top: bounds.origin.y,
              width: bounds.size.width,
              height: bounds.size.height,
            }
          ]}
        >
          <Text style={styles.faceLabel}>
            Face {index + 1}
          </Text>
          
          {/* Show additional face data if available */}
          {face.smilingProbability !== undefined && (
            <Text style={styles.faceData}>
              😊 {Math.round(face.smilingProbability * 100)}%
            </Text>
          )}
          
          {face.leftEyeOpenProbability !== undefined && (
            <Text style={styles.faceData}>
              👁️ {Math.round(face.leftEyeOpenProbability * 100)}%
            </Text>
          )}
        </View>
      );
    });
  };

  const renderDetectionStatus = () => {
    if (!isEnabled) return null;

    const isAvailable = FaceDetector && isNativeCameraAvailable();
    const statusColor = isAvailable ? '#4CAF50' : '#FF9800';
    const statusText = isAvailable 
      ? `Faces: ${faces.length}` 
      : isExpoGo() 
        ? 'Face detection requires dev build'
        : 'Face detection unavailable';

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    );
  };

  // Don't render anything if face detection is not available
  if (!isEnabled || (!FaceDetector && !isExpoGo())) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {renderFaceBoundingBoxes()}
      {renderDetectionStatus()}
    </View>
  );
};

// Export detection settings for use in CameraView
export const getFaceDetectionSettings = () => {
  if (!FaceDetector || !isNativeCameraAvailable()) {
    return null;
  }

  return {
    mode: FaceDetector.FaceDetectorMode?.fast || 'fast',
    detectLandmarks: FaceDetector.FaceDetectorLandmarks?.all || 'all',
    runClassifications: FaceDetector.FaceDetectorClassifications?.all || 'all',
    minDetectionInterval: 100,
    tracking: true,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  faceBoundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 4,
  },
  faceLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  faceData: {
    color: '#4CAF50',
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  statusContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FaceDetectionOverlay; 