// Test script to verify project setup
import Constants from 'expo-constants';

console.log('=== Snapchat Clone Setup Test ===\n');

// Check environment variables
const requiredEnvVars = [
  'API_KEY',
  'AUTH_DOMAIN',
  'PROJECT_ID',
  'STORAGE_BUCKET',
  'MESSAGING_SENDER_ID',
  'APP_ID',
];

console.log('Checking environment variables...');
let envVarsOk = true;

requiredEnvVars.forEach((varName) => {
  const value = Constants.expoConfig?.extra?.[varName.toLowerCase().replace(/_/g, '')];
  if (value) {
    console.log(`✅ ${varName}: Configured`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    envVarsOk = false;
  }
});

if (envVarsOk) {
  console.log('\n✅ All environment variables are configured!');
} else {
  console.log('\n❌ Some environment variables are missing. Please check your .env file.');
}

console.log('\n=== Test Complete ==='); 