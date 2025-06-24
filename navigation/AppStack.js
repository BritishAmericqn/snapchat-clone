import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { 
  HomeScreen, 
  ProfileScreen, 
  PrivacySettingsScreen,
  SearchUsersScreen,
  FriendRequestsScreen,
  FriendSuggestionsScreen
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
    </Stack.Navigator>
  );
};
