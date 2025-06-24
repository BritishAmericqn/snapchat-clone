import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Text
} from 'react-native';
import { List, Avatar, Button, Chip, Divider } from 'react-native-paper';
import { View, FormErrorMessage } from '../components';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { 
  getFriendSuggestions, 
  sendFriendRequest,
  checkFriendStatus,
  getUsersByIds 
} from '../api';

export const FriendSuggestionsScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [requestStatuses, setRequestStatuses] = useState({});

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const suggestedUsers = await getFriendSuggestions(user.uid, 20);
      setSuggestions(suggestedUsers);
      
      // Check request status for each suggestion
      const statuses = {};
      for (const suggestion of suggestedUsers) {
        const status = await checkFriendStatus(user.uid, suggestion.id);
        statuses[suggestion.id] = status;
      }
      setRequestStatuses(statuses);
    } catch (err) {
      console.error('[FriendSuggestionsScreen] Load error:', err);
      setError('Failed to load friend suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  };

  const handleSendFriendRequest = async (recipientId) => {
    try {
      await sendFriendRequest(user.uid, recipientId);
      
      // Update the request status
      const newStatus = {
        isFriend: false,
        hasPendingRequest: true,
        requestDirection: 'sent',
      };
      setRequestStatuses(prev => ({
        ...prev,
        [recipientId]: newStatus,
      }));
      
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      console.error('[FriendSuggestionsScreen] Send request error:', err);
      Alert.alert('Error', err.message || 'Failed to send friend request');
    }
  };

  const renderMutualFriends = (mutualFriends) => {
    if (!mutualFriends || mutualFriends.length === 0) return null;
    
    const count = mutualFriends.length;
    const displayCount = count > 2 ? 2 : count;
    const remainingCount = count - displayCount;
    
    return (
      <View style={styles.mutualFriendsContainer}>
        <Text style={styles.mutualFriendsText}>
          {count} mutual friend{count !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  const renderSuggestionItem = ({ item }) => {
    const status = requestStatuses[item.id] || {};
    const profilePhotoUrl = item.profilePhotoUrl || 'https://via.placeholder.com/100';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <List.Item
          title={item.displayName || item.username}
          description={
            <View>
              <Text style={styles.username}>@{item.username}</Text>
              {renderMutualFriends(item.mutualFriends)}
            </View>
          }
          titleStyle={styles.userName}
          left={() => (
            <Avatar.Image 
              size={50} 
              source={{ uri: profilePhotoUrl }}
              style={styles.avatar}
            />
          )}
          right={() => (
            <View style={styles.actionContainer}>
              {status.hasPendingRequest ? (
                <Button 
                  mode="outlined" 
                  compact
                  disabled
                  style={styles.pendingButton}
                >
                  Request Sent
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
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No friend suggestions</Text>
        <Text style={styles.emptySubtext}>
          Add more friends to see suggestions based on mutual connections
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>People You May Know</Text>
        <Text style={styles.headerSubtitle}>
          Based on mutual friends and connections
        </Text>
      </View>
    );
  };

  if (loading && suggestions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
      </View>
    );
  }

  return (
    <View isSafe style={styles.container}>
      {error !== '' && <FormErrorMessage error={error} visible={true} />}
      
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={renderSuggestionItem}
        ItemSeparatorComponent={() => <Divider />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.snapYellow]}
            tintColor={Colors.snapYellow}
          />
        }
        contentContainerStyle={suggestions.length === 0 ? styles.emptyList : null}
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
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  headerSubtitle: {
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
  username: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  mutualFriendsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  mutualFriendsText: {
    fontSize: 12,
    color: Colors.blue,
    fontWeight: '500',
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
  pendingButton: {
    borderColor: Colors.gray,
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
  },
}); 