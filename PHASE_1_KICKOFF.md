# 🚀 Snapchat Clone MVP - Phase 1 Kickoff: Authentication & User Profiles

## **Project Context**
You're working on a Snapchat Clone MVP built with React Native, Expo, and Firebase. The project uses the expo-firebase-starter template as its foundation.

**Tech Stack:**
- React Native 0.79.4 + Expo SDK 53
- Firebase (Auth, Firestore, Storage)
- NativeWind 4.x (Tailwind for React Native)
- Zustand for state management
- React Navigation for routing

## **Current Status**
**Phase 0 ✅ COMPLETE** - Development setup and stability foundation established:
- Project configured with proper folder structure
- ESLint and Prettier configured
- Dependencies updated to latest compatible versions
- Git repository initialized with clean commits
- Firebase services connected and working

## **Phase 1 Goals**
Build a complete user profile system with the following features:

### 1. **Firestore User Creation Post-Auth** (Priority 1)
- Create user document in Firestore after successful signup
- Store: uid, username, displayName, profilePhotoUrl, bio, friendIds[], privacySettings, createdAt
- Ensure username uniqueness with proper validation

### 2. **Profile Screen with Image Upload** (Priority 2)
- Design and implement ProfileScreen component
- Allow users to edit: username, displayName, bio, profile photo
- Integrate Firebase Storage for profile photo uploads
- Implement image compression before upload

### 3. **Migrate to Zustand** (Priority 3)
- Replace Context API (AuthenticatedUserProvider) with Zustand
- Create stores: useAuthStore, useProfileStore
- Maintain auth persistence with AsyncStorage

### 4. **Privacy Settings UI** (Priority 4)
- Create PrivacySettingsScreen
- Settings for: whoCanMessage ('friends' | 'anyone')
- Settings for: whoCanViewStory ('friends' | 'friendsOfFriends')

## **Key Implementation Details**

### User Profile Schema (Firestore)
```javascript
{
  uid: string,              // Firebase Auth UID
  username: string,         // Unique, lowercase, alphanumeric
  displayName: string,      // Public display name
  profilePhotoUrl: string,  // Firebase Storage URL
  bio: string,              // Max 150 characters
  friendIds: string[],      // Array of friend UIDs
  privacySettings: {
    whoCanMessage: 'friends' | 'anyone',
    whoCanViewStory: 'friends' | 'friendsOfFriends'
  },
  createdAt: timestamp      // Firestore timestamp
}
```

### File Locations
- User API functions: `/api/users.js` (to be created)
- Profile screen: `/screens/ProfileScreen.js` (to be created)
- Privacy settings: `/screens/PrivacySettingsScreen.js` (to be created)
- Zustand stores: `/stores/` folder (to be created)
- Firebase utils: `/firebase/` folder

## **Technical Considerations**

### From Memory Bank:
1. **NativeWind Not Configured** - Needs setup in App.js and tailwind.config.js
2. **Firebase Security Rules** - Currently in test mode, needs proper rules
3. **Image Upload Pattern** - Use path: `users/{uid}/profile/photo.jpg`
4. **Username Validation** - Must be unique, consider Firestore query efficiency

### Known Issues:
- Xcode not installed (iOS testing limited to Expo Go)
- Some React 19 peer dependency warnings (non-blocking)
- HomeScreen is placeholder with logout only

## **Implementation Checklist**

```markdown
Phase 1 Tasks:
[ ] 1. Create /stores folder and implement Zustand stores
[ ] 2. Create /api/users.js with Firestore operations
[ ] 3. Update SignupScreen to create user profile post-auth
[ ] 4. Build ProfileScreen with edit capabilities
[ ] 5. Implement profile photo upload with compression
[ ] 6. Create PrivacySettingsScreen
[ ] 7. Update navigation to include new screens
[ ] 8. Configure NativeWind for styling
[ ] 9. Add proper error handling and loading states
[ ] 10. Test auth flow end-to-end
```

## **Reference Documents**
- **PRD**: `/snapclone_MVP_PRD.md` - Product requirements
- **Checklist**: `/snapclone_MVP_Checklist` - Implementation checklist
- **Memory Bank**: `/snapclone_MVP_MEMORY_BANK.md` - Technical decisions and issues
- **Setup Guide**: `/SETUP.md` - Environment setup instructions

## **Success Criteria**
Phase 1 is complete when:
1. New users have Firestore profiles created automatically
2. Users can view and edit their profile (including photo)
3. Privacy settings are configurable and saved
4. State management migrated to Zustand
5. All screens styled consistently with NativeWind

## **Getting Started Commands**
```bash
# Install any additional dependencies needed
npm install react-native-compressor  # For image compression
npm install @react-native-community/image-picker  # If not using Expo ImagePicker

# Start development
npm start

# Run linting
npm run lint

# Format code
npm run format
```

## **Architecture Notes**
- Follow existing component patterns from /components folder
- Use consistent error handling with try-catch blocks
- Implement loading states for all async operations
- Test on both iOS (Expo Go) and Android
- Commit after each major feature completion

## **Questions to Consider**
1. Should username be changeable after initial setup?
2. What image formats/sizes to support for profiles?
3. Should we implement email verification before profile creation?
4. How to handle profile photo deletion?

---

**Your Mission**: Implement the complete user profile system following the above specifications. Start with Zustand setup and Firestore user creation, then build up to the UI components. Maintain clean, documented code and test thoroughly.

**First Step**: Review the current auth implementation in SignupScreen.js and AuthenticatedUserProvider.js to understand the existing flow before making changes. 