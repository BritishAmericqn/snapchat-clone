import React, { useState, useContext, useEffect } from "react";
import { 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from "react-native";
import { View, Button, ModerationMenu } from "../components";
import { Colors } from "../config";
import { AuthenticatedUserContext } from "../providers";
import { 
  getUserProfile, 
  checkFriendStatus, 
  sendFriendRequest,
  cancelFriendRequest,
  getUsersByIds,
  removeFriend
} from "../api";
import { getModerationStatus } from "../api/moderation";
import { useFocusEffect } from "@react-navigation/native";

export const UserProfileScreen = ({ navigation, route }) => {
  const { user: currentUser } = useContext(AuthenticatedUserContext);
  const { userId } = route.params;
  
  const [profile, setProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendsData, setFriendsData] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [moderationStatus, setModerationStatus] = useState({});
  
  const isOwnProfile = currentUser?.uid === userId;
  
  // Load user profile and friend status
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        
        // Load friends data if they have friends
        if (userProfile.friendIds && userProfile.friendIds.length > 0) {
          const friends = await getUsersByIds(userProfile.friendIds);
          setFriendsData(friends);
        }
      }
      
      // Check friend status if not own profile
      if (!isOwnProfile && currentUser?.uid) {
        const status = await checkFriendStatus(currentUser.uid, userId);
        setFriendStatus(status);
        
        // Load moderation status
        const modStatus = await getModerationStatus(userId, currentUser.uid);
        setModerationStatus(modStatus);
      }
    } catch (err) {
      console.error('[UserProfileScreen] Error loading user data:', err);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Reload data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [userId, currentUser?.uid])
  );
  
  const handleSendFriendRequest = async () => {
    try {
      setActionLoading(true);
      await sendFriendRequest(currentUser.uid, userId);
      
      // Reload friend status
      const status = await checkFriendStatus(currentUser.uid, userId);
      setFriendStatus(status);
      
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      console.error('[UserProfileScreen] Error sending friend request:', err);
      Alert.alert('Error', err.message || 'Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCancelRequest = async () => {
    try {
      setActionLoading(true);
      await cancelFriendRequest(friendStatus.requestId, currentUser.uid);
      
      // Reload friend status
      const status = await checkFriendStatus(currentUser.uid, userId);
      setFriendStatus(status);
      
      Alert.alert('Success', 'Friend request cancelled');
    } catch (err) {
      console.error('[UserProfileScreen] Error cancelling request:', err);
      Alert.alert('Error', 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove @${profile.username} as a friend?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await removeFriend(currentUser.uid, userId);
              
              // Reload friend status
              const status = await checkFriendStatus(currentUser.uid, userId);
              setFriendStatus(status);
              
              Alert.alert('Success', 'Friend removed');
            } catch (err) {
              console.error('[UserProfileScreen] Error removing friend:', err);
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleModerationChange = async () => {
    // Reload data when moderation status changes
    await loadUserData();
  };
  
  const renderActionButton = () => {
    if (isOwnProfile) {
      return (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      );
    }
    
    if (!friendStatus) return null;
    
    if (friendStatus.isFriend) {
      return (
        <View style={styles.friendBadge}>
          <Text style={styles.friendBadgeText}>✓ Friends</Text>
        </View>
      );
    }
    
    if (friendStatus.hasPendingRequest) {
      if (friendStatus.requestDirection === 'sent') {
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelRequest}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? 'Loading...' : 'Cancel Request'}
            </Text>
          </TouchableOpacity>
        );
      } else {
        return (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <Text style={styles.actionButtonText}>Respond to Request</Text>
          </TouchableOpacity>
        );
      }
    }
    
    return (
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleSendFriendRequest}
        disabled={actionLoading}
      >
        <Text style={styles.actionButtonText}>
          {actionLoading ? 'Loading...' : 'Add Friend'}
        </Text>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }
  
  return (
    <View isSafe style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.header}>
          {/* Three-dot menu for non-own profiles */}
          {!isOwnProfile && (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowModerationMenu(true)}
            >
              <Text style={styles.menuButtonText}>⋯</Text>
            </TouchableOpacity>
          )}
          
          <Image 
            source={{ uri: profile.profilePhotoUrl || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <Text style={styles.username}>@{profile.username}</Text>
          <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>
        
        {/* Friend Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.friendIds?.length || 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>
        
        {/* Action Button */}
        <View style={styles.actionContainer}>
          {renderActionButton()}
        </View>
        
        {/* Friends List */}
        {friendsData.length > 0 && (
          <View style={styles.friendsSection}>
            <Text style={styles.sectionTitle}>Friends</Text>
            {friendsData.map((friend) => (
              <TouchableOpacity 
                key={friend.id}
                style={styles.friendItem}
                onPress={() => navigation.push('UserProfile', { userId: friend.id })}
              >
                <Image 
                  source={{ uri: friend.profilePhotoUrl || 'https://via.placeholder.com/50' }} 
                  style={styles.friendImage} 
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendUsername}>@{friend.username}</Text>
                  <Text style={styles.friendDisplayName}>{friend.displayName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Moderation Menu */}
      {!isOwnProfile && (
        <ModerationMenu
          visible={showModerationMenu}
          onClose={() => setShowModerationMenu(false)}
          targetUserId={userId}
          targetUsername={profile?.username}
          currentUserId={currentUser?.uid}
          moderationStatus={moderationStatus}
          onModerationChange={handleModerationChange}
          isFriend={friendStatus?.isFriend}
          onRemoveFriend={handleRemoveFriend}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
    marginBottom: 15,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 5,
  },
  displayName: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
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
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: Colors.snapYellow,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  friendBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  friendBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  friendsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.lightGray,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  friendDisplayName: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 50,
  },
}); 