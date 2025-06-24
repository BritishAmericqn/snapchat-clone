import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default test images for development
const TEST_IMAGES = [
  'https://picsum.photos/400/600?random=1',
  'https://picsum.photos/400/600?random=2',
  'https://picsum.photos/400/600?random=3',
];

export const CameraScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Camera state (for future camera implementation)
  const [cameraType, setCameraType] = useState('back');
  const [flashMode, setFlashMode] = useState('off');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      setIsCameraReady(true);
    })();
  }, []);

  const takePicture = async () => {
    try {
      setIsLoading(true);
      
      // In production, this would use the camera
      // For now, use ImagePicker
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled) {
        handleMediaCaptured(result.assets[0]);
      }
    } catch (error) {
      console.error('[CameraScreen] Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        aspect: [9, 16],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        handleMediaCaptured(result.assets[0]);
      }
    } catch (error) {
      console.error('[CameraScreen] Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick from gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const useTestImage = () => {
    // Select a random test image
    const randomImage = TEST_IMAGES[Math.floor(Math.random() * TEST_IMAGES.length)];
    handleMediaCaptured({
      uri: randomImage,
      type: 'image',
      width: 400,
      height: 600,
    });
  };

  const handleMediaCaptured = (media) => {
    // Navigate to preview screen with the captured media
    navigation.navigate('MediaPreview', {
      media: {
        uri: media.uri,
        type: media.type || 'image',
        width: media.width,
        height: media.height,
      },
    });
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlashMode = () => {
    setFlashMode((current) => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return 'flash';
      case 'off':
        return 'flash-off';
      case 'auto':
        return 'flash';
      default:
        return 'flash-off';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => {}}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview Placeholder */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={100} color={Colors.lightGray} />
          <Text style={styles.placeholderText}>Camera Preview</Text>
          <Text style={styles.placeholderSubtext}>
            Using Image Picker for Expo Go compatibility
          </Text>
        </View>

        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlashMode}
            >
              <Ionicons name={getFlashIcon()} size={24} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Recent Friends for Quick Send */}
          <View style={styles.quickSendContainer}>
            <Text style={styles.quickSendTitle}>Send to:</Text>
            <FlatList
              horizontal
              data={[]} // TODO: Add recent friends
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.friendBubble}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendInitial}>{item.username?.[0]}</Text>
                  </View>
                  <Text style={styles.friendName}>{item.username}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsList}
            />
          </View>

          {/* Capture Controls */}
          <View style={styles.captureControls}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickFromGallery}
              disabled={isLoading}
            >
              <Ionicons name="images" size={24} color={Colors.white} />
            </TouchableOpacity>

            {/* Main Capture Button - Snapchat Style */}
            <TouchableOpacity
              style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner}>
                {isLoading ? (
                  <ActivityIndicator size="large" color={Colors.snapYellow} />
                ) : (
                  <View style={styles.captureButtonDot} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={useTestImage}
              disabled={isLoading}
            >
              <Ionicons name="color-wand" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.snapYellow} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
  },
  placeholderText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  placeholderSubtext: {
    color: Colors.lightGray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
  },
  quickSendContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickSendTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  friendsList: {
    paddingHorizontal: 10,
  },
  friendBubble: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 60,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.snapYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  friendInitial: {
    color: Colors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    color: Colors.white,
    fontSize: 12,
    textAlign: 'center',
  },
  captureControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.black,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: Colors.white,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.snapYellow,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 