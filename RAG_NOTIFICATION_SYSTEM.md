# RAG Notification System

## Overview

The RAG Notification System provides users with real-time transparency when AI operations update the vector database or process their data. This system displays non-intrusive notifications during AI operations to keep users informed about how their data is being used.

## Key Features

- **Non-intrusive Design**: Small notification banner that appears at the top of the screen
- **Automatic Management**: Notifications appear when operations start and disappear when complete
- **Multiple Operations Support**: Can track multiple simultaneous operations
- **Smooth Animations**: Fade and slide animations for a polished user experience
- **Operation-specific Messages**: Different messages for different types of AI operations

## Implementation Components

### 1. RAGNotificationProvider (`providers/RAGNotificationProvider.js`)
- Manages global notification state
- Tracks active operations
- Provides hooks for starting/ending operations
- Auto-hides notifications after completion

### 2. RAGNotification Component (`components/RAGNotification.js`)
- Visual notification component
- Shows spinning activity indicator
- Displays operation message
- Smooth animations with React Native Animated API
- Non-blocking (doesn't interfere with user interactions)

### 3. Notification Wrapper Utility (`utils/ragNotificationWrapper.js`)
- `withRAGNotification()` function wraps async AI operations
- Handles success/failure states
- Provides consistent operation messages
- Simplifies integration into existing code

## Supported Operations

The system currently shows notifications for:

1. **User Profile Updates** - "Updating AI understanding of your profile..."
2. **User Recommendations** - "Finding personalized recommendations..."
3. **Caption Generation** - "Analyzing image for captions..."
4. **Text Overlay Suggestions** - "Generating text overlay suggestions..."
5. **Filter Recommendations** - "Analyzing for filter recommendations..."
6. **Story Discovery** - "Discovering interesting stories..."
7. **Conversation Starters** - "Generating conversation ideas..."

## Integration Example

```javascript
import { useRAGNotification } from '../providers';
import { withRAGNotification, RAG_OPERATION_MESSAGES } from '../utils';

const MyComponent = () => {
  const notificationHandlers = useRAGNotification();
  
  const handleAIOperation = async () => {
    const result = await withRAGNotification(
      async () => {
        // Your AI operation here
        return await generateCaptions(imageUri, userId);
      },
      notificationHandlers,
      `operation_${Date.now()}`, // Unique operation ID
      RAG_OPERATION_MESSAGES.CAPTION_GENERATION // Operation message
    );
    
    // Handle result...
  };
};
```

## Visual Design

- **Position**: Top of screen, below safe area
- **Background**: Semi-transparent black (rgba(0, 0, 0, 0.85))
- **Text**: White text with activity indicator
- **Border Radius**: 25px for rounded appearance
- **Padding**: Comfortable padding for readability
- **Shadow**: Subtle shadow for depth

## User Experience Benefits

1. **Transparency**: Users know when their data is being processed
2. **Trust**: Builds confidence by showing AI operations
3. **Performance Feedback**: Users understand why operations take time
4. **Privacy Awareness**: Highlights when AI analyzes personal content

## Technical Benefits

1. **Centralized Management**: All notifications managed in one place
2. **Easy Integration**: Simple wrapper function for any AI operation
3. **Consistent UX**: Same notification style across all features
4. **Extensible**: Easy to add new operation types

## Future Enhancements

- Operation progress percentages
- Cancelable operations
- Notification history/log
- User preferences for notification visibility
- Sound/haptic feedback options
- Detailed operation results in notifications

## Testing the System

To test the notification system:

1. Update your profile bio (Profile Screen)
2. Generate caption suggestions (Media Preview)
3. Request AI text overlays (Camera/Media Preview)
4. View filter recommendations (Camera/Media Preview)
5. Load user recommendations (Feed/Home)

Each action will trigger a notification showing the AI operation in progress. 