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
  Searchbar,
  IconButton
} from 'react-native-paper';
import { AuthenticatedUserContext } from '../providers';
import { getUserChats, cleanupExpiredMessages } from '../api';
import { Colors, Gradients, db } from '../config';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components';
import { LinearGradient } from 'expo-linear-gradient';

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
        <View style={styles.chatItemGradient}>
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
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <GradientBackground gradientType="chatBackground" style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradientType="chatBackground" style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search chats..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={Colors.primary}
        />
      </View>
      
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
          
          {/* Professional Friend Management Options with Gradients */}
          {!searchQuery && (
            <View style={styles.friendManagementSection}>
              <Text style={styles.sectionTitle}>Find Friends</Text>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('SearchUsers')}
              >
                <View style={styles.friendManagementCard}>
                  <IconButton
                    icon="account-search"
                    size={24}
                    iconColor={Colors.primary}
                    style={styles.cardIcon}
                  />
                  <Text style={styles.cardTitle}>Search Users</Text>
                  <Text style={styles.cardDescription}>Find people to connect with</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('FriendSuggestions')}
              >
                <View style={styles.friendManagementCard}>
                  <IconButton
                    icon="account-group"
                    size={24}
                    iconColor={Colors.primary}
                    style={styles.cardIcon}
                  />
                  <Text style={styles.cardTitle}>Friend Suggestions</Text>
                  <Text style={styles.cardDescription}>Discover people you may know</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('FriendRequests')}
              >
                <View style={styles.friendManagementCard}>
                  <IconButton
                    icon="account-multiple-plus"
                    size={24}
                    iconColor={Colors.primary}
                    style={styles.cardIcon}
                  />
                  <Text style={styles.cardTitle}>Friend Requests</Text>
                  <Text style={styles.cardDescription}>Manage pending requests</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('FriendsList')}
              >
                <View style={styles.friendManagementCard}>
                  <IconButton
                    icon="account-multiple"
                    size={24}
                    iconColor={Colors.primary}
                    style={styles.cardIcon}
                  />
                  <Text style={styles.cardTitle}>My Friends</Text>
                  <Text style={styles.cardDescription}>View your connections</Text>
                </View>
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
              colors={[Colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.fab}>
        <FAB
          icon="message-plus"
          onPress={navigateToNewChat}
          color={Colors.black}
          style={styles.fabButton}
        />
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Frosted glass effect
    overflow: 'hidden',
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    elevation: 0,
    borderRadius: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  chatItemGradient: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    elevation: 6,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Frosted glass effect
    overflow: 'hidden',
    backdropFilter: 'blur(10px)', // Note: This won't work in RN, but good for documentation
  },
  listItem: {
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: -5,
    backgroundColor: Colors.red,
  },
  lastMessage: {
    color: Colors.black,
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
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.black,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  friendManagementSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: Colors.black,
    textAlign: 'center',
  },
  friendManagementCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Frosted glass effect
    overflow: 'hidden',
  },
  cardIcon: {
    margin: 0,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 12,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Frosted glass effect
    overflow: 'hidden',
  },
  fabButton: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
}); 