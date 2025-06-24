import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import MapView, { Marker, Heatmap } from 'react-native-maps';  // Requires development build
// import * as Location from 'expo-location';  // Requires installation
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';

export const SnapMapScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [location, setLocation] = useState(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [friends, setFriends] = useState([]);
  
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      // Mock location for Expo Go - in production, use expo-location
      Alert.alert(
        'Location Access',
        'Location features require expo-location package installation. Using mock location for demo.',
        [{ text: 'OK' }]
      );
      
      // Mock location data - San Francisco coordinates
      setLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const toggleGhostMode = () => {
    setGhostMode(!ghostMode);
    // TODO: Update user's location visibility in backend
  };

  // Removed renderFriendMarkers - requires react-native-maps

  const showFriendDetails = (friend) => {
    Alert.alert(
      friend.displayName || friend.username,
      `Last seen: ${friend.lastSeen || 'Recently'}`,
      [
        { text: 'Send Snap', onPress: () => sendSnapToFriend(friend) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const sendSnapToFriend = (friend) => {
    navigation.navigate('Camera', { targetFriend: friend });
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder for Expo Go */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={80} color={Colors.gray} />
        <Text style={styles.placeholderTitle}>Snap Map</Text>
        <Text style={styles.placeholderText}>
          Map view requires a development build.
        </Text>
        <Text style={styles.placeholderSubtext}>
          Using Expo Go? The interactive map will be available when you build the app.
        </Text>
        {location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color={Colors.snapYellow} />
            <Text style={styles.locationText}>
              Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* Header Controls */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Snap Map</Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Settings', 'Map settings coming soon!')}
        >
          <Ionicons name="settings" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Ghost Mode Toggle */}
        <View style={styles.ghostModeContainer}>
          <View style={styles.ghostModeInfo}>
            <Ionicons name="eye-off" size={24} color={Colors.white} />
            <View style={styles.ghostModeText}>
              <Text style={styles.ghostModeTitle}>Ghost Mode</Text>
              <Text style={styles.ghostModeSubtitle}>
                {ghostMode ? 'You\'re invisible' : 'Friends can see you'}
              </Text>
            </View>
          </View>
          <Switch
            value={ghostMode}
            onValueChange={toggleGhostMode}
            thumbColor={ghostMode ? Colors.snapYellow : Colors.white}
            trackColor={{ false: Colors.gray, true: Colors.snapYellow }}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera" size={24} color={Colors.black} />
            <Text style={styles.actionButtonText}>Take Snap</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Coming Soon', 'Heat map view coming soon!')}
          >
            <Ionicons name="flame" size={24} color={Colors.white} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Hot Spots
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1621',
    padding: 20,
  },
  placeholderTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  placeholderText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    color: Colors.gray,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 10,
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
    borderRadius: 20,
  },
  locationText: {
    color: Colors.snapYellow,
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 18,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  ghostModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ghostModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostModeText: {
    marginLeft: 15,
  },
  ghostModeTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ghostModeSubtitle: {
    color: Colors.gray,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.snapYellow,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: Colors.white,
  },
  friendMarker: {
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.snapYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  friendInitial: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SnapMapScreen; 