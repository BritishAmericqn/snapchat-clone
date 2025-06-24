import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Colors } from "../config";

import { 
  HomeScreen, 
  ProfileScreen, 
  PrivacySettingsScreen,
  SearchUsersScreen,
  FriendRequestsScreen,
  FriendSuggestionsScreen,
  CameraScreen,
  MediaPreviewScreen,
  FeedScreen
} from "../screens";

const Stack = createStackNavigator();

export const AppStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
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
    </Stack.Navigator>
  );
};
