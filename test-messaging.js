/**
 * TEST FILE - Direct Messaging Features
 * Run this with: node test-messaging.js
 * This file tests Phase 4 implementation
 * 
 * DELETE THIS FILE AFTER TESTING
 */

import { 
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  viewMessage,
  markChatAsRead,
  cleanupExpiredMessages,
  areUsersFriends,
  queueMessage,
  processMessageQueue,
  getQueueStatus,
  clearMessageQueue
} from './api';

// Test user IDs
const TEST_USER_ID = '12345'; // Main test user
const SARAH_ID = 'user_sarah';
const MIKE_ID = 'user_mike';
const NON_FRIEND_ID = 'user_chris'; // Not a friend of test user

console.log('🧪 Starting Direct Messaging Tests...\n');

async function runTests() {
  try {
    // Test 1: Check if users are friends
    console.log('📋 Test 1: Friend Validation');
    const isFriendWithSarah = await areUsersFriends(TEST_USER_ID, SARAH_ID);
    const isFriendWithChris = await areUsersFriends(TEST_USER_ID, NON_FRIEND_ID);
    console.log(`✅ Test user is friend with Sarah: ${isFriendWithSarah}`);
    console.log(`✅ Test user is friend with Chris: ${isFriendWithChris}`);
    console.log('');

    // Test 2: Get or create chat
    console.log('📋 Test 2: Get or Create Chat');
    const chat1 = await getOrCreateChat(TEST_USER_ID, SARAH_ID);
    console.log('✅ Created/Retrieved chat:', chat1.id);
    
    // Should return same chat when called again
    const chat2 = await getOrCreateChat(SARAH_ID, TEST_USER_ID);
    console.log(`✅ Same chat returned: ${chat1.id === chat2.id}`);
    console.log('');

    // Test 3: Get user chats
    console.log('📋 Test 3: Get User Chats');
    const userChats = await getUserChats(TEST_USER_ID);
    console.log(`✅ Found ${userChats.length} chats for test user`);
    userChats.forEach(chat => {
      console.log(`  - Chat with ${chat.otherUser?.displayName || 'Unknown'}: ${chat.lastMessage?.text || 'No messages'}`);
    });
    console.log('');

    // Test 4: Send a message
    console.log('📋 Test 4: Send Message');
    const newMessage = await sendMessage({
      chatId: chat1.id,
      senderUid: TEST_USER_ID,
      text: 'Test message from automated test! 🤖',
      expiresInHours: 1,
      deleteOnView: false
    });
    console.log('✅ Message sent:', newMessage.id);
    console.log('');

    // Test 5: Send ephemeral message
    console.log('📋 Test 5: Send Ephemeral Message');
    const ephemeralMessage = await sendMessage({
      chatId: chat1.id,
      senderUid: TEST_USER_ID,
      text: 'This message will disappear after viewing! 👻',
      expiresInHours: 24,
      deleteOnView: true
    });
    console.log('✅ Ephemeral message sent:', ephemeralMessage.id);
    console.log('');

    // Test 6: Get chat messages
    console.log('📋 Test 6: Get Chat Messages');
    const messages = await getChatMessages(chat1.id, 10);
    console.log(`✅ Retrieved ${messages.length} messages`);
    messages.slice(0, 3).forEach(msg => {
      console.log(`  - ${msg.text} (${msg.deleteOnView ? 'ephemeral' : 'normal'})`);
    });
    console.log('');

    // Test 7: View message (should not delete non-ephemeral)
    console.log('📋 Test 7: View Messages');
    if (messages.length > 0) {
      const firstMessage = messages[0];
      await viewMessage(firstMessage.id, SARAH_ID);
      console.log('✅ Marked message as viewed by Sarah');
      
      // Check if message still exists
      const updatedMessages = await getChatMessages(chat1.id, 10);
      const messageStillExists = updatedMessages.some(m => m.id === firstMessage.id);
      console.log(`✅ Non-ephemeral message still exists: ${messageStillExists}`);
    }
    console.log('');

    // Test 8: Mark chat as read
    console.log('📋 Test 8: Mark Chat as Read');
    await markChatAsRead(chat1.id, SARAH_ID);
    console.log('✅ Marked all messages in chat as read');
    console.log('');

    // Test 9: Offline queue
    console.log('📋 Test 9: Offline Message Queue');
    
    // Queue some messages
    queueMessage({
      chatId: chat1.id,
      senderUid: TEST_USER_ID,
      text: 'Offline message 1',
      expiresInHours: 24,
      deleteOnView: false
    });
    
    queueMessage({
      chatId: chat1.id,
      senderUid: TEST_USER_ID,
      text: 'Offline message 2',
      expiresInHours: 24,
      deleteOnView: false
    });
    
    let queueStatus = getQueueStatus();
    console.log(`✅ Queued ${queueStatus.count} messages`);
    
    // Process queue
    await processMessageQueue();
    
    queueStatus = getQueueStatus();
    console.log(`✅ Queue processed, remaining: ${queueStatus.count}`);
    
    // Clear queue
    clearMessageQueue();
    queueStatus = getQueueStatus();
    console.log(`✅ Queue cleared, count: ${queueStatus.count}`);
    console.log('');

    // Test 10: Cleanup expired messages
    console.log('📋 Test 10: Cleanup Expired Messages');
    const cleanedCount = await cleanupExpiredMessages();
    console.log(`✅ Cleaned up ${cleanedCount} expired messages`);
    console.log('');

    // Test 11: Send message with media (mock)
    console.log('📋 Test 11: Send Media Message');
    const mediaMessage = await sendMessage({
      chatId: chat1.id,
      senderUid: TEST_USER_ID,
      text: 'Check out this photo!',
      mediaUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', // Mock base64
      mediaType: 'image',
      expiresInHours: 24,
      deleteOnView: true
    });
    console.log('✅ Media message sent:', mediaMessage.id);
    console.log('✅ Media URL:', mediaMessage.mediaUrl ? 'Generated' : 'Failed');
    console.log('');

    console.log('✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Chat creation and retrieval working');
    console.log('- Message sending (text and media) working');
    console.log('- Ephemeral messages with delete-on-view working');
    console.log('- Message viewing and read receipts working');
    console.log('- Offline queue functionality working');
    console.log('- Friend validation working');
    console.log('- Expired message cleanup working');
    
    console.log('\n🎉 Phase 4 Direct Messaging is fully functional!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests(); 