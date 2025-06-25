import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { 
  isExpoGo, 
  isNativeCameraAvailable, 
  getRecommendedCameraImplementation,
  logEnvironmentInfo,
  isIOSSimulator,
  hasCameraHardware
} from '../utils/environmentDetection';

// Conditional imports for native camera
let CameraView = null;
let useCameraPermissions = null;

// Safer conditional import that won't crash
if (!isExpoGo()) {
  try {
    // Use a more careful approach for dynamic imports
    const Camera = require('expo-camera');
    if (Camera && Camera.CameraView) {
      CameraView = Camera.CameraView;
      useCameraPermissions = Camera.useCameraPermissions;
      console.log('[CameraScreen] Native camera loaded successfully');
    }
  } catch (error) {
    console.log('[CameraScreen] Native camera not available:', error.message);
    // Fallback to null, will use ImagePicker
  }
}

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
  
  // Environment detection
  const isUsingNativeCamera = isNativeCameraAvailable();
  const cameraImplementation = getRecommendedCameraImplementation();
  
  // Camera permissions state
  const [imagePickerPermission, setImagePickerPermission] = useState(null);
  const [nativeCameraPermission, requestNativeCameraPermission] = isUsingNativeCamera && useCameraPermissions ? 
    useCameraPermissions() : [null, null];
  
  // Camera state
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraType, setCameraType] = useState('back');
  const [flashMode, setFlashMode] = useState('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Camera reference for native camera
  const cameraRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    initializeCamera();
    
    // Log environment info for debugging
    if (__DEV__) {
      logEnvironmentInfo();
      console.log(`[CameraScreen] Using ${cameraImplementation} implementation`);
    }
    
    return () => {
      // Cleanup recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      // Always request ImagePicker permissions (fallback)
      const imagePickerStatus = await ImagePicker.requestCameraPermissionsAsync();
      setImagePickerPermission(imagePickerStatus.status === 'granted');
      
      // Request native camera permissions if available
      if (isUsingNativeCamera && requestNativeCameraPermission) {
        try {
          await requestNativeCameraPermission();
        } catch (error) {
          console.log('[CameraScreen] Native camera permission error:', error);
        }
      }
      
      setIsCameraReady(true);
    } catch (error) {
      console.error('[CameraScreen] Camera initialization error:', error);
      Alert.alert('Camera Error', 'Failed to initialize camera');
    }
  };

  const hasAnyPermission = () => {
    if (isUsingNativeCamera) {
      return nativeCameraPermission?.granted || imagePickerPermission;
    }
    return imagePickerPermission;
  };

  const handlePermissionRequest = async () => {
    if (isUsingNativeCamera && requestNativeCameraPermission) {
      const result = await requestNativeCameraPermission();
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permission in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      const result = await ImagePicker.requestCameraPermissionsAsync();
      setImagePickerPermission(result.status === 'granted');
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permission in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }
  };

  // Native camera functions
  const takePictureWithNativeCamera = async () => {
    try {
      setIsLoading(true);
      
      if (!cameraRef.current) {
        throw new Error('Camera not ready');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        handleMediaCaptured({
          uri: photo.uri,
          type: 'image',
          width: photo.width,
          height: photo.height,
        });
      }
    } catch (error) {
      console.error('[CameraScreen] Native camera capture error:', error);
      Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startVideoRecording = async () => {
    try {
      if (!cameraRef.current || isRecording) return;
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 60 seconds (Snapchat-like)
          if (newTime >= 60) {
            stopVideoRecording();
            return 60;
          }
          return newTime;
        });
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 60,
      });

      if (video?.uri) {
        handleMediaCaptured({
          uri: video.uri,
          type: 'video',
          width: video.width || 720,
          height: video.height || 1280,
        });
      }
    } catch (error) {
      console.error('[CameraScreen] Video recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video. Please try again.');
    }
  };

  const stopVideoRecording = async () => {
    try {
      if (!isRecording || !cameraRef.current) return;
      
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
      
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('[CameraScreen] Stop recording error:', error);
    }
  };

  // ImagePicker fallback functions
  const takePictureWithImagePicker = async () => {
    try {
      setIsLoading(true);
      
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
      console.error('[CameraScreen] ImagePicker capture error:', error);
      Alert.alert('Camera Error', 'Failed to take picture');
    } finally {
      setIsLoading(false);
    }
  };

  // Main capture function (adaptive)
  const takePicture = async () => {
    if (isUsingNativeCamera) {
      await takePictureWithNativeCamera();
    } else {
      await takePictureWithImagePicker();
    }
  };

  // Video recording handlers (only for native camera)
  const handleCapturePress = () => {
    if (isUsingNativeCamera && !isRecording) {
      takePicture();
    } else if (!isUsingNativeCamera) {
      takePicture();
    }
  };

  const handleCapturePressIn = () => {
    if (isUsingNativeCamera) {
      startVideoRecording();
    }
  };

  const handleCapturePressOut = () => {
    if (isUsingNativeCamera && isRecording) {
      stopVideoRecording();
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
      console.error('[CameraScreen] Gallery selection error:', error);
      Alert.alert('Gallery Error', 'Failed to select from gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const useTestImage = () => {
    const randomImage = TEST_IMAGES[Math.floor(Math.random() * TEST_IMAGES.length)];
    handleMediaCaptured({
      uri: randomImage,
      type: 'image',
      width: 400,
      height: 600,
    });
  };

  const handleMediaCaptured = (media) => {
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

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Permission check
  if (!isCameraReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  if (!hasAnyPermission()) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={Colors.white} />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Text style={styles.permissionSubtext}>
            To take photos and videos, please allow camera access.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={handlePermissionRequest}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Content */}
      <View style={styles.cameraContainer}>
        {isUsingNativeCamera && CameraView ? (
          // Native Camera View
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            flash={flashMode}
            enableTorch={flashMode === 'on'}
            mode="picture"
            onCameraReady={() => setIsCameraReady(true)}
            onMountError={(error) => {
              console.error('[CameraScreen] Camera mount error:', error);
              Alert.alert('Camera Error', 'Failed to initialize camera');
            }}
          />
        ) : (
          // Fallback placeholder for ImagePicker
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera" size={100} color={Colors.lightGray} />
            <Text style={styles.placeholderText}>
              {isExpoGo() ? 'Expo Go Camera' : 
               isIOSSimulator() ? 'iOS Simulator Camera' : 'Camera Preview'}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {isExpoGo() 
                ? 'Using ImagePicker for Expo Go compatibility' 
                : isIOSSimulator()
                ? 'Simulators cannot access camera hardware. Use ImagePicker or test on real device.'
                : 'Native camera will be available on real device'
              }
            </Text>
            {isIOSSimulator() && (
              <Text style={styles.simulatorWarning}>
                💡 To test native camera, use a real iPhone device
              </Text>
            )}
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC {formatRecordingTime(recordingTime)}</Text>
          </View>
        )}

        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            {/* Environment indicator */}
            {__DEV__ && (
              <View style={styles.environmentIndicator}>
                <Text style={styles.environmentText}>
                  {isIOSSimulator() ? 'SIMULATOR' : 
                   isUsingNativeCamera ? 'NATIVE' : 'PICKER'}
                </Text>
              </View>
            )}
            
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
          {/* Quick Send Container */}
          <View style={styles.quickSendContainer}>
            <Text style={styles.quickSendTitle}>Send to:</Text>
            <FlatList
              horizontal
              data={[]}
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
              disabled={isLoading || isRecording}
            >
              <Ionicons name="images" size={24} color={Colors.white} />
            </TouchableOpacity>

            {/* Main Capture Button */}
            <TouchableOpacity
              style={[
                styles.captureButton, 
                isRecording && styles.captureButtonRecording,
                (isLoading || !isCameraReady) && styles.captureButtonDisabled
              ]}
              onPress={handleCapturePress}
              onPressIn={isUsingNativeCamera ? handleCapturePressIn : undefined}
              onPressOut={isUsingNativeCamera ? handleCapturePressOut : undefined}
              disabled={isLoading || !isCameraReady}
              activeOpacity={0.8}
            >
              <View style={[
                styles.captureButtonInner,
                isRecording && styles.captureButtonInnerRecording
              ]}>
                {isLoading ? (
                  <ActivityIndicator size="large" color={Colors.snapYellow} />
                ) : (
                  <View style={[
                    styles.captureButtonDot,
                    isRecording && styles.captureButtonDotRecording
                  ]} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={useTestImage}
              disabled={isLoading || isRecording}
            >
              <Ionicons name="color-wand" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Video recording hint */}
          {isUsingNativeCamera && (
            <Text style={styles.recordingHint}>
              Tap for photo • Hold for video
            </Text>
          )}
        </View>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.snapYellow} />
          <Text style={styles.loadingText}>Processing...</Text>
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
  camera: {
    flex: 1,
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
  simulatorWarning: {
    color: Colors.snapYellow,
    fontSize: 12,
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionSubtext: {
    color: Colors.lightGray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 30,
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
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  recordingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
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
    alignItems: 'center',
    gap: 15,
  },
  environmentIndicator: {
    backgroundColor: 'rgba(255, 252, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  environmentText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '600',
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
  captureButtonRecording: {
    borderColor: '#ff4444',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInnerRecording: {
    backgroundColor: '#ff4444',
  },
  captureButtonDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.black,
  },
  captureButtonDotRecording: {
    borderRadius: 4,
    backgroundColor: Colors.white,
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
  recordingHint: {
    color: Colors.lightGray,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 10,
  },
}); 