import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, Card, Button, IconButton, Badge } from 'react-native-paper';
import { AuthenticatedUserContext } from '../providers';
import { signOut } from '../config/firebase-mock';
import { auth, Colors } from '../config';
import { getPendingFriendRequests } from '../api';

export const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    loadPendingRequestsCount();
  }, []);

  // Refresh count when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPendingRequestsCount();
    });

    return unsubscribe;
  }, [navigation, user.uid]);

  const loadPendingRequestsCount = async () => {
    if (!user?.uid) return;
    
    try {
      const requests = await getPendingFriendRequests(user.uid);
      setPendingRequestsCount(requests.length);
    } catch (err) {
      console.error('[HomeScreen] Error loading pending requests:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSnapPress = () => {
    console.log('Snap pressed');
    // Phase 3 placeholder
    Alert.alert(
      'Camera Feature Coming Soon!',
      'The camera feature will be available in Phase 3. It will include:\n\n• Photo and video capture\n• AR filters\n• Ephemeral content\n• Story creation',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleMessagesPress = () => {
    console.log('Messages pressed');
    // Phase 4 placeholder
    Alert.alert(
      'Direct Messages Coming Soon!',
      'Direct messaging will be available in Phase 4. It will include:\n\n• One-on-one chats\n• Disappearing messages\n• Photo and video sharing\n• Read receipts',
      [{ text: 'OK', style: 'default' }]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="account-search"
            size={24}
            color="#ffffff"
            onPress={() => navigation.navigate('SearchUsers')}
          />
          <View>
            <IconButton
              icon="account-multiple-plus"
              size={24}
              color="#ffffff"
              onPress={() => navigation.navigate('FriendRequests')}
            />
            {pendingRequestsCount > 0 && (
              <Badge style={styles.badge} size={16}>
                {pendingRequestsCount}
              </Badge>
            )}
          </View>
        </View>
      ),
    });
  }, [navigation, pendingRequestsCount]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Welcome to Snapchat Clone! 👻</Title>
        
        <Card style={styles.card}>
          <Card.Title title="Quick Actions" />
          <Card.Content>
            <Button 
              mode="contained" 
              icon="camera" 
              style={styles.quickButton}
              labelStyle={styles.quickButtonLabel}
              onPress={handleSnapPress}
            >
              Take a Snap
            </Button>
            
            <Button 
              mode="contained" 
              icon="chat" 
              style={[styles.quickButton, styles.chatButton]}
              labelStyle={styles.quickButtonLabel}
              onPress={handleMessagesPress}
            >
              Messages
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Friends" />
          <Card.Content>
            <Button 
              mode="outlined" 
              icon="account-search" 
              style={styles.friendButton}
              onPress={() => navigation.navigate('SearchUsers')}
            >
              Search Users
            </Button>
            
            <Button 
              mode="outlined" 
              icon="account-multiple-plus" 
              style={styles.friendButton}
              onPress={() => navigation.navigate('FriendRequests')}
            >
              Friend Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
            </Button>
            
            <Button 
              mode="outlined" 
              icon="account-group" 
              style={styles.friendButton}
              onPress={() => navigation.navigate('FriendSuggestions')}
            >
              Friend Suggestions
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Account" />
          <Card.Content>
            <Button 
              mode="outlined" 
              icon="account" 
              style={styles.accountButton}
              onPress={() => navigation.navigate('Profile')}
            >
              My Profile
            </Button>
            
            <Button 
              mode="outlined" 
              icon="logout" 
              style={[styles.accountButton, styles.logoutButton]}
              labelStyle={styles.logoutButtonLabel}
              onPress={handleSignOut}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.red,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  quickButton: {
    marginBottom: 10,
    backgroundColor: Colors.snapYellow,
  },
  quickButtonLabel: {
    color: Colors.black,
  },
  chatButton: {
    backgroundColor: Colors.blue,
  },
  friendButton: {
    marginBottom: 10,
    borderColor: Colors.gray,
  },
  accountButton: {
    marginBottom: 10,
    borderColor: Colors.gray,
  },
  logoutButton: {
    borderColor: Colors.red,
  },
  logoutButtonLabel: {
    color: Colors.red,
  },
});
