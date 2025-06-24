import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { 
  Text,
  TextInput,
  IconButton,
  ActivityIndicator,
  List,
  Avatar,
  Menu,
  Portal,
  Dialog,
  Button,
  RadioButton,
  Checkbox,
  Paragraph
} from 'react-native-paper';
import { AuthenticatedUserContext } from '../providers';
import { 
  getChatMessages, 
  sendMessage, 
  viewMessage, 
  markChatAsRead,
  getOrCreateChat,
  areUsersFriends
} from '../api';
import { Colors, db } from '../config';
import * as ImagePicker from 'expo-image-picker';

export const ChatRoomScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const { chatId: initialChatId, otherUser } = route.params;
  
  const [chatId, setChatId] = useState(initialChatId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [expireTime, setExpireTime] = useState('24'); // hours
  const [deleteOnView, setDeleteOnView] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    // Mark chat as read when entering
    markChatAsRead(chatId, user.uid);

    // Listen for new messages
    const unsubscribe = db.collection('messages')
      .where('chatId', '==', chatId)
      .onSnapshot(() => {
        loadMessages();
      });

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  const initializeChat = async () => {
    try {
      // Check if users are friends
      const isFriend = await areUsersFriends(user.uid, otherUser.uid);
      if (!isFriend) {
        Alert.alert(
          'Cannot Send Message',
          'You can only send messages to friends.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Create chat if it doesn't exist
      if (!initialChatId) {
        const chat = await getOrCreateChat(user.uid, otherUser.uid);
        setChatId(chat.id);
      }
      
      loadMessages();
    } catch (error) {
      console.error('[ChatRoomScreen] Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;
    
    try {
      const chatMessages = await getChatMessages(chatId);
      setMessages(chatMessages);
      
      // Mark messages as viewed
      chatMessages.forEach(msg => {
        if (msg.senderUid !== user.uid && !msg.viewedBy.includes(user.uid)) {
          viewMessage(msg.id, user.uid);
        }
      });
    } catch (error) {
      console.error('[ChatRoomScreen] Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (mediaUri = null, mediaType = null) => {
    if (!messageText.trim() && !mediaUri) return;
    
    setSending(true);
    try {
      console.log('[ChatRoomScreen] handleSend called with:', { 
        mediaUri,
        mediaType,
        mediaUriType: typeof mediaUri 
      });
      
      await sendMessage({
        chatId,
        senderUid: user.uid,
        text: messageText.trim(),
        mediaUri,
        mediaType,
        expiresInHours: parseInt(expireTime),
        deleteOnView
      });
      
      setMessageText('');
      flatListRef.current?.scrollToOffset({ offset: 0 });
    } catch (error) {
      console.error('[ChatRoomScreen] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async (useCamera = false) => {
    setMenuVisible(false);
    
    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      handleSend(result.assets[0].uri, 'image');
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins}m`;
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderUid === user.uid;
    const timeRemaining = getTimeRemaining(item.expiresAt);
    
    // Debug logging for image URLs
    if (item.mediaUrl) {
      console.log('[ChatRoomScreen] Rendering message with image:', {
        messageId: item.id,
        mediaUrl: item.mediaUrl,
        isFileUri: item.mediaUrl?.startsWith('file://'),
        isHttpUri: item.mediaUrl?.startsWith('http'),
      });
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {item.mediaUrl && (
            <Image 
              source={{ uri: item.mediaUrl }} 
              style={styles.messageImage}
              onError={(e) => {
                console.error('[ChatRoomScreen] Image load error:', e.nativeEvent.error);
                console.error('[ChatRoomScreen] Failed URL:', item.mediaUrl);
              }}
              onLoad={() => {
                console.log('[ChatRoomScreen] Image loaded successfully:', item.mediaUrl);
              }}
            />
          )}
          {item.text ? (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText
            ]}>
              {item.text}
            </Text>
          ) : null}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownTime : styles.otherTime
            ]}>
              {formatTime(item.createdAt)}
            </Text>
            {item.deleteOnView && (
              <Text style={styles.ephemeralIndicator}> 👻</Text>
            )}
            {item.status === 'read' && isOwnMessage && (
              <Text style={styles.readIndicator}> ✓✓</Text>
            )}
          </View>
          {timeRemaining && (
            <Text style={[
              styles.expiryText,
              isOwnMessage ? styles.ownTime : styles.otherTime
            ]}>
              Expires in {timeRemaining}
            </Text>
          )}
        </View>
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <Avatar.Text 
            size={36}
            label={otherUser?.displayName?.[0] || otherUser?.username?.[0] || '?'} 
            style={styles.headerAvatar}
          />
          <Text style={styles.headerName}>
            {otherUser?.displayName || otherUser?.username}
          </Text>
        </View>
      ),
      headerRight: () => (
        <IconButton
          icon="dots-vertical"
          onPress={() => setSettingsVisible(true)}
          color={Colors.white}
        />
      ),
    });
  }, [navigation, otherUser]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.snapYellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Send a message..."
          style={styles.textInput}
          multiline
          maxLength={500}
          disabled={sending}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="attachment"
              onPress={() => setMenuVisible(true)}
              disabled={sending}
            />
          }
        >
          <Menu.Item 
            onPress={() => handleImagePick(true)} 
            title="Take Photo" 
            leadingIcon="camera"
          />
          <Menu.Item 
            onPress={() => handleImagePick(false)} 
            title="Choose from Gallery" 
            leadingIcon="image"
          />
        </Menu>
        
        <IconButton
          icon="send"
          onPress={() => handleSend()}
          disabled={sending || !messageText.trim()}
          color={Colors.snapYellow}
        />
      </View>
      
      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>Message Settings</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Set default settings for new messages</Paragraph>
            
            <View style={styles.settingRow}>
              <Text>Delete after viewing:</Text>
              <Checkbox
                status={deleteOnView ? 'checked' : 'unchecked'}
                onPress={() => setDeleteOnView(!deleteOnView)}
                color={Colors.snapYellow}
              />
            </View>
            
            <Text style={styles.settingLabel}>Message expiration:</Text>
            <RadioButton.Group onValueChange={setExpireTime} value={expireTime}>
              <View style={styles.radioRow}>
                <RadioButton value="1" color={Colors.snapYellow} />
                <Text>1 hour</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="3" color={Colors.snapYellow} />
                <Text>3 hours</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="24" color={Colors.snapYellow} />
                <Text>24 hours</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="168" color={Colors.snapYellow} />
                <Text>7 days</Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    backgroundColor: Colors.snapYellow,
    marginRight: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: Colors.snapYellow,
  },
  otherBubble: {
    backgroundColor: Colors.lightGray,
  },
  messageText: {
    fontSize: 16,
  },
  ownText: {
    color: Colors.black,
  },
  otherText: {
    color: Colors.black,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  ownTime: {
    color: Colors.black,
    opacity: 0.7,
  },
  otherTime: {
    color: Colors.gray,
  },
  ephemeralIndicator: {
    fontSize: 12,
  },
  readIndicator: {
    fontSize: 12,
    color: Colors.black,
    opacity: 0.7,
  },
  expiryText: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 24,
    maxHeight: 100,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  settingLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
}); 