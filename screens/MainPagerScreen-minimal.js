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
    { 
      key: 0, 
      title: 'Chats', 
      icon: 'chat-outline',
      activeIcon: 'chat',
      component: ChatListScreen 
    },
    { 
      key: 1, 
      title: 'Camera', 
      icon: 'camera-outline',
      activeIcon: 'camera',
      component: CameraScreen 
    },
    { 
      key: 2, 
      title: 'Stories', 
      icon: 'play-circle-outline',
      activeIcon: 'play-circle',
      component: StoriesScreen 
    },
  ];

  // For Expo Go compatibility, use tab-based navigation instead of PagerView
  const renderCurrentScreen = () => {
    const CurrentScreenComponent = pages[currentPage].component;
    return <CurrentScreenComponent navigation={navigation} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      
      {/* Ultra-minimal header with icons only */}
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

          {/* Ultra-minimal Icon Navigation - Icons Only */}
          <View style={styles.tabBar}>
            {pages.map((page, index) => {
              const isActive = currentPage === index;
              return (
                <TouchableOpacity
                  key={page.key}
                  style={[
                    styles.minimalIconTab,
                    isActive && styles.activeMinimalTab
                  ]}
                  onPress={() => handlePageSelected(index)}
                  activeOpacity={0.6}
                >
                  <IconButton
                    icon={isActive ? page.activeIcon : page.icon}
                    size={26}
                    iconColor={isActive ? Colors.black : Colors.white}
                    style={styles.minimalTabIcon}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Friend Management Icons */}
          <View style={styles.headerRight}>
            <IconButton
              icon="account-search"
              size={20}
              iconColor={Colors.white}
              onPress={() => navigation.navigate('SearchUsers')}
              style={styles.minimalActionButton}
            />
            <View style={styles.friendRequestContainer}>
              <IconButton
                icon="account-multiple-plus"
                size={20}
                iconColor={Colors.white}
                onPress={() => navigation.navigate('FriendRequests')}
                style={styles.minimalActionButton}
              />
              {pendingRequestsCount > 0 && (
                <Badge style={styles.badge} size={14}>
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
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkGray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  profileAvatar: {
    backgroundColor: Colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 32,
  },
  minimalIconTab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    marginHorizontal: 12,
  },
  activeMinimalTab: {
    backgroundColor: Colors.primary,
  },
  minimalTabIcon: {
    margin: 0,
    width: 48,
    height: 48,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalActionButton: {
    margin: 0,
    width: 36,
    height: 36,
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
    fontWeight: '600',
    fontSize: 9,
  },
  screenContainer: {
    flex: 1,
  },
}); 