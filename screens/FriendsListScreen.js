import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Text,
  TextInput
} from 'react-native';
import { List, Avatar, Divider, Searchbar } from 'react-native-paper';
import { View, FormErrorMessage } from '../components';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { getUserProfile, getUsersByIds, removeFriend } from '../api';
import { useFocusEffect } from '@react-navigation/native';

export const FriendsListScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Load friends when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadFriends();
    }, [user?.uid])
  );

  const loadFriends = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get user's profile to get friend IDs
      const profile = await getUserProfile(user.uid);
      
      if (profile && profile.friendIds && profile.friendIds.length > 0) {
        // Get friend details
        const friendsData = await getUsersByIds(profile.friendIds);
        setFriends(friendsData);
        setFilteredFriends(friendsData);
      } else {
        setFriends([]);
        setFilteredFriends([]);
      }
    } catch (err) {
      console.error('[FriendsListScreen] Load error:', err);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend => 
        friend.username?.toLowerCase().includes(query.toLowerCase()) ||
        friend.displayName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  };

  const handleRemoveFriend = (friendId, friendName) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove friend from both users
              await removeFriend(user.uid, friendId);
              await removeFriend(friendId, user.uid);
              
              // Update local state
              setFriends(prev => prev.filter(f => f.id !== friendId));
              setFilteredFriends(prev => prev.filter(f => f.id !== friendId));
              
              Alert.alert('Success', 'Friend removed');
            } catch (err) {
              console.error('[FriendsListScreen] Remove error:', err);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const renderFriendItem = ({ item }) => {
    const profilePhotoUrl = item.profilePhotoUrl || 'https://via.placeholder.com/100';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        onLongPress={() => handleRemoveFriend(item.id, item.displayName || item.username)}
      >
        <List.Item
          title={item.displayName || item.username}
          description={`@${item.username}${item.bio ? ' • ' + item.bio : ''}`}
          titleStyle={styles.userName}
          descriptionStyle={styles.userDescription}
          descriptionNumberOfLines={1}
          left={() => (
            <Avatar.Image 
              size={50} 
              source={{ uri: profilePhotoUrl }}
              style={styles.avatar}
            />
          )}
          right={() => (
            <View style={styles.rightContainer}>
              <Text style={styles.tapHint}>Tap to view</Text>
              <Text style={styles.holdHint}>Hold to remove</Text>
            </View>
          )}
        />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery ? 'No friends match your search' : 'No friends yet'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery 
            ? 'Try a different search term' 
            : 'Add friends to see them here'}
        </Text>
        {!searchQuery && (
          <TouchableOpacity 
            style={styles.findFriendsButton}
            onPress={() => navigation.navigate('SearchUsers')}
          >
            <Text style={styles.findFriendsText}>Find Friends</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && friends.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
      </View>
    );
  }

  return (
    <View isSafe style={styles.container}>
      {error !== '' && <FormErrorMessage error={error} visible={true} />}
      
      <Searchbar
        placeholder="Search friends..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={Colors.gray}
        inputStyle={styles.searchInput}
      />
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredFriends.length} {filteredFriends.length === 1 ? 'friend' : 'friends'}
          {searchQuery && ` matching "${searchQuery}"`}
        </Text>
      </View>
      
      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriendItem}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.snapYellow]}
            tintColor={Colors.snapYellow}
          />
        }
        contentContainerStyle={filteredFriends.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  searchBar: {
    margin: 16,
    elevation: 0,
    backgroundColor: Colors.lightGray,
  },
  searchInput: {
    fontSize: 14,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.gray,
  },
  avatar: {
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  userDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: Colors.lightGray,
    marginBottom: 2,
  },
  holdHint: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  findFriendsButton: {
    backgroundColor: Colors.snapYellow,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  findFriendsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
}); 