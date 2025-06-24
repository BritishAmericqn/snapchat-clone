# Snapchat Clone MVP - Memory Bank 🧠

This document serves as a central knowledge repository for implementation details, technical decisions, bug fixes, and the reasoning behind various features. It's designed for AI assistants and developers to understand the "why" and "how" of the codebase.

---

## 📋 Table of Contents
- [Phase 0: Development Setup](#phase-0-development-setup)
- [Technical Stack Decisions](#technical-stack-decisions)
- [Known Issues & Workarounds](#known-issues--workarounds)
- [Architecture Decisions](#architecture-decisions)
- [Future Considerations](#future-considerations)

---

## Phase 0: Development Setup

### Completed Date: December 19, 2024

### What Was Done:
1. **App Metadata Update**
   - Changed from "Expo Firebase Starter" to "Snapchat Clone"
   - Updated splash screen color to Snapchat yellow (#FFFC00)
   - Version set to 0.1.0 as MVP starting point

2. **Folder Structure Creation**
   - `/api` - Created for centralizing Firebase API calls
   - `/firebase` - For Firebase-specific utilities beyond config
   - `/functions` - Placeholder for Cloud Functions (separate deployment)

3. **Code Quality Tools**
   - ESLint: Using @react-native-community config with Prettier integration
   - Prettier: Configured for consistent formatting (single quotes, trailing commas)
   - Scripts added: `lint`, `lint:fix`, `format`

4. **Dependency Management**
   - Updated to Expo SDK 53 (latest stable)
   - React upgraded from 18.2.0 to 19.0.0
   - React Native upgraded from 0.73.6 to 0.79.4
   - All peer dependencies aligned

### Technical Decisions:

1. **Removed yarn.lock**
   - **Why**: Project had both yarn.lock and package-lock.json causing conflicts
   - **Decision**: Standardize on npm as it's more universally supported

2. **Deleted app.json**
   - **Why**: app.config.js provides dynamic configuration with environment variables
   - **Decision**: Single source of truth for configuration

3. **ESLint Rules**
   - Disabled `prettier/prettier` as error (set to 0) to avoid conflicts
   - Disabled inline styles warning for React Native (common pattern)
   - Allow unused variables with underscore prefix (for intentionally unused params)

4. **Kept Zustand Despite Context API Presence**
   - **Why**: Planning to migrate from Context to Zustand for better performance
   - **Current**: AuthenticatedUserProvider uses Context
   - **Future**: Will refactor to Zustand in Phase 1

### Issues Encountered:

1. **Xcode Installation Required**
   - **Issue**: iOS simulator requires full Xcode installation
   - **Status**: User needs to install Xcode from App Store
   - **Workaround**: Can use Expo Go app on physical device or Android emulator

2. **Multiple Firebase Config Files**
   - **Issue**: Noticed potential for duplicate firebase.js files
   - **Decision**: Keep config/firebase.js as single source
   - **Note**: firebase/ folder is for utilities, not config duplication

3. **React 19 Compatibility**
   - **Issue**: Some packages show peer dependency warnings with React 19
   - **Status**: Warnings only, functionality not affected
   - **Note**: Monitor for updates as ecosystem catches up

### Environment Setup:
```
Required .env variables:
- API_KEY
- AUTH_DOMAIN  
- PROJECT_ID
- STORAGE_BUCKET
- MESSAGING_SENDER_ID
- APP_ID
```

---

## Technical Stack Decisions

### Core Technologies:
1. **React Native + Expo**
   - **Why**: Rapid development, managed workflow, easy updates
   - **Trade-off**: Less control over native modules, but sufficient for MVP

2. **Firebase Suite**
   - **Auth**: Built-in user management
   - **Firestore**: Real-time NoSQL database
   - **Storage**: Media hosting for photos/videos
   - **Why**: Integrated ecosystem, generous free tier, real-time capabilities

3. **NativeWind (Tailwind for RN)**
   - **Why**: Familiar syntax for web developers, rapid styling
   - **Version**: v4.x (latest with improved performance)

4. **Zustand for State**
   - **Why**: Simpler than Redux, better than Context for performance
   - **Plan**: Migrate from Context API in Phase 1

5. **React Navigation**
   - **Stack Navigator**: For auth flow and main navigation
   - **Why**: Industry standard, well-maintained

### Dependency Purposes:
- `formik` + `yup`: Form handling and validation (auth screens)
- `@react-native-async-storage/async-storage`: Persist auth state
- `react-native-keyboard-aware-scroll-view`: Better UX for forms
- `dotenv`: Environment variable management
- `@react-native-masked-view/masked-view`: Required by React Navigation

---

## Known Issues & Workarounds

### 1. HomeScreen Placeholder
- **Current**: Basic screen with logout button only
- **Plan**: Keep for now, will be replaced with tabbed interface in Phase 1
- **Note**: Serves as auth flow verification

### 2. Firebase Security Rules
- **Status**: Using default rules (likely test mode)
- **TODO**: Implement proper security rules before production
- **Priority**: High (before Phase 2 social features)

### 3. Metro Config Warning
- **Issue**: expo-doctor shows Metro config check failure
- **Impact**: None currently, build works fine
- **Note**: Related to SDK version mismatch, resolved with updates

### 4. NativeWind Setup
- **Status**: Installed but not yet configured in components
- **Next**: Add to App.js and create tailwind.config.js
- **Reference**: Check NativeWind v4 docs for setup

---

## Architecture Decisions

### 1. Folder Structure Philosophy
- **Grouped by Feature Type**: Not by feature/domain
- **Why**: Easier to find similar code patterns
- **Example**: All screens in /screens, not /auth/screens

### 2. API Layer Design (Planned)
```javascript
// api/users.js
export const createUserProfile = async (uid, data) => {
  // Firestore logic here
}

// Why: Separation of concerns, easier testing
```

### 3. Firebase Config Isolation
- **Single firebase.js**: All Firebase services initialized once
- **Exported**: auth, db, storage
- **Why**: Avoid multiple initialization bugs

### 4. Component Library
- **Using starter components**: Button, TextInput, View, etc.
- **Why**: Consistent styling, accessibility built-in
- **Plan**: Extend with Snapchat-specific components

---

## Future Considerations

### Phase 1 Preparation:
1. **User Profile Schema**
   ```javascript
   {
     uid: string,
     username: string, // unique
     displayName: string,
     profilePhotoUrl: string,
     bio: string,
     friendIds: string[],
     privacySettings: {
       whoCanMessage: 'friends' | 'anyone',
       whoCanViewStory: 'friends' | 'friendsOfFriends'
     },
     createdAt: timestamp
   }
   ```

2. **Zustand Store Structure**
   ```javascript
   // Planned structure
   useAuthStore: user, loading, error
   useProfileStore: profile, updateProfile
   useFriendsStore: friends, requests, suggestions
   ```

3. **Image Upload Pattern**
   - Use Firebase Storage
   - Generate unique paths: `users/{uid}/profile/photo.jpg`
   - Implement image compression before upload

### Performance Considerations:
1. **Firestore Queries**
   - Design for minimal reads
   - Use compound indexes for complex queries
   - Cache friend lists locally

2. **Image Loading**
   - Implement lazy loading
   - Use thumbnail generation
   - Consider CDN for production

### Security Considerations:
1. **Environment Variables**
   - Never commit .env file
   - Use Expo's secure store for sensitive data
   - Implement API key restrictions in Firebase Console

2. **User Data**
   - Implement proper Firestore rules
   - Validate all inputs client and server side
   - Plan for content moderation

### AI Integration Prep:
1. **Metadata Fields**
   - Added to all content models
   - Will store embedding IDs for RAG
   - Enables future AI features without schema changes

2. **Content Pipeline**
   - Design with webhooks in mind
   - Prepare for async AI processing
   - Consider queue system for AI tasks

---

## Bug Fix Log

### December 19, 2024
1. **Multiple Lock Files**
   - **Issue**: Both yarn.lock and package-lock.json present
   - **Fix**: Removed yarn.lock, standardized on npm
   - **Command**: `rm yarn.lock`

2. **Invalid app.json Privacy Field**
   - **Issue**: 'privacy' not valid in Expo config
   - **Fix**: Removed field from app.config.js
   - **Note**: Field was from older Expo version

3. **Dependency Version Mismatches**
   - **Issue**: Packages incompatible with Expo SDK 53
   - **Fix**: `npx expo install --check` + manual accept
   - **Result**: All dependencies now compatible

---

## Development Tips

1. **Testing Without Xcode**
   - Use Expo Go app on physical device
   - Use Android emulator if available
   - Web version for basic UI testing

2. **Firebase Local Development**
   - Consider Firebase Emulator Suite for offline dev
   - Not set up yet, but recommended for Phase 2+

3. **Git Workflow**
   - Commit after each completed phase item
   - Use descriptive commit messages
   - Reference issue numbers when applicable

4. **Performance Monitoring**
   - React DevTools works with React Native
   - Use Flipper for advanced debugging
   - Monitor bundle size with Metro

---

## Next Steps Checklist

### Immediate (Phase 1 Start):
- [ ] Create Firestore user creation logic
- [ ] Design ProfileScreen UI
- [ ] Implement Zustand store
- [ ] Add image upload to Firebase Storage

### Soon:
- [ ] Configure NativeWind properly
- [ ] Set up Firebase security rules
- [ ] Create reusable form components
- [ ] Implement proper error handling

### Later:
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive testing
- [ ] Implement analytics
- [ ] Plan deployment strategy

---

*Last Updated: December 19, 2024*
*Next Review: After Phase 1 completion*
