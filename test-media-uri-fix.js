// Minimal test to verify media URI fix
import { Alert } from 'react-native';

export const testMediaUriFix = async () => {
  console.log('🧪 Testing Media URI Fix...');
  
  try {
    const { sendMessage } = await import('./api/messages');
    
    const testCases = [
      { name: 'Null URI', mediaUri: null, mediaType: null },
      { name: 'Undefined URI', mediaUri: undefined, mediaType: undefined },
      { name: 'Empty String', mediaUri: '', mediaType: null },
      { name: 'Invalid Object', mediaUri: {}, mediaType: 'image' },
      { name: 'Valid String', mediaUri: 'https://picsum.photos/200/300', mediaType: 'image' },
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name} with value:`, testCase.mediaUri);
        
        const result = await sendMessage({
          chatId: 'test_chat_minimal',
          senderUid: 'test_user_minimal',
          text: 'Minimal test',
          mediaUri: testCase.mediaUri,
          mediaType: testCase.mediaType
        });
        
        results.push({ name: testCase.name, success: true, error: null });
        console.log(`✅ ${testCase.name}: Success`);
        
      } catch (error) {
        results.push({ name: testCase.name, success: false, error: error.message });
        console.log(`❌ ${testCase.name}: ${error.message}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    const message = `Media URI Fix Test Results:\n${successCount}/${totalCount} tests handled gracefully\n\nDetails:\n${results.map(r => `${r.success ? '✅' : '❌'} ${r.name}${r.error ? ': ' + r.error : ''}`).join('\n')}`;
    
    console.log(message);
    Alert.alert('Media URI Fix Test', message);
    
    return results;
    
  } catch (error) {
    const errorMessage = `Test setup failed: ${error.message}`;
    console.error(errorMessage);
    Alert.alert('Test Error', errorMessage);
    return null;
  }
};

export default testMediaUriFix; 