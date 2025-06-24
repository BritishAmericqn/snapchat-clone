# Phase 5 Production-Ready Features Specification

*Generated for Snapchat Clone MVP - Phase 5 Implementation*

---

## 🎯 Task 32: Emoji Reactions to Posts/Stories

### Feature Overview
Enable users to react to posts and stories with emoji reactions, following modern mobile UX patterns with micro-interactions and accessibility support.

### Technical Specifications

#### Data Model Extension
```javascript
// Reaction Model (matches PRD)
{
  reactionId: string,
  senderUid: string,
  targetType: 'post' | 'story',
  targetId: string,
  emoji: string, // Unicode emoji
  createdAt: Date
}

// Post Model Extension (no changes needed - reactions stored separately)
// Story Model Extension (no changes needed - reactions stored separately)
```

#### API Functions (`api/posts.js` extension)
```javascript
// Add reaction to post/story
addReactionToPost(postId, emoji, userId)
- Validates user is friend or content is public
- Prevents duplicate reactions (same user + emoji + target)
- Updates reaction count in real-time
- Returns reactionId

// Remove reaction from post/story  
removeReactionFromPost(postId, reactionId, userId)
- Validates user owns the reaction
- Updates reaction count in real-time
- Handles reaction not found gracefully

// Get reactions for post/story
getPostReactions(postId)
- Returns grouped reactions by emoji
- Includes reaction counts and recent reactors
- Respects privacy settings for reactor visibility
```

#### Components Architecture

**1. EmojiReactionBar.js**
```javascript
Props: {
  targetId: string,
  targetType: 'post' | 'story', 
  currentUserId: string,
  existingReactions: object,
  onReactionChange: function
}

Features:
- Display existing reactions with counts (max 6 emoji types shown)
- Quick reaction (double-tap heart animation)
- Emoji picker modal trigger
- Haptic feedback on interaction
- Optimistic UI updates
- Accessibility labels for screen readers
```

**2. EmojiPicker.js** 
```javascript
Props: {
  visible: boolean,
  onSelectEmoji: function,
  onClose: function,
  recentEmojis: array
}

Features:
- Recent emoji row (personalized)
- Categorized emoji sections (smileys, gestures, hearts, etc.)
- Search functionality
- Skin tone selector for applicable emojis
- Keyboard navigation support
```

**3. ReactionSummary.js**
```javascript
Props: {
  reactions: object,
  onShowReactors: function,
  maxDisplay: number
}

Features:
- Grouped reaction display (😍 12, 👍 8, ...)
- "You and 11 others" text formatting
- Expandable to show all reactors
- Animation for count changes
```

#### Integration Points

**FeedScreen.js Integration:**
- Add EmojiReactionBar below post caption/media
- Handle reaction state updates
- Show reaction summary in post footer
- Animate new reactions with spring physics

**Performance Optimizations:**
- Debounce reaction API calls (300ms)
- Cache reaction data locally
- Batch reaction updates for real-time efficiency
- Lazy load emoji picker components

#### Accessibility Features
- VoiceOver/TalkBack support for all interactive elements
- Semantic labels: "React with heart", "12 people reacted with heart"
- High contrast mode compatibility
- Large text size support
- Reduced motion respects system preference

---

## 🔔 Task 33: Push Notifications via Expo/FCM

### Feature Overview
Implement push notifications for direct messages and friend activity using Expo's push notification system, compatible with Expo Go for development.

### Technical Specifications

#### Notification Service (`services/NotificationService.js`)
```javascript
Class: NotificationService
Methods:
- registerForPushNotifications()
- sendNotification(userId, title, body, data)
- scheduleLocalNotification(title, body, trigger)
- handleNotificationPermissions()
- updateNotificationPreferences(userId, preferences)

Capabilities:
- Expo push token registration
- FCM integration (when using dev build)
- Local notification scheduling
- Background notification handling
- Deep link integration for notification taps
```

#### Notification Types

**1. Direct Message Notifications**
```javascript
Trigger: New message received
Title: "New message from [Friend Name]"
Body: "[Message preview]" or "Sent a photo 📸"
Data: { 
  type: 'message',
  chatId: string,
  senderId: string 
}
Action: Navigate to ChatRoomScreen
```

**2. Friend Request Notifications**
```javascript
Trigger: Friend request received
Title: "New friend request"
Body: "[Username] wants to be your friend"
Data: { 
  type: 'friend_request',
  fromUserId: string 
}
Action: Navigate to FriendRequestsScreen
```

**3. Friend Activity Notifications**
```javascript
Trigger: Friend accepts request / posts new content
Title: "Friend activity"
Body: "[Username] accepted your friend request" / "posted a new snap"
Data: { 
  type: 'friend_activity',
  userId: string,
  activityType: string 
}
Action: Navigate to appropriate screen
```

#### Integration Points

**Messages API Integration:**
```javascript
// In sendMessage function
await sendNotification(
  recipientId,
  `New message from ${senderName}`,
  messagePreview,
  { type: 'message', chatId, senderId }
);
```

**Friends API Integration:**
```javascript
// In acceptFriendRequest function
await sendNotification(
  requesterId,
  'Friend request accepted',
  `${currentUserName} is now your friend!`,
  { type: 'friend_activity', userId: currentUserId }
);
```

#### Notification Preferences

**PrivacySettingsScreen.js Extension:**
```javascript
New Settings:
- Enable push notifications (master toggle)
- Direct message notifications
- Friend request notifications  
- Friend activity notifications
- Quiet hours (start/end time)
- Notification preview (show/hide content)
```

#### Development Considerations
- **Expo Go**: Uses Expo push service (limited but functional)
- **Development Build**: Full FCM integration with custom sounds/icons
- **Testing**: Expo push tool for testing notifications
- **Analytics**: Track notification delivery and engagement rates

---

## 🛡️ Task 34: User Moderation (Mute, Block, Report)

### Feature Overview
Implement comprehensive user moderation features including mute, block, and report functionality to ensure platform safety and user control.

### Technical Specifications

#### Data Model
```javascript
// User Relationships Extension
{
  uid: string,
  // ... existing fields
  mutedUsers: string[], // Array of muted user IDs
  blockedUsers: string[], // Array of blocked user IDs
  blockedByUsers: string[] // Array of users who blocked this user
}

// Report Model
{
  reportId: string,
  reporterUid: string,
  reportedUid: string,
  reason: 'harassment' | 'spam' | 'inappropriate_content' | 'fake_account' | 'other',
  description: string,
  createdAt: Date,
  status: 'pending' | 'reviewed' | 'resolved',
  moderatorNotes: string
}
```

#### API Functions (`api/moderation.js`)
```javascript
// Mute user (restrict posting notifications)
muteUser(targetUserId, currentUserId)
- Adds to mutedUsers array
- Updates user preferences
- Affects notification delivery
- Reversible action

// Block user (complete access restriction)  
blockUser(targetUserId, currentUserId)
- Adds to blockedUsers array
- Adds currentUserId to target's blockedByUsers
- Removes from friends if applicable
- Cancels pending friend requests
- Filters blocked users from all feeds/searches

// Report user (flag for review)
reportUser(targetUserId, currentUserId, reason, description)
- Creates report record
- Prevents duplicate reports
- Triggers moderation workflow
- Anonymous to reported user

// Get moderation status
getModerationStatus(targetUserId, currentUserId)
- Returns: { isMuted, isBlocked, isBlockedBy, hasReported }
- Used to determine UI state and permissions
```

#### UI Components

**1. ModerationMenu.js**
```javascript
Props: {
  targetUserId: string,
  currentUserId: string,
  visible: boolean,
  onClose: function
}

Options:
- Mute user (with explanation)
- Block user (with confirmation dialog)
- Report user (opens ReportModal)
- Cancel (close menu)

Design:
- Bottom sheet modal
- Clear action consequences
- Confirmation steps for destructive actions
```

**2. ReportModal.js**
```javascript
Props: {
  targetUserId: string,
  targetUsername: string,
  visible: boolean,
  onSubmit: function,
  onCancel: function
}

Features:
- Reason selection (radio buttons)
- Optional description field
- Report submission
- Success confirmation
- Clear privacy policy reference
```

**3. ModerationButton.js**
```javascript
Props: {
  targetUserId: string,
  style: 'icon' | 'text',
  onPress: function
}

Variants:
- Three-dot menu icon (UserProfileScreen)
- "More options" text button (ChatRoomScreen)
- Context menu trigger (long press on messages)
```

#### Integration Points

**UserProfileScreen.js:**
- Add moderation menu to header (three-dot icon)
- Hide moderated users' content appropriately
- Show "User not available" for blocked users

**ChatRoomScreen.js:**
- Add moderation options to header menu
- Prevent messaging blocked users
- Filter messages from muted users (optional)

**SearchUsersScreen.js:**
- Filter blocked users from search results
- Show muted status in search results (subtle indicator)

**FeedScreen.js:**
- Filter posts from blocked users
- Reduce visibility of muted users' content
- Respect privacy settings for moderated users

#### Content Filtering Logic
```javascript
// Post visibility with moderation
function shouldShowPost(post, currentUserId, userRelationships) {
  // Block check (strongest filter)
  if (userRelationships.blockedUsers.includes(post.authorUid)) {
    return false;
  }
  
  if (userRelationships.blockedByUsers.includes(post.authorUid)) {
    return false;
  }
  
  // Mute check (reduce visibility, don't eliminate)
  if (userRelationships.mutedUsers.includes(post.authorUid)) {
    post._isMuted = true; // Add flag for UI treatment
  }
  
  return true; // Apply normal visibility rules
}
```

#### User Experience Considerations
- **Reversible Actions**: Mute/unmute should be easily reversible
- **Clear Feedback**: Users understand what each action does
- **Privacy**: Blocked users can't see they're blocked
- **Safety First**: Report function is prominent and accessible
- **Education**: Help text explains moderation features

---

## 🔮 Task 35: RAG Metadata Preparation

### Feature Overview
Reserve and implement metadata fields across all content models to prepare for future RAG (Retrieval-Augmented Generation) AI features.

### Technical Specifications

#### Metadata Schema Extensions

**Post Model Metadata:**
```javascript
{
  // ... existing post fields
  metadata: {
    // Content analysis
    embeddingId: string, // Vector embedding reference
    topics: string[], // Extracted topics/hashtags
    sentiment: 'positive' | 'neutral' | 'negative',
    contentType: 'selfie' | 'landscape' | 'food' | 'pet' | 'other',
    
    // AI features prep
    aiSuggestionId: string, // Related AI-generated suggestions
    qualityScore: number, // Content quality rating (0-1)
    engagementPrediction: number, // Predicted engagement score
    
    // User behavior
    viewDuration: number[], // Array of view durations
    interactionEvents: object[], // Tap, swipe, zoom events
    
    // Context
    location: { lat: number, lng: number }, // If permission granted
    timestamp: Date, // More precise than createdAt
    deviceInfo: string, // For debugging/analytics
    
    // Future features
    relatedContent: string[], // Similar post IDs
    aiTags: string[], // AI-generated tags
    moderationFlags: string[] // Automated content flags
  }
}
```

**Message Model Metadata:**
```javascript
{
  // ... existing message fields  
  metadata: {
    // Content analysis
    embeddingId: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    topics: string[],
    language: string, // Detected language
    
    // AI assistance prep
    suggestedReplies: string[], // AI-generated reply suggestions
    contextSummary: string, // Conversation context
    
    // Behavior tracking
    typingDuration: number, // Time spent composing
    editCount: number, // Number of edits before sending
    
    // Media metadata
    mediaAnalysis: {
      faces: number,
      objects: string[],
      scene: string,
      qualityScore: number
    },
    
    // Future features
    translationId: string, // Translation service reference
    priority: 'high' | 'normal' | 'low', // Message importance
    aiFlags: string[] // AI-detected issues
  }
}
```

**User Model Metadata:**
```javascript
{
  // ... existing user fields
  metadata: {
    // Behavior patterns
    activityPattern: {
      activeHours: number[], // Most active hours
      weeklyUsage: number[], // Usage by day of week
      featureUsage: object // Feature adoption tracking
    },
    
    // Content preferences
    contentPreferences: {
      topics: string[], // Preferred content topics
      mediaTypes: string[], // Preferred media types
      interactionStyle: string // Communication style
    },
    
    // AI personalization
    personalityProfile: string, // AI-determined personality
    recommendationSeed: string, // For content recommendations
    
    // Safety & moderation
    riskScore: number, // Automated risk assessment
    moderationHistory: object[], // Past moderation actions
    
    // Future features
    aiAssistantPrefs: object, // AI assistant settings
    learningModel: string // Personalized model reference
  }
}
```

#### Implementation Strategy

**Phase 5A: Data Structure Preparation**
1. **Extend existing API functions** to accept metadata parameter
2. **Update create functions** to initialize metadata with default values
3. **Ensure backward compatibility** with existing data
4. **Add metadata validation** schemas

**Phase 5B: Basic Metadata Collection**
1. **Device info collection** on app start
2. **Interaction tracking** on posts/messages
3. **Usage pattern logging** (privacy-compliant)
4. **Basic content categorization** (rule-based)

**Phase 5C: AI Integration Preparation**
1. **Embedding service integration** points
2. **Batch processing** queue for AI analysis
3. **A/B testing** framework for AI features
4. **Privacy controls** for AI data usage

#### API Extensions

**Posts API Enhancement (`api/posts.js`):**
```javascript
// Enhanced createPost with metadata
createPost(postData, mediaData, metadataOverrides = {})
- Automatically generates basic metadata
- Accepts custom metadata for AI features
- Validates metadata schema
- Stores with version information

// New metadata retrieval functions
getPostMetadata(postId, fields = [])
updatePostMetadata(postId, metadata, userId)
bulkUpdateMetadata(postIds, metadata) // For batch AI processing
```

**Privacy & Control Functions:**
```javascript
// User control over AI features
updateAIPreferences(userId, preferences)
exportUserMetadata(userId) // GDPR compliance
deleteUserMetadata(userId, categories) // Right to be forgotten
getMetadataUsage(userId) // Transparency report
```

#### Data Processing Pipeline

**Real-time Processing:**
- Basic metadata (device info, timestamps)
- User interaction events
- Simple content categorization

**Batch Processing (Future):**
- AI embeddings generation
- Sentiment analysis
- Content quality scoring
- Pattern recognition

**Privacy Safeguards:**
- All metadata opt-in by default
- Granular privacy controls
- Data retention policies
- User transparency tools

#### Future AI Features Enabled

**Content Intelligence:**
- Smart content suggestions
- Automated tagging
- Quality improvement recommendations
- Trend identification

**Personalization:**
- Personalized feed ranking
- Content discovery
- Friend suggestions refinement
- Notification timing optimization

**Safety & Moderation:**
- Automated content flagging
- Risk assessment
- Pattern detection for abuse
- Community guidelines enforcement

**User Experience:**
- Smart reply suggestions
- Photo enhancement recommendations
- Optimal posting time suggestions
- Content performance insights

---

## 🔄 Integration Architecture

### Cross-Feature Integration Points

**1. Reactions ↔ Notifications**
- New reaction triggers push notification
- Aggregate multiple reactions into single notification
- Reaction preferences in notification settings

**2. Moderation ↔ All Features**
- Block/mute affects feed visibility
- Moderation status impacts messaging
- Report function available on all content

**3. RAG Metadata ↔ Everything**
- Metadata collection on all user interactions
- Privacy controls affect all metadata usage
- Future AI features enhance all content types

### Performance Considerations

**Database Optimization:**
- Compound indexes for moderation filters
- Efficient reaction querying
- Metadata field indexing strategy

**Real-time Updates:**
- WebSocket connections for reactions
- Push notification batching
- Metadata collection batching

**Caching Strategy:**
- Reaction counts cached locally
- Moderation status cached per user
- Metadata preloading for AI features

---

## 🚀 Implementation Priority

**Week 1: Reactions System**
- Core reaction functionality
- Basic UI components
- Feed integration

**Week 2: Moderation Features**
- API implementation
- UI components
- Content filtering

**Week 3: Notifications**
- Service setup
- Integration points
- Testing framework

**Week 4: RAG Preparation & Polish**
- Metadata implementation
- Performance optimization
- Cross-feature testing

---

*This specification provides complete implementation guidance for all Phase 5 features while maintaining consistency with the existing codebase architecture.* 