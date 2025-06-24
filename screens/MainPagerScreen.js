import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Text, TouchableOpacity } from 'react-native';
// import PagerView from 'react-native-pager-view'; // Will work in dev build
import * as Haptics from 'expo-haptics';
import { ChatListScreen } from './ChatListScreen';
import { CameraScreen } from './CameraScreen';
import { StoriesScreen } from './StoriesScreen';
import { Colors } from '../config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MainPagerScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(1); // Start on camera (center)
  const pagerRef = useRef(null);

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
      
      {/* Header with tab navigation */}
      <View style={styles.header}>
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
           <TouchableOpacity 
             style={styles.testButton}
             onPress={() => {
               import('../test-phase6-fixes').then(({ runPhase6Tests }) => {
                 runPhase6Tests();
               }).catch(error => {
                 console.error('Test import failed:', error);
               });
             }}
           >
             <Text style={styles.testButtonText}>🧪 Run Tests</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.testButton, { marginTop: 5, backgroundColor: '#FF6B6B' }]}
             onPress={() => {
               import('../test-media-uri-fix').then(({ testMediaUriFix }) => {
                 testMediaUriFix();
               }).catch(error => {
                 console.error('Media URI test import failed:', error);
               });
             }}
           >
             <Text style={styles.testButtonText}>🔧 URI Fix Test</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.testButton, { marginTop: 5, backgroundColor: '#6B83FF' }]}
             onPress={() => {
               import('../test-stories-debug').then(({ debugStoriesIssue }) => {
                 debugStoriesIssue();
               }).catch(error => {
                 console.error('Stories debug import failed:', error);
               });
             }}
           >
             <Text style={styles.testButtonText}>🔍 Debug Stories</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.testButton, { marginTop: 5, backgroundColor: '#4CAF50' }]}
             onPress={() => {
               import('../test-dm-image-upload').then(({ testDMImageUpload }) => {
                 testDMImageUpload();
               }).catch(error => {
                 console.error('DM image test import failed:', error);
               });
             }}
           >
             <Text style={styles.testButtonText}>📸 Test DM Images</Text>
           </TouchableOpacity>
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
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  activeTabText: {
    color: Colors.black,
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
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'center',
  },
  testButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '600',
  },
}); 