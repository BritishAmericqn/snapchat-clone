// Test DM Image Upload Fix
import { Alert } from 'react-native';

export const testDMImageUpload = async () => {
  console.log('🧪 Testing DM Image Upload Fix...');
  
  try {
    const { sendMessage } = await import('./api/messages');
    const { storage, ref, uploadBytes, getDownloadURL } = await import('./config');
    
    const results = {
      directUpload: null,
      messageUpload: null,
      errors: []
    };
    
    // Test 1: Direct storage upload (simulating expo-image-picker result)
    try {
      console.log('\n📸 Test 1: Direct Storage Upload');
      const mockImagePickerResult = {
        uri: 'file:///path/to/image.jpg',
        type: 'image/jpeg',
        width: 1024,
        height: 768
      };
      
      const storageRef = ref(storage, 'test/direct-upload.jpg');
      await uploadBytes(storageRef, mockImagePickerResult);
      const downloadUrl = await getDownloadURL(storageRef);
      
      console.log('✅ Direct upload successful:', downloadUrl);
      results.directUpload = {
        success: true,
        url: downloadUrl
      };
    } catch (error) {
      console.error('❌ Direct upload failed:', error);
      results.directUpload = {
        success: false,
        error: error.message
      };
      results.errors.push(`Direct upload: ${error.message}`);
    }
    
    // Test 2: Message with image upload
    try {
      console.log('\n💬 Test 2: Message with Image Upload');
      const mockImagePickerResult = {
        uri: 'https://picsum.photos/400/600',
        type: 'image/jpeg'
      };
      
      const message = await sendMessage({
        chatId: 'test_dm_chat',
        senderUid: 'test_user',
        text: 'Test image message',
        mediaUri: mockImagePickerResult,
        mediaType: 'image'
      });
      
      console.log('✅ Message sent successfully:', {
        id: message.id,
        mediaUrl: message.mediaUrl
      });
      
      results.messageUpload = {
        success: true,
        messageId: message.id,
        mediaUrl: message.mediaUrl
      };
    } catch (error) {
      console.error('❌ Message upload failed:', error);
      results.messageUpload = {
        success: false,
        error: error.message
      };
      results.errors.push(`Message upload: ${error.message}`);
    }
    
    // Generate report
    let report = '📊 DM Image Upload Test Results:\n\n';
    
    if (results.directUpload?.success) {
      report += '✅ Direct Storage Upload: Success\n';
      report += `   URL: ${results.directUpload.url}\n`;
    } else {
      report += '❌ Direct Storage Upload: Failed\n';
      report += `   Error: ${results.directUpload?.error}\n`;
    }
    
    report += '\n';
    
    if (results.messageUpload?.success) {
      report += '✅ Message with Image: Success\n';
      report += `   Message ID: ${results.messageUpload.messageId}\n`;
      report += `   Media URL: ${results.messageUpload.mediaUrl}\n`;
    } else {
      report += '❌ Message with Image: Failed\n';
      report += `   Error: ${results.messageUpload?.error}\n`;
    }
    
    if (results.errors.length > 0) {
      report += '\n❌ Errors:\n';
      results.errors.forEach(error => {
        report += `- ${error}\n`;
      });
    }
    
    report += '\n💡 Fix Applied:\n';
    report += '- Mock Storage now handles expo-image-picker objects\n';
    report += '- Added type checking before string methods\n';
    report += '- Supports file://, content://, and http URLs\n';
    
    console.log(report);
    Alert.alert('DM Image Upload Test', report);
    
    return results;
    
  } catch (error) {
    const errorMessage = `Test failed: ${error.message}`;
    console.error(errorMessage);
    Alert.alert('Test Error', errorMessage);
    return null;
  }
};

// Test the actual ChatRoom image picker flow
export const testChatRoomImagePicker = async () => {
  console.log('🧪 Testing ChatRoom Image Picker Flow...');
  
  try {
    const { sendMessage } = await import('./api/messages');
    
    // Simulate what expo-image-picker returns
    const imagePickerResults = [
      {
        name: 'Standard Result',
        result: {
          uri: 'file:///var/mobile/Containers/Data/Application/.../image.jpg',
          width: 1024,
          height: 768,
          type: 'image'
        }
      },
      {
        name: 'Web Result', 
        result: {
          uri: 'blob:http://localhost:19006/12345',
          width: 800,
          height: 600
        }
      },
      {
        name: 'Android Content URI',
        result: {
          uri: 'content://media/external/images/media/12345',
          type: 'image/jpeg'
        }
      }
    ];
    
    const results = [];
    
    for (const testCase of imagePickerResults) {
      try {
        console.log(`\nTesting: ${testCase.name}`);
        console.log('Picker result:', testCase.result);
        
        const message = await sendMessage({
          chatId: 'test_chat_room',
          senderUid: 'test_user',
          text: `Test: ${testCase.name}`,
          mediaUri: testCase.result.uri,
          mediaType: 'image'
        });
        
        results.push({
          name: testCase.name,
          success: true,
          mediaUrl: message.mediaUrl
        });
        
        console.log(`✅ ${testCase.name}: Success`);
        
      } catch (error) {
        results.push({
          name: testCase.name,
          success: false,
          error: error.message
        });
        console.error(`❌ ${testCase.name}: ${error.message}`);
      }
    }
    
    // Generate report
    const successCount = results.filter(r => r.success).length;
    let report = `ChatRoom Image Picker Test:\n${successCount}/${results.length} tests passed\n\n`;
    
    results.forEach(result => {
      if (result.success) {
        report += `✅ ${result.name}\n`;
      } else {
        report += `❌ ${result.name}: ${result.error}\n`;
      }
    });
    
    Alert.alert('ChatRoom Image Test', report);
    return results;
    
  } catch (error) {
    Alert.alert('Test Error', error.message);
    return null;
  }
};

export default testDMImageUpload; 