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
import { VideoPlayer, ConversationStarterChips, GradientBackground } from '../components';
import { 
  generateConversationStarters, 
  trackConversationStarterSuccess,
  getConversationSuccessAnalytics 
} from '../api/embeddings';

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
  
  // Conversation starter state
  const [conversationStarters, setConversationStarters] = useState([]);
  const [showConversationStarters, setShowConversationStarters] = useState(false);
  const [loadingConversationStarters, setLoadingConversationStarters] = useState(false);
  const [conversationContext, setConversationContext] = useState(null);
  
  // Enhanced conversation intelligence state (Features 41-45)
  const [conversationIntelligence, setConversationIntelligence] = useState(null);
  const [timingRecommendation, setTimingRecommendation] = useState(null);
  const [enhancedContext, setEnhancedContext] = useState(null);
  const [successAnalytics, setSuccessAnalytics] = useState(null);
  
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

  const handleMediaPick = async (useCamera = false) => {
    setMenuVisible(false);
    
    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60, // Match Snapchat-like duration limit
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });
    }

    console.log('[ChatRoomScreen] MediaPicker result:', {
      canceled: result.canceled,
      assets: result.assets,
      assetUri: result.assets?.[0]?.uri,
      assetType: result.assets?.[0]?.type,
      assetUriType: typeof result.assets?.[0]?.uri
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaUri = asset.uri;
      const mediaType = asset.type === 'video' ? 'video' : 'image';
      
      console.log('[ChatRoomScreen] Sending media with URI:', mediaUri, 'Type:', mediaType);
      handleSend(mediaUri, mediaType);
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
    
    // Debug logging for media URLs
    if (item.mediaUrl) {
      console.log('[ChatRoomScreen] Rendering message with media:', {
        messageId: item.id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
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
            <View style={styles.mediaContainer}>
              {item.mediaType === 'video' ? (
                <VideoPlayer
                  source={{ uri: item.mediaUrl }}
                  style={styles.messageVideo}
                  showControls={true}
                  autoPlay={false}
                  isMuted={true}
                  onError={(error) => {
                    console.error('[ChatRoomScreen] Video load error:', error);
                    console.error('[ChatRoomScreen] Failed URL:', item.mediaUrl);
                  }}
                  onLoad={() => {
                    console.log('[ChatRoomScreen] Video loaded successfully:', item.mediaUrl);
                  }}
                />
              ) : (
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
            </View>
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

  const shouldShowConversationStarters = () => {
    // Show conversation starters when:
    // 1. No messages in conversation
    // 2. Very few messages (< 3)
    // 3. Long silence (last message > 24 hours ago)
    // 4. User hasn't dismissed them yet
    
    if (messages.length === 0) {
      console.log('[ChatRoomScreen] 🎯 Showing conversation starters: New conversation');
      return true;
    }
    
    if (messages.length < 3) {
      console.log('[ChatRoomScreen] 🎯 Showing conversation starters: Few messages');
      return true;
    }
    
    // Check for long silence
    const lastMessage = messages[0]; // messages are sorted newest first
    if (lastMessage && lastMessage.createdAt) {
      const lastMessageTime = new Date(lastMessage.createdAt);
      const now = new Date();
      const hoursSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60);
      
      if (hoursSinceLastMessage > 24) {
        console.log('[ChatRoomScreen] 🎯 Showing conversation starters: Long silence (', hoursSinceLastMessage.toFixed(1), 'hours)');
        return true;
      }
    }
    
    return false;
  };

  const generateConversationStartersIfNeeded = async () => {
    console.log('[ChatRoomScreen] 🔍 generateConversationStartersIfNeeded called:', {
      hasUser: !!user?.uid,
      hasOtherUser: !!otherUser?.uid,
      isLoading: loadingConversationStarters,
      hasExistingStarters: conversationStarters.length > 0
    });
    
    if (!user?.uid || !otherUser?.uid) {
      console.log('[ChatRoomScreen] ⏹️ Skipping - missing user data');
      return;
    }
    
    if (conversationStarters.length > 0) {
      console.log('[ChatRoomScreen] ⏹️ Skipping - already have starters');
      return;
    }
    
    if (loadingConversationStarters) {
      console.log('[ChatRoomScreen] ⏹️ Skipping - already loading');
      return;
    }
    
    console.log('[ChatRoomScreen] 🤖 Generating enhanced conversation starters...');
    setLoadingConversationStarters(true);
    
    try {
      const result = await generateConversationStarters(user.uid, otherUser.uid, {
        category: 'mixed' // Generate variety of starter types
      });
      
      console.log('[ChatRoomScreen] 📝 Enhanced result:', result);
      
      if (result.success) {
        console.log('[ChatRoomScreen] ✅ Enhanced conversation starters generated:', result.suggestions.length);
        setConversationStarters(result.suggestions);
        setConversationContext(result.context);
        
        // Store enhanced intelligence data (Features 41-45)
        setConversationIntelligence(result.intelligence);
        setTimingRecommendation(result.context?.timingRecommendation);
        setEnhancedContext(result.context);
        
        setShowConversationStarters(true);
        
        // Load success analytics for optimization insights
        try {
          const analytics = getConversationSuccessAnalytics();
          setSuccessAnalytics(analytics);
          console.log('[ChatRoomScreen] 📊 Success analytics loaded:', analytics);
        } catch (analyticsError) {
          console.log('[ChatRoomScreen] ⚠️ Analytics loading failed:', analyticsError);
        }
        
      } else {
        console.log('[ChatRoomScreen] ⚠️ Using fallback conversation starters:', result.error);
        setConversationStarters(result.suggestions || []);
        setConversationContext(result.context);
        setShowConversationStarters(true);
      }
    } catch (error) {
      console.error('[ChatRoomScreen] ❌ Error generating enhanced conversation starters:', error);
      // Show fallback starters even on error
      setConversationStarters([
        { 
          id: 'fallback1', 
          text: 'Hey! How has your day been?', 
          category: 'general',
          reasoning: 'Friendly general starter',
          confidence: 'medium'
        },
        { 
          id: 'fallback2', 
          text: 'What have you been up to lately?', 
          category: 'general',
          reasoning: 'Open-ended conversation starter',
          confidence: 'medium'
        }
      ]);
      setShowConversationStarters(true);
    } finally {
      // CRITICAL: Always reset loading state, no matter what happens
      console.log('[ChatRoomScreen] 🔄 Resetting loading state to false');
      setLoadingConversationStarters(false);
    }
  };

  const handleConversationStarterSelect = async (suggestion) => {
    console.log('[ChatRoomScreen] 🎯 Enhanced conversation starter selected:', suggestion.text);
    
    // Set the suggestion text as the message
    setMessageText(suggestion.text);
    
    // Hide conversation starters
    setShowConversationStarters(false);
    
    // FEATURE 45: Track conversation starter success for optimization
    try {
      if (suggestion.id && chatId) {
        console.log('[ChatRoomScreen] 📊 Tracking conversation starter success...');
        const trackingResult = await trackConversationStarterSuccess(
          suggestion.id,
          chatId,
          user.uid,
          otherUser.uid
        );
        
        if (trackingResult.success) {
          console.log('[ChatRoomScreen] ✅ Success tracking initiated:', trackingResult.trackingId);
          
          // Update analytics display after tracking
          setTimeout(() => {
            try {
              const updatedAnalytics = getConversationSuccessAnalytics();
              setSuccessAnalytics(updatedAnalytics);
              console.log('[ChatRoomScreen] 📈 Analytics updated after tracking');
            } catch (error) {
              console.log('[ChatRoomScreen] ⚠️ Analytics update failed:', error);
            }
          }, 1000);
          
        } else {
          console.log('[ChatRoomScreen] ⚠️ Success tracking failed:', trackingResult.error);
        }
      }
    } catch (trackingError) {
      console.error('[ChatRoomScreen] ❌ Error tracking conversation starter success:', trackingError);
    }
    
    // Analytics: Track suggestion selection with enhanced metadata
    try {
      console.log('[ChatRoomScreen] 📊 Analytics: Enhanced conversation starter used', {
        category: suggestion.category,
        confidence: suggestion.confidence,
        intelligenceUsed: suggestion.intelligenceUsed,
        conversationStage: suggestion.metadata?.conversationStage,
        connectionStrength: suggestion.metadata?.connectionStrength,
        basedOnActivities: suggestion.metadata?.basedOnActivities
      });
    } catch (error) {
      console.log('[ChatRoomScreen] ⚠️ Enhanced analytics tracking failed:', error);
    }
  };

  const handleDismissConversationStarters = () => {
    console.log('[ChatRoomScreen] ❌ Conversation starters dismissed');
    setShowConversationStarters(false);
    
    // Analytics: Track dismissal
    try {
      console.log('[ChatRoomScreen] 📊 Analytics: Conversation starters dismissed');
    } catch (error) {
      console.log('[ChatRoomScreen] ⚠️ Analytics tracking failed:', error);
    }
  };

  // Check if conversation starters should be shown (moved after function definitions)
  useEffect(() => {
    console.log('[ChatRoomScreen] 🔍 Checking conversation starters trigger...', {
      messagesLength: messages.length,
      userUid: !!user?.uid,
      otherUserUid: !!otherUser?.uid,
      shouldShow: messages.length === 0 || shouldShowConversationStarters()
    });
    
    if (messages.length === 0 || shouldShowConversationStarters()) {
      generateConversationStartersIfNeeded();
    }
  }, [messages, user?.uid, otherUser?.uid]);

  if (loading) {
    return (
      <GradientBackground gradientType="chatBackground" style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradientType="chatBackground" style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
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
      
      {/* Enhanced Conversation Starter Suggestions with Intelligence */}
      <ConversationStarterChips
        suggestions={conversationStarters}
        onSuggestionSelect={handleConversationStarterSelect}
        onDismiss={handleDismissConversationStarters}
        visible={showConversationStarters}
        loading={loadingConversationStarters}
        contextAnalysis={conversationContext?.contextAnalysis}
        connectionStrength={conversationContext?.connectionStrength || 'moderate'}
        // Enhanced intelligence data for UI
        conversationStage={conversationContext?.conversationStage}
        timingRecommendation={timingRecommendation}
        successAnalytics={successAnalytics}
        enhancedFeatures={{
          conversationHistory: !!conversationIntelligence?.conversationHistory,
          enhancedContext: !!conversationIntelligence?.enhancedContext,
          timingIntelligence: !!conversationIntelligence?.timingIntelligence,
          activityTopics: !!conversationIntelligence?.activityTopics
        }}
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
            onPress={() => handleMediaPick(true)} 
            title="Take Photo/Video" 
            leadingIcon="camera"
          />
          <Menu.Item 
            onPress={() => handleMediaPick(false)} 
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
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
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
  mediaContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 8,
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
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Frosted glass effect
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    maxHeight: 100,
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Frosted glass effect
    overflow: 'hidden',
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