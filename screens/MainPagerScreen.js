import React, { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Text, TouchableOpacity } from 'react-native';
// import PagerView from 'react-native-pager-view'; // Will work in dev build
import { IconButton, Badge, Avatar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { ChatListScreen } from './ChatListScreen';
import { CameraScreen } from './CameraScreen';
import { StoriesScreen } from './StoriesScreen';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { getPendingFriendRequests } from '../api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MainPagerScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [currentPage, setCurrentPage] = useState(0); // Start on chats to avoid camera crash
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const pagerRef = useRef(null);

  // Load pending friend requests count
  useEffect(() => {
    loadPendingRequestsCount();
  }, [user?.uid]);

  // Refresh count when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPendingRequestsCount();
    });

    return unsubscribe;
  }, [navigation, user?.uid]);

  const loadPendingRequestsCount = async () => {
    if (!user?.uid) return;
    
    try {
      const requests = await getPendingFriendRequests(user.uid);
      setPendingRequestsCount(requests.length);
    } catch (err) {
      console.error('[MainPagerScreen] Error loading pending requests:', err);
    }
  };

  const handlePageSelected = useCallback((pageIndex) => {
    setCurrentPage(pageIndex);
    
    // Haptic feedback for page changes
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }
  }, []);

  const pages = [
    { key: 0, title: 'Chats', component: ChatListScreen },
    { key: 1, title: 'Camera', component: CameraScreen },
    { key: 2, title: 'Stories', component: StoriesScreen },
  ];

  // For Expo Go compatibility, use tab-based navigation instead of PagerView
  const renderCurrentScreen = () => {
    const CurrentScreenComponent = pages[currentPage].component;
    return <CurrentScreenComponent navigation={navigation} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      
      {/* Header with tab navigation and friend management */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Profile Avatar */}
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar.Text 
              size={32}
              label={user?.displayName?.[0] || user?.username?.[0] || '?'} 
              style={styles.profileAvatar}
            />
          </TouchableOpacity>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            {pages.map((page, index) => (
              <TouchableOpacity
                key={page.key}
                style={[
                  styles.tab,
                  currentPage === index && styles.activeTab
                ]}
                onPress={() => handlePageSelected(index)}
              >
                <Text style={[
                  styles.tabText,
                  currentPage === index && styles.activeTabText
                ]}>
                  {page.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Friend Management Icons */}
          <View style={styles.headerRight}>
            <IconButton
              icon="account-search"
              size={20}
              iconColor={Colors.white}
              onPress={() => navigation.navigate('SearchUsers')}
            />
            <View style={styles.friendRequestContainer}>
              <IconButton
                icon="account-multiple-plus"
                size={20}
                iconColor={Colors.white}
                onPress={() => navigation.navigate('FriendRequests')}
              />
              {pendingRequestsCount > 0 && (
                <Badge style={styles.badge} size={16}>
                  {pendingRequestsCount}
                </Badge>
              )}
            </View>
          </View>
        </View>
      </View>
      
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderCurrentScreen()}
      </View>
      
      {/* Development Build Ready Message */}
      {__DEV__ && (
        <View style={styles.devNote}>
          <Text style={styles.devNoteText}>
            💡 Swipe navigation will work in development build
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    backgroundColor: Colors.black,
    paddingTop: 50, // Account for status bar
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  profileAvatar: {
    backgroundColor: Colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  activeTabText: {
    color: Colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendRequestContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.red,
    color: Colors.white,
  },
  screenContainer: {
    flex: 1,
  },
  devNote: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  devNoteText: {
    color: Colors.primary,
    textAlign: 'center',
    fontSize: 12,
  },
}); 