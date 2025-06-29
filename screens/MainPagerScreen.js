import React, { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Text, TouchableOpacity } from 'react-native';
// import PagerView from 'react-native-pager-view'; // Will work in dev build
import { IconButton, Badge, Avatar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { ChatListScreen } from './ChatListScreen';
import { CameraScreen } from './CameraScreen';
import { StoriesScreen } from './StoriesScreen';
import { Colors, Gradients } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { getPendingFriendRequests } from '../api';
import { GradientBackground } from '../components';
import { LinearGradient } from 'expo-linear-gradient';

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
    <GradientBackground gradientType="darkSwirl" style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced header with frosted glass */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Profile Avatar with enhanced glow */}
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarGlow}>
              <Avatar.Text 
                size={36}
                label={user?.displayName?.[0] || user?.username?.[0] || '?'} 
                style={styles.profileAvatar}
              />
            </View>
          </TouchableOpacity>

          {/* Icon Navigation with enhanced active states */}
          <View style={styles.tabBar}>
            {pages.map((page, index) => {
              const isActive = currentPage === index;
              return (
                <TouchableOpacity
                  key={page.key}
                  style={[
                    styles.iconTab,
                  ]}
                  onPress={() => handlePageSelected(index)}
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <View style={styles.activeIconTab}>
                      <IconButton
                        icon={page.activeIcon}
                        size={24}
                        iconColor={Colors.primary}
                        style={styles.tabIcon}
                      />
                      <Text style={[styles.tabLabel, styles.activeTabLabel]}>
                        {page.title}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.inactiveIconTab}>
                      <IconButton
                        icon={page.icon}
                        size={24}
                        iconColor={Colors.white}
                        style={styles.tabIcon}
                      />
                      <Text style={styles.tabLabel}>
                        {page.title}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Friend Management Icons */}
          <View style={styles.headerRight}>
            <IconButton
              icon="account-search"
              size={22}
              iconColor={Colors.white}
              onPress={() => navigation.navigate('SearchUsers')}
              style={styles.actionButton}
            />
            <View style={styles.friendRequestContainer}>
              <IconButton
                icon="account-multiple-plus"
                size={22}
                iconColor={Colors.white}
                onPress={() => navigation.navigate('FriendRequests')}
                style={styles.actionButton}
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
      

    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50, // Account for status bar
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 16,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    // Frosted glass effect
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  avatarGlow: {
    borderRadius: 20,
    padding: 2,
    backgroundColor: Colors.zimaBlueAlpha + '30',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  profileAvatar: {
    backgroundColor: Colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  iconTab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  activeIconTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Frosted glass effect
    overflow: 'hidden',
  },
  inactiveIconTab: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabIcon: {
    margin: 0,
    width: 32,
    height: 32,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.gray,
    marginTop: -4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  friendRequestContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.red,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  screenContainer: {
    flex: 1,
  },
}); 