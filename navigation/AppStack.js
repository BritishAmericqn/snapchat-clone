import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Colors } from "../config";

import { 
  HomeScreen,
  MainPagerScreen, 
  ProfileScreen, 
  PrivacySettingsScreen,
  SearchUsersScreen,
  FriendRequestsScreen,
  FriendSuggestionsScreen,
  CameraScreen,
  MediaPreviewScreen,
  FeedScreen,
  UserProfileScreen,
  FriendsListScreen,
  ChatListScreen,
  ChatRoomScreen,
  StoryViewerScreen
} from "../screens";

const Stack = createStackNavigator();

export const AppStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainPager" 
        component={MainPagerScreen} 
        options={{ headerShown: false }}
      />
      {/* Legacy HomeScreen - kept for testing but not in primary flow */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Legacy Home (Testing)',
          headerStyle: { backgroundColor: Colors.black },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen 
        name="SearchUsers" 
        component={SearchUsersScreen} 
        options={{ title: 'Search Users' }}
      />
      <Stack.Screen 
        name="FriendRequests" 
        component={FriendRequestsScreen} 
        options={{ title: 'Friend Requests' }}
      />
      <Stack.Screen 
        name="FriendSuggestions" 
        component={FriendSuggestionsScreen} 
        options={{ title: 'Friend Suggestions' }}
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen 
        name="MediaPreview" 
        component={MediaPreviewScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Feed" 
        component={FeedScreen} 
        options={{ 
          title: 'Snaps',
          headerStyle: {
            backgroundColor: Colors.black,
          },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{ 
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen} 
        options={{ 
          title: 'My Friends',
        }}
      />
      <Stack.Screen name='ChatList' component={ChatListScreen} />
      <Stack.Screen name='ChatRoom' component={ChatRoomScreen} />
      <Stack.Screen 
        name="StoryViewer" 
        component={StoryViewerScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </Stack.Navigator>
  );
};
