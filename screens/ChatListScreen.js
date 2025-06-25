import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { 
  Text,
  ActivityIndicator,
  List,
  Avatar,
  Badge,
  Title,
  FAB,
  Searchbar
} from 'react-native-paper';
import { AuthenticatedUserContext } from '../providers';
import { getUserChats, cleanupExpiredMessages } from '../api';
import { Colors, db } from '../config';
import { useFocusEffect } from '@react-navigation/native';

export const ChatListScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load chats on mount and when returning to screen
  useFocusEffect(
    React.useCallback(() => {
      loadChats();
      // Clean up expired messages when viewing chat list
      cleanupExpiredMessages();
    }, [user?.uid])
  );

  // Set up real-time listener for chat updates
  useEffect(() => {
    if (!user?.uid) return;

    // Listen for chat updates
    const unsubscribe = db.collection('chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(() => {
        // Reload chats when there are updates
        loadChats();
      });

    return () => unsubscribe();
  }, [user?.uid]);

  const loadChats = async () => {
    if (!user?.uid) return;
    
    try {
      const userChats = await getUserChats(user.uid);
      setChats(userChats);
      setFilteredChats(userChats);
    } catch (error) {
      console.error('[ChatListScreen] Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => 
        chat.otherUser?.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        chat.otherUser?.username?.toLowerCase().includes(query.toLowerCase()) ||
        chat.lastMessage?.text?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  };

  const navigateToChat = (chat) => {
    navigation.navigate('ChatRoom', {
      chatId: chat.id,
      otherUser: chat.otherUser
    });
  };

  const navigateToNewChat = () => {
    navigation.navigate('SearchUsers', { selectForChat: true });
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString();
  };

  const renderChat = ({ item }) => {
    const unreadCount = item.unreadCount?.[user.uid] || 0;
    const lastMessageText = item.lastMessage?.text || 'No messages yet';
    const lastMessageTime = formatTime(item.lastMessage?.createdAt);
    
    return (
      <TouchableOpacity onPress={() => navigateToChat(item)}>
        <List.Item
          title={item.otherUser?.displayName || item.otherUser?.username || 'Unknown User'}
          description={lastMessageText}
          descriptionNumberOfLines={1}
          descriptionStyle={styles.lastMessage}
          left={props => (
            <View style={styles.avatarContainer}>
              <Avatar.Text 
                {...props} 
                size={48}
                label={item.otherUser?.displayName?.[0] || item.otherUser?.username?.[0] || '?'} 
                style={styles.avatar}
              />
              {unreadCount > 0 && (
                <Badge style={styles.unreadBadge}>{unreadCount}</Badge>
              )}
            </View>
          )}
          right={props => (
            <View style={styles.rightContent}>
              <Text style={styles.timeText}>{lastMessageTime}</Text>
            </View>
          )}
          style={styles.listItem}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search chats..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Title style={styles.emptyTitle}>
            {searchQuery ? 'No chats found' : 'No messages yet'}
          </Title>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'Try searching with different keywords'
              : 'Start a conversation with your friends!'}
          </Text>
          
          {/* Friend Management Options in Empty State */}
          {!searchQuery && (
            <View style={styles.friendManagementSection}>
              <Text style={styles.sectionTitle}>Find Friends</Text>
              
              <TouchableOpacity 
                style={styles.friendManagementButton}
                onPress={() => navigation.navigate('SearchUsers')}
              >
                <Text style={styles.friendManagementButtonText}>🔍 Search Users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.friendManagementButton}
                onPress={() => navigation.navigate('FriendSuggestions')}
              >
                <Text style={styles.friendManagementButtonText}>👥 Friend Suggestions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.friendManagementButton}
                onPress={() => navigation.navigate('FriendRequests')}
              >
                <Text style={styles.friendManagementButtonText}>📨 Friend Requests</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.friendManagementButton}
                onPress={() => navigation.navigate('FriendsList')}
              >
                <Text style={styles.friendManagementButtonText}>👫 My Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChat}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.snapYellow]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <FAB
        icon="message-plus"
        style={styles.fab}
        onPress={navigateToNewChat}
        color={Colors.black}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContent: {
    paddingBottom: 80,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: Colors.snapYellow,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: -5,
    backgroundColor: Colors.red,
  },
  lastMessage: {
    color: Colors.gray,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: Colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
  },
  friendManagementSection: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.black,
  },
  friendManagementButton: {
    width: '100%',
    padding: 15,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  friendManagementButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.snapYellow,
  },
}); 