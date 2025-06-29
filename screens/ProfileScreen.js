import React, { useState, useContext, useEffect } from "react";
import { Text, StyleSheet, TouchableOpacity, Image, TextInput as RNTextInput, Alert, ScrollView } from "react-native";
import { View, Button, FormErrorMessage } from "../components";
import { Colors } from "../config";
import { AuthenticatedUserContext, useRAGNotification } from "../providers";
import { getUserProfile, updateUserProfile, getUsersByIds } from "../api";
import { useFocusEffect } from "@react-navigation/native";
import { withRAGNotification, RAG_OPERATION_MESSAGES } from "../utils";

export const ProfileScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const notificationHandlers = useRAGNotification();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [friendCount, setFriendCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Mock profile image (in real app, would allow image picker)
  const profileImageUrl = 'https://via.placeholder.com/150';
  
  // Reload profile data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [user])
  );

  const loadUserProfile = async () => {
    try {
      console.log('[ProfileScreen] 🔄 Loading profile for user:', user.uid);
      const profile = await getUserProfile(user.uid);
      if (profile) {
        console.log('[ProfileScreen] 🔍 Raw profile loaded:', profile);
        console.log('[ProfileScreen] 🔍 Bio from database:', `"${profile.bio || ''}"`);
        
        setUsername(profile.username || '');
        setDisplayName(profile.displayName || '');
        setBio(profile.bio || '');
        setFriendCount(profile.friendIds?.length || 0);
        
        console.log('[ProfileScreen] ✅ Profile state updated:', {
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
          friendCount: profile.friendIds?.length || 0
        });
      } else {
        console.log('[ProfileScreen] ⚠️ No profile found for user:', user.uid);
      }
    } catch (err) {
      console.error('[ProfileScreen] ❌ Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    try {
      const updates = {
        username: username.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
      };
      
      console.log('[ProfileScreen] 🔄 Saving profile updates:', updates);
      console.log('[ProfileScreen] 🔍 Bio being saved:', `"${bio.trim()}"`);
      
      // Wrap the profile update with notification
      await withRAGNotification(
        async () => {
          return await updateUserProfile(user.uid, updates);
        },
        notificationHandlers,
        `profile_update_${user.uid}_${Date.now()}`,
        RAG_OPERATION_MESSAGES.PROFILE_UPDATE
      );
      
      console.log('[ProfileScreen] ✅ Profile update completed successfully');
      
      setIsEditing(false);
      setError('');
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Force reload to verify save
      console.log('[ProfileScreen] 🔄 Reloading profile to verify save...');
      setTimeout(loadUserProfile, 1000);
      
    } catch (err) {
      console.error('[ProfileScreen] ❌ Error updating profile:', err);
      setError('Failed to update profile');
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reload profile to reset values
    loadUserProfile();
  };
  
  const handleChangeProfilePicture = () => {
    // In real app, would open image picker
    Alert.alert('Coming Soon', 'Image picker will be available in next update');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View isSafe style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangeProfilePicture}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Friend Stats */}
        <View style={styles.statsContainer}>
                  <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('FriendsList')}
        >
          <Text style={styles.statNumber}>{friendCount}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </TouchableOpacity>
        </View>
        
        {/* User Info */}
        <View style={styles.infoContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Username</Text>
            {isEditing ? (
              <RNTextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{username}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Display Name</Text>
            {isEditing ? (
              <RNTextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter display name"
              />
            ) : (
              <Text style={styles.value}>{displayName || 'Not set'}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Bio</Text>
            {isEditing ? (
              <RNTextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.value}>{bio || 'No bio yet'}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>
        
        {/* Error Message */}
        {error !== "" && <FormErrorMessage error={error} visible={true} />}
        
        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.buttonContainer}>
            <Button style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Button>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Quick Actions */}
        {!isEditing && (
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('FriendsList')}
            >
              <Text style={styles.quickActionText}>👫 My Friends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('PrivacySettings')}
            >
              <Text style={styles.quickActionText}>⚙️ Privacy Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('SearchUsers')}
            >
              <Text style={styles.quickActionText}>🔍 Find Friends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('FriendRequests')}
            >
              <Text style={styles.quickActionText}>👥 Friend Requests</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.gray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  editButton: {
    fontSize: 16,
    color: Colors.blue,
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
  },
  changePhotoButton: {
    marginTop: 10,
  },
  changePhotoText: {
    color: Colors.blue,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: Colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: Colors.black,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: Colors.snapYellow,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.gray,
    fontSize: 16,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: Colors.lightGray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
  },
}); 