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
import { List, Avatar, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { View, FormErrorMessage } from '../components';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { 
  getPendingFriendRequests, 
  getSentFriendRequests,
  acceptFriendRequest, 
  rejectFriendRequest,
  cancelFriendRequest 
} from '../api';

export const FriendRequestsScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [selectedTab, setSelectedTab] = useState('received');
  
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [received, sent] = await Promise.all([
        getPendingFriendRequests(user.uid),
        getSentFriendRequests(user.uid),
      ]);
      
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (err) {
      console.error('[FriendRequestsScreen] Load error:', err);
      setError('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId, user.uid);
      
      // Remove from list
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Friend request accepted!');
    } catch (err) {
      console.error('[FriendRequestsScreen] Accept error:', err);
      Alert.alert('Error', err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectFriendRequest(requestId, user.uid);
              
              // Remove from list
              setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
              
              Alert.alert('Success', 'Friend request rejected');
            } catch (err) {
              console.error('[FriendRequestsScreen] Reject error:', err);
              Alert.alert('Error', err.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (requestId) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this friend request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelFriendRequest(requestId, user.uid);
              
              // Remove from list
              setSentRequests(prev => prev.filter(req => req.id !== requestId));
              
              Alert.alert('Success', 'Friend request cancelled');
            } catch (err) {
              console.error('[FriendRequestsScreen] Cancel error:', err);
              Alert.alert('Error', err.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const renderReceivedItem = ({ item }) => {
    const fromUser = item.fromUser;
    if (!fromUser) return null;
    
    const profilePhotoUrl = fromUser.profilePhotoUrl || 'https://via.placeholder.com/100';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { userId: fromUser.id })}
      >
        <List.Item
          title={fromUser.displayName || fromUser.username}
          description={`@${fromUser.username}${fromUser.bio ? ' • ' + fromUser.bio : ''}`}
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
              <Button 
                mode="contained" 
                compact
                onPress={() => handleAccept(item.id)}
                style={styles.acceptButton}
                labelStyle={styles.acceptButtonLabel}
              >
                Accept
              </Button>
              <Button 
                mode="outlined" 
                compact
                onPress={() => handleReject(item.id)}
                style={styles.rejectButton}
                labelStyle={styles.rejectButtonLabel}
              >
                Reject
              </Button>
            </View>
          )}
        />
      </TouchableOpacity>
    );
  };

  const renderSentItem = ({ item }) => {
    const toUser = item.toUser;
    if (!toUser) return null;
    
    const profilePhotoUrl = toUser.profilePhotoUrl || 'https://via.placeholder.com/100';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { userId: toUser.id })}
      >
        <List.Item
          title={toUser.displayName || toUser.username}
          description={`@${toUser.username}${toUser.bio ? ' • ' + toUser.bio : ''}`}
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
              <Button 
                mode="outlined" 
                compact
                onPress={() => handleCancel(item.id)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel Request
              </Button>
            </View>
          )}
        />
      </TouchableOpacity>
    );
  };

  const renderEmpty = (type) => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {type === 'received' 
            ? 'No pending friend requests' 
            : 'No sent friend requests'}
        </Text>
        <Text style={styles.emptySubtext}>
          {type === 'received'
            ? 'When someone sends you a friend request, it will appear here'
            : 'Friend requests you send will appear here until they are accepted'}
        </Text>
      </View>
    );
  };

  if (loading && receivedRequests.length === 0 && sentRequests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
      </View>
    );
  }

  const currentData = selectedTab === 'received' ? receivedRequests : sentRequests;

  return (
    <View isSafe style={styles.container}>
      {error !== '' && <FormErrorMessage error={error} visible={true} />}
      
      <SegmentedButtons
        value={selectedTab}
        onValueChange={setSelectedTab}
        buttons={[
          {
            value: 'received',
            label: `Received (${receivedRequests.length})`,
          },
          {
            value: 'sent',
            label: `Sent (${sentRequests.length})`,
          },
        ]}
        style={styles.segmentedButtons}
      />
      
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={selectedTab === 'received' ? renderReceivedItem : renderSentItem}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={() => renderEmpty(selectedTab)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.snapYellow]}
            tintColor={Colors.snapYellow}
          />
        }
        contentContainerStyle={currentData.length === 0 ? styles.emptyList : null}
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
  segmentedButtons: {
    margin: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: Colors.snapYellow,
  },
  acceptButtonLabel: {
    color: Colors.black,
    fontSize: 12,
  },
  rejectButton: {
    borderColor: Colors.gray,
  },
  rejectButtonLabel: {
    color: Colors.gray,
    fontSize: 12,
  },
  cancelButton: {
    borderColor: Colors.red,
  },
  cancelButtonLabel: {
    color: Colors.red,
    fontSize: 12,
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