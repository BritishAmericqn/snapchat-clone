import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Text
} from 'react-native';
import { List, Searchbar, Avatar, Button, Divider } from 'react-native-paper';
import { View, FormErrorMessage } from '../components';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { searchUsers, checkFriendStatus, sendFriendRequest } from '../api';

export const SearchUsersScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [friendStatuses, setFriendStatuses] = useState({});

  // Debounce search to avoid too many queries
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setUsers([]);
        setFriendStatuses({});
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const results = await searchUsers(searchQuery, user.uid);
      setUsers(results);
      
      // Check friend status for each user
      const statuses = {};
      for (const searchUser of results) {
        const status = await checkFriendStatus(user.uid, searchUser.id);
        statuses[searchUser.id] = status;
      }
      setFriendStatuses(statuses);
    } catch (err) {
      console.error('[SearchUsersScreen] Search error:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await performSearch();
    setRefreshing(false);
  };

  const handleSendFriendRequest = async (recipientId) => {
    try {
      await sendFriendRequest(user.uid, recipientId);
      
      // Update the friend status
      const newStatus = {
        isFriend: false,
        hasPendingRequest: true,
        requestDirection: 'sent',
      };
      setFriendStatuses(prev => ({
        ...prev,
        [recipientId]: newStatus,
      }));
      
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      console.error('[SearchUsersScreen] Send request error:', err);
      Alert.alert('Error', err.message || 'Failed to send friend request');
    }
  };

  const renderUserItem = ({ item }) => {
    const status = friendStatuses[item.id] || {};
    const profilePhotoUrl = item.profilePhotoUrl || 'https://via.placeholder.com/100';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
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
            <View style={styles.actionContainer}>
              {status.isFriend ? (
                <Button 
                  mode="outlined" 
                  compact
                  disabled
                  style={styles.friendButton}
                >
                  Friends
                </Button>
              ) : status.hasPendingRequest ? (
                <Button 
                  mode="outlined" 
                  compact
                  disabled
                  style={styles.pendingButton}
                >
                  {status.requestDirection === 'sent' ? 'Request Sent' : 'Respond'}
                </Button>
              ) : (
                <Button 
                  mode="contained" 
                  compact
                  onPress={() => handleSendFriendRequest(item.id)}
                  style={styles.addButton}
                  labelStyle={styles.addButtonLabel}
                >
                  Add Friend
                </Button>
              )}
            </View>
          )}
        />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Search for users by username or name</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No users found</Text>
        <Text style={styles.emptySubtext}>Try a different search term</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.snapYellow} />
      </View>
    );
  };

  return (
    <View isSafe style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        icon="magnify"
        clearIcon="close"
      />
      
      {error !== '' && <FormErrorMessage error={error} visible={true} />}
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.snapYellow]}
            tintColor={Colors.snapYellow}
          />
        }
        contentContainerStyle={users.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
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
  actionContainer: {
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: Colors.snapYellow,
  },
  addButtonLabel: {
    color: Colors.black,
    fontSize: 12,
  },
  friendButton: {
    borderColor: Colors.green,
  },
  pendingButton: {
    borderColor: Colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
}); 