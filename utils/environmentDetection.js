import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Environment Detection Utility
 * 
 * Provides utilities to detect the current runtime environment
 * and adapt camera functionality accordingly.
 */

/**
 * Detect if running in Expo Go vs Development Build
 * @returns {boolean} true if running in Expo Go, false if development build
 */
export const isExpoGo = () => {
  return Constants.appOwnership === 'expo';
};

/**
 * Detect if running in development mode
 * @returns {boolean} true if in development mode
 */
export const isDevelopment = () => {
  return __DEV__;
};

/**
 * Detect if running on iOS Simulator
 * @returns {boolean} true if running on iOS Simulator
 */
export const isIOSSimulator = () => {
  if (Platform.OS !== 'ios') return false;
  
  // Check if running on simulator
  const platform = Constants.platform;
  
  // Multiple ways to detect simulator
  return (
    platform?.ios?.simulator === true ||
    Constants.isDevice === false ||
    (platform?.ios?.userInterfaceIdiom === 'phone' && !Constants.isDevice)
  );
};

/**
 * Detect if camera hardware is physically available
 * @returns {boolean} true if real camera hardware is available
 */
export const hasCameraHardware = () => {
  // Camera hardware not available in simulators
  if (isIOSSimulator()) return false;
  
  // Android emulators also don't have real cameras typically
  if (Platform.OS === 'android' && !Constants.isDevice) return false;
  
  return true;
};

/**
 * Get current platform information
 * @returns {object} Platform and environment details
 */
export const getEnvironmentInfo = () => {
  return {
    platform: Platform.OS,
    isExpoGo: isExpoGo(),
    isDevelopment: isDevelopment(),
    appOwnership: Constants.appOwnership,
    expoVersion: Constants.expoVersion,
    runtimeVersion: Constants.runtimeVersion,
  };
};

/**
 * Check if native camera features are available
 * @returns {boolean} true if native camera is available
 */
export const isNativeCameraAvailable = () => {
  // Native camera requires:
  // 1. Development build (not Expo Go)
  // 2. Real device hardware (not simulator)
  return !isExpoGo() && hasCameraHardware();
};

/**
 * Check if face detection features are available
 * @returns {boolean} true if face detection is available
 */
export const isFaceDetectionAvailable = () => {
  // Face detection requires development build
  return !isExpoGo();
};

/**
 * Check if video recording is available
 * @returns {boolean} true if video recording is available
 */
export const isVideoRecordingAvailable = () => {
  // Video recording requires development build
  return !isExpoGo();
};

/**
 * Get recommended camera implementation based on environment
 * @returns {string} 'native' or 'imagePicker'
 */
export const getRecommendedCameraImplementation = () => {
  return isNativeCameraAvailable() ? 'native' : 'imagePicker';
};

/**
 * Log environment information for debugging
 */
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.log('🔍 Environment Detection Info:');
  console.log('Platform:', info.platform);
  console.log('Expo Go:', info.isExpoGo);
  console.log('Development:', info.isDevelopment);
  console.log('iOS Simulator:', isIOSSimulator());
  console.log('Has Camera Hardware:', hasCameraHardware());
  console.log('App Ownership:', info.appOwnership);
  console.log('Native Camera Available:', isNativeCameraAvailable());
  console.log('Recommended Implementation:', getRecommendedCameraImplementation());
  console.log('---');
}; 