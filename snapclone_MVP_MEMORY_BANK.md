# Snapchat Clone MVP - Memory Bank 🧠

This document serves as a central knowledge repository for implementation details, technical decisions, bug fixes, and the reasoning behind various features. It's designed for AI assistants and developers to understand the "why" and "how" of the codebase.

---

## 📋 Table of Contents
- [Phase 0: Development Setup](#phase-0-development-setup)
- [Phase 1: Authentication & User Profiles](#phase-1-authentication--user-profiles)
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

## Phase 1: Authentication & User Profiles

### Completed Date: December 19, 2024

### What Was Done:
1. **Mock Firebase Implementation**
   - Created `config/firebase-mock.js` to enable testing in Expo Go
   - Implemented all auth functions: signIn, signUp, signOut, passwordReset
   - Added auth state listener management
   - Stores users in memory (resets on app reload)

2. **Brand Update**
   - Updated theme colors to include Snapchat yellow (#FFFC00)
   - Changed all buttons to yellow with black text
   - Updated screen titles to match Snapchat branding

3. **New Screens Created**
   - **ProfileScreen**: Editable username, display name, bio, profile image placeholder
   - **PrivacySettingsScreen**: Who can message/view stories, location, activity status
   - **Enhanced HomeScreen**: Tab navigation, quick actions, bottom nav placeholder

4. **Navigation Setup**
   - Added Profile and PrivacySettings to AppStack
   - All screens properly connected and navigable

### Critical Bug & Fix:

#### 🚨 THE FIREBASE IMPORT PITFALL 🚨

**Error Encountered**: `authInstance._getRecaptchaConfig is not a function (it is undefined)`

**Root Cause**: Mixed imports between real Firebase and mock Firebase
```javascript
// ❌ WRONG - This was the bug!
import { signInWithEmailAndPassword } from "firebase/auth";  // Real Firebase
import { auth } from "../config";  // Mock auth object

// Even though we pass mock auth, the function is from real Firebase!
await signInWithEmailAndPassword(auth, email, password);  // BREAKS!
```

**The Fix**:
```javascript
// ✅ CORRECT - Import everything from mock
import { signInWithEmailAndPassword } from "../config/firebase-mock";
import { auth } from "../config";

// Now both the function AND auth object are mocked
await signInWithEmailAndPassword(auth, email, password);  // WORKS!
```

**Files That Needed Fixing**:
1. `screens/LoginScreen.js` - signInWithEmailAndPassword
2. `screens/SignupScreen.js` - createUserWithEmailAndPassword  
3. `screens/ForgotPasswordScreen.js` - sendPasswordResetEmail
4. `screens/HomeScreen.js` - signOut
5. `navigation/RootNavigator.js` - onAuthStateChanged

**Lesson Learned**: When mocking Firebase, you must mock BOTH:
- The auth object/instance
- ALL the functions that use it

### How to Avoid This Pitfall:

1. **Always Check Imports First**: When getting Firebase errors in Expo Go, immediately check if you're importing from real Firebase
2. **Use Find & Replace**: Search for `from "firebase/` to find all real Firebase imports
3. **Consistent Import Pattern**: 
   ```javascript
   // For Expo Go (mock):
   import { auth, signInWithEmailAndPassword, ... } from "../config/firebase-mock";
   
   // For Development Build (real):
   import { auth } from "../config/firebase";
   import { signInWithEmailAndPassword, ... } from "firebase/auth";
   ```

4. **Test After Every Import Change**: Firebase errors can be cryptic - test immediately after changing imports

### Mock Firebase Capabilities:
- ✅ Creates users and stores in memory
- ✅ Validates login with stored credentials  
- ✅ Manages auth state and notifies listeners
- ✅ Password reset (mock - just logs)
- ✅ Sign out functionality
- ❌ Does NOT persist between app reloads
- ❌ Does NOT connect to real Firebase

### Switching Between Mock and Real Firebase:

In `config/index.js`:
```javascript
// For Expo Go (Phase 0 & 1):
import { auth, db, storage } from "./firebase-mock";
// import { auth, db, storage } from "./firebase";

// For Development Build (Phase 2+):
// import { auth, db, storage } from "./firebase-mock";
import { auth, db, storage } from "./firebase";
```

**Important**: When switching, you must also update ALL screen imports!

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

### 5. Expo Go Limitations
- **Cannot use**: Real Firebase Auth, Camera, Push Notifications
- **Workaround**: Mock implementations for testing
- **Solution**: Development build for real features

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

### 5. Mock vs Real Firebase Architecture
- **Mock**: Pure JavaScript, works in Expo Go
- **Real**: Requires native modules, needs dev build
- **Switch**: Single point of change in config/index.js

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

4. **Firebase Import Error**
   - **Issue**: `authInstance._getRecaptchaConfig is not a function`
   - **Root Cause**: Importing real Firebase functions with mock auth
   - **Fix**: Changed all imports to use firebase-mock
   - **Files Fixed**: Login, Signup, ForgotPassword, Home screens + RootNavigator

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

5. **Common Pitfalls to Avoid**
   - Don't mix real and mock Firebase imports
   - Always test in Expo Go before assuming native features work
   - Check imports first when debugging Firebase errors
   - Remember mock data resets on app reload

---

## Next Steps Checklist

### Immediate (Phase 2 Start):
- [ ] Create Firestore user creation logic
- [ ] Implement friend request system
- [ ] Build user search functionality
- [ ] Add mutual friends display

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
*Next Review: After Phase 2 completion*

---

## Phase 3: Ephemeral Posts & Stories

### Completed Date: December 21, 2024

### What Was Done:

1. **Mock Firebase Storage Implementation**
   - Created complete storage mock with upload, download, delete functionality
   - Supports both base64 and URI-based uploads
   - Generates proper download URLs (placeholder images for testing)
   - Stores media references in memory

2. **Posts API Layer** (`api/posts.js`)
   - `createPost`: Creates ephemeral posts with media, caption, visibility settings
   - `getFeedPosts`: Retrieves posts based on friend relationships and visibility
   - `viewPost`: Tracks views and handles delete-on-view functionality
   - `deletePost`: Removes posts and associated media
   - `getUserPosts`: Gets posts by specific user
   - `cleanupExpiredPosts`: Removes posts past expiration time

3. **Camera Screen Implementation**
   - Uses expo-image-picker for Expo Go compatibility
   - Three capture methods: camera, gallery, test images
   - Full-screen Snapchat-style interface
   - Placeholder UI for future expo-camera integration
   - Test images feature for easy testing

4. **Media Preview Screen**
   - Preview captured/selected media before posting
   - Caption input with 200 character limit
   - Visibility settings: friends, friends of friends, public
   - Ephemeral settings: delete after viewing, expiration time (1hr-1week)
   - Posts to Firebase with all metadata

5. **Feed Screen**
   - Displays posts from user and friends based on visibility rules
   - Shows time remaining, view count, author info
   - Handles view tracking and delete-on-view
   - Pull-to-refresh functionality
   - Empty state with call-to-action
   - Visual indicators for viewed posts (✓) and delete-on-view posts (👻)

6. **Test Data Population**
   - Added 6 test posts from different users
   - Various visibility settings and expiration times
   - Some with delete-on-view enabled
   - Test user given friends to see their posts

### Technical Implementation Details:

1. **Mock Storage URL Fix**
   ```javascript
   // Problem: mock:// URLs don't work in React Native
   // Solution: Return actual URLs or data URIs
   if (fileData.format === 'base64' && fileData.data) {
     url = `data:image/jpeg;base64,${fileData.data}`;
   }
   // Fallback to placeholder images
   if (!url || (!url.startsWith('http') && !url.startsWith('data:'))) {
     url = `https://picsum.photos/400/600?random=${randomId}`;
   }
   ```

2. **Date Handling in Mock Firebase**
   ```javascript
   // Store dates as Date objects, not Firestore timestamps
   createdAt: new Date(),
   expiresAt: new Date(Date.now() + expirationMs),
   // This works with mock but needs adjustment for real Firebase
   ```

3. **Feed Visibility Logic**
   ```javascript
   // Complex filtering based on:
   // 1. User's own posts (always visible)
   // 2. Friends' posts (if visibility allows)
   // 3. Friends of friends' posts (if visibility allows)
   // 4. Public posts (always visible)
   // 5. Not expired
   // 6. Not deleted
   ```

4. **Delete-on-View Implementation**
   ```javascript
   // Track views and check delete flag
   if (post.deleteOnView && !post.viewedBy.includes(currentUserId)) {
     // Delete post after updating view count
     await deletePost(postId);
   }
   ```

### Key Features Implemented:

1. **Ephemeral Content**
   - Posts expire after set time (1 hour to 1 week)
   - Optional delete-on-view for true Snapchat experience
   - Automatic cleanup of expired posts
   - Visual indicators for ephemeral content

2. **Privacy Controls**
   - Three visibility levels: friends, friends of friends, public
   - Respects user relationships from Phase 2
   - Only friends can see friend-only posts
   - Friends of friends extends visibility network

3. **Media Handling**
   - Support for camera capture (when available)
   - Gallery selection for existing photos
   - Test images for easy development
   - Proper storage integration with mock Firebase

4. **User Experience**
   - Snapchat-like camera interface
   - Smooth navigation flow
   - Real-time feed updates
   - Clear visual feedback for all actions

### Challenges & Solutions:

1. **Mock Storage URLs**
   - **Challenge**: React Native couldn't load mock:// URLs
   - **Solution**: Return data URIs or placeholder images
   - **Learning**: Always test image loading in the actual app

2. **Expo Go Camera Limitations**
   - **Challenge**: Can't use expo-camera in Expo Go
   - **Solution**: Use expo-image-picker as alternative
   - **Future**: UI ready for camera when using dev build

3. **Date Serialization**
   - **Challenge**: Firestore Timestamp vs JavaScript Date
   - **Solution**: Use plain Date objects in mock
   - **Note**: Will need adjustment for real Firebase

4. **Feed Sorting & Filtering**
   - **Challenge**: Complex visibility rules and sorting
   - **Solution**: Multi-step filtering with clear logic
   - **Performance**: Consider pagination for large datasets

### Architecture Decisions:

1. **Separate API Layer for Posts**
   - Consistent with friends API pattern
   - Easy to swap mock for real implementation
   - Clear separation of concerns

2. **Storage Path Convention**
   ```javascript
   `posts/${userId}/${postId}_${timestamp}.${extension}`
   ```
   - Organized by user for easy cleanup
   - Timestamp prevents collisions
   - Extension preserved for proper handling

3. **Post Data Model**
   ```javascript
   {
     postId: string,
     authorUid: string,
     mediaUrl: string,
     mediaType: 'image' | 'video',
     caption: string,
     visibility: 'friends' | 'friendsOfFriends' | 'public',
     viewCount: number,
     expiresAt: Date,
     deleteOnView: boolean,
     viewedBy: string[],
     createdAt: Date,
     metadata: object
   }
   ```

### Testing Insights:

1. **Test Data Importance**
   - Pre-populated posts essential for UI testing
   - Variety of settings reveals edge cases
   - Interconnected users test visibility rules

2. **Image Loading**
   - Placeholder images prevent loading errors
   - Lorem Picsum provides variety
   - Random parameter prevents caching issues

3. **Ephemeral Behavior**
   - Delete-on-view needs clear visual indicators
   - Expiration times should be testable (short options)
   - View tracking must be accurate

### Performance Considerations:

1. **Feed Loading**
   - Currently loads all posts then filters
   - Real app needs pagination
   - Consider caching viewed posts

2. **Image Optimization**
   - Need compression before upload
   - Thumbnail generation for feed
   - Lazy loading for better performance

3. **Real-time Updates**
   - Mock notifies listeners on changes
   - Real Firebase has built-in real-time
   - Consider WebSocket for custom backend

### Security Considerations:

1. **Post Visibility**
   - Enforce on backend, not just frontend
   - Check friend relationships server-side
   - Validate expiration times

2. **Media Access**
   - Storage rules should match post visibility
   - Signed URLs for time-limited access
   - Clean up orphaned media

3. **User Actions**
   - Only author can delete own posts
   - View tracking prevents manipulation
   - Rate limiting on post creation

### Lessons Learned:

1. **Start with Mock, Plan for Real**
   - Mock implementation reveals data flow
   - Same API interface eases transition
   - Test edge cases early

2. **UI Before Features**
   - Built camera UI even without camera access
   - Placeholder functionality prevents blocking
   - Progressive enhancement approach

3. **Visual Feedback Crucial**
   - Users need to understand ephemeral nature
   - Icons and colors convey meaning
   - Consistent patterns across app

4. **Test Data Tells Stories**
   - Realistic data reveals UX issues
   - Variety tests edge cases
   - Interconnected data tests relationships

### Bug Fixes During Implementation:

1. **Mock Storage URL Error**
   - **Error**: "No suitable URL request handler found for mock://storage/..."
   - **Cause**: React Native can't handle custom mock:// protocol
   - **Fix**: Return data URIs for base64 or placeholder images from Lorem Picsum
   - **Learning**: Always return valid URLs that React Native can load

2. **Missing Posts in Feed**
   - **Issue**: Only showing user's own posts
   - **Cause**: Test user had no friends
   - **Fix**: Added friends to test user and created posts from those friends
   - **Learning**: Test data relationships are crucial for feature testing

### Next Phase Preparation:

1. **Direct Messaging**
   - Reuse ephemeral post concepts
   - Need chat/conversation model
   - Real-time message delivery

2. **Stories Format**
   - Multiple media per story
   - 24-hour expiration standard
   - Story viewer UI component

3. **Development Build**
   - Required for camera, push notifications
   - Plan migration from Expo Go
   - Test on real devices

### Code Quality Notes:

1. **Consistent Error Handling**
   ```javascript
   try {
     // operation
   } catch (error) {
     console.error('[Context] Error:', error);
     Alert.alert('Error', 'User-friendly message');
   }
   ```

2. **Loading States**
   - Every async operation needs loading indicator
   - Disable interactions during loading
   - Clear feedback on completion

3. **Memory Management**
   - Unsubscribe from listeners on unmount
   - Clear timers and intervals
   - Avoid memory leaks in mock storage

---

## Phase 2: Friends & Social Graph

### Completed Date: December 19, 2024

### What Was Done:

1. **Extended Mock Firebase with Firestore**
   - Implemented full mock Firestore with collections, documents, queries, and listeners
   - Added real-time update notifications for collections and documents
   - Supports where queries, CRUD operations, and onSnapshot listeners
   - Automatically creates user profiles in Firestore during signup

2. **Created API Layer**
   - `/api/users.js`: User profile management, search, friend list operations
   - `/api/friends.js`: Friend request system, suggestions algorithm
   - Clean separation of concerns from UI components

3. **New Screens Created**
   - **SearchUsersScreen**: Real-time user search with friend status indicators
   - **FriendRequestsScreen**: Tabbed view for received/sent requests
   - **FriendSuggestionsScreen**: Smart suggestions based on mutual friends

4. **Enhanced Existing Screens**
   - **HomeScreen**: Added friend feature navigation, pending request badge
   - **ProfileScreen**: Shows friend count, quick actions for friend features

### Technical Implementation Details:

1. **Mock Firestore Architecture**
   ```javascript
   // Data storage structure
   mockFirestoreData = {
     users: { [uid]: userData },
     friendRequests: { [requestId]: requestData }
   }
   
   // Listener management
   firestoreListeners = {
     collections: { [path]: listeners[] },
     documents: { [path]: listeners[] }
   }
   ```

2. **Friend Request Flow**
   - Prevents duplicate requests in both directions
   - Updates both users' friend lists on acceptance
   - Proper authorization checks (only recipient can accept/reject)
   - Status tracking: pending, accepted, rejected

3. **Search Implementation**
   - Case-insensitive search on username and displayName
   - Excludes current user from results
   - Shows friend status for each result
   - Debounced to prevent excessive queries

4. **Friend Suggestions Algorithm**
   - Calculates mutual friends for scoring
   - Excludes existing friends and pending requests
   - Falls back to random users if no friends yet
   - Sorts by mutual friend count

### Key Features Implemented:

1. **Real-time Updates**
   - Search results update as users change profiles
   - Friend requests appear instantly
   - Friend counts update automatically

2. **User Experience**
   - Loading states and empty states for all screens
   - Pull-to-refresh on all list views
   - Error handling with user-friendly messages
   - Optimistic UI updates for better perceived performance

3. **Navigation Integration**
   - Header icons in HomeScreen for quick access
   - Badge shows pending friend request count
   - Consistent navigation flow between screens

### Mock Firestore Capabilities:
- ✅ Collections and documents
- ✅ CRUD operations (create, read, update, delete)
- ✅ Where queries with multiple operators
- ✅ Real-time listeners (onSnapshot)
- ✅ Automatic listener notifications on data changes
- ✅ Nested object updates with dot notation
- ❌ Compound queries (would need composite indexes)
- ❌ Transactions (simplified implementation)
- ❌ Offline persistence (data resets on reload)

### API Functions Created:

**User Management:**
- `createUserProfile(uid, userData)`
- `getUserProfile(uid)`
- `updateUserProfile(uid, updates)`
- `searchUsers(query, currentUserId)`
- `getUsersByIds(userIds)`
- `addFriend(userId, friendId)`
- `removeFriend(userId, friendId)`

**Friend Requests:**
- `sendFriendRequest(fromUid, toUid)`
- `acceptFriendRequest(requestId, currentUserId)`
- `rejectFriendRequest(requestId, currentUserId)`
- `cancelFriendRequest(requestId, currentUserId)`
- `getPendingFriendRequests(userId)`
- `getSentFriendRequests(userId)`
- `checkFriendStatus(userId1, userId2)`
- `getFriendSuggestions(userId, limit)`

### Testing Approach:

Created `test-friend-features.js` with comprehensive tests:
1. User search functionality
2. Friend request sending
3. Pending request retrieval
4. Friend status checking
5. Request acceptance flow
6. Friend suggestions

### Known Limitations:

1. **Mock Data Persistence**
   - All data resets on app reload
   - No real database connection
   - Limited to in-memory storage

2. **Search Limitations**
   - No full-text search (using includes())
   - Case-insensitive requires client-side filtering
   - No pagination implemented

3. **Performance Considerations**
   - All operations are synchronous in mock
   - No query optimization
   - Loading all documents for searches

### Migration Path to Real Firebase:

1. **Minimal Code Changes Required**
   - Switch imports in `config/index.js`
   - Update search to use Firestore composite indexes
   - Add proper error handling for network issues

2. **Data Model Ready**
   - User profiles with friendIds array
   - FriendRequest collection structure
   - All fields match PRD specifications

3. **Security Rules Needed**
   ```javascript
   // Users can only edit their own profile
   match /users/{userId} {
     allow read: if request.auth != null;
     allow write: if request.auth.uid == userId;
   }
   
   // Friend requests have specific permissions
   match /friendRequests/{requestId} {
     allow read: if request.auth.uid == resource.data.fromUid 
                 || request.auth.uid == resource.data.toUid;
     allow create: if request.auth.uid == request.resource.data.fromUid;
     allow update: if request.auth.uid == resource.data.toUid;
     allow delete: if request.auth.uid == resource.data.fromUid;
   }
   ```

### UI/UX Decisions:

1. **Color Scheme**
   - Snapchat yellow for primary actions
   - Gray for secondary/disabled states
   - Red for destructive actions
   - Blue for links and informational text

2. **Component Patterns**
   - Consistent list item design across screens
   - Avatar + title + description + action pattern
   - Empty states with helpful instructions
   - Loading states prevent interaction

3. **Navigation Flow**
   - Quick access from home screen
   - Deep linking to user profiles
   - Back navigation preserves state

### Next Steps for Phase 3:

1. **Before Starting Phase 3**
   - Consider switching to real Firebase
   - Implement proper image upload for profiles
   - Add push notifications for friend requests

2. **Performance Optimizations**
   - Implement pagination for user lists
   - Cache friend data locally
   - Optimize re-renders with React.memo

3. **Additional Features**
   - Block/unblock users
   - Friend request expiration
   - Mutual friend details on profiles

### Lessons Learned:

1. **Mock Implementation Benefits**
   - Rapid prototyping without backend setup
   - Easy testing of edge cases
   - Clear understanding of data flow

2. **Component Architecture**
   - Separating API logic paid off
   - Consistent error handling patterns help
   - Loading states are crucial for UX

3. **Real-time Updates**
   - Listeners simplify state management
   - Automatic updates improve user experience
   - Memory cleanup (unsubscribe) is important

---

*Last Updated: December 21, 2024*
*Phase 3 Completed Successfully*
*Next Review: After Phase 4 completion*

---

## Phase 2: Bug Fixes & Polish

### Session Date: December 19, 2024 (Evening)

### Critical Issues Fixed:

#### 1. Mock Firestore Chained Where Clauses
**The Problem**: 
```javascript
// This was BREAKING:
db.collection('friendRequests')
  .where('toUid', '==', userId)
  .where('status', '==', 'pending')
  .get();
```

**Error**: `TypeError: _config.db.collection('friendReq(...)ere('toUid', '==', userId).where is not a function`

**Root Cause**: Mock Firestore's `where()` method was returning a simple object that didn't support chaining multiple where clauses.

**The Fix**: Modified `firebase-mock.js` to return a query object that tracks multiple conditions:
```javascript
where: (field, operator, value) => {
  const query = {
    _conditions: [{ field, operator, value }],
    
    where: function(field2, operator2, value2) {
      this._conditions.push({ field: field2, operator: operator2, value: value2 });
      return this; // Enable chaining
    },
    
    get: function() {
      // Filter using ALL conditions
      return this._conditions.every(condition => {
        // Check each condition
      });
    }
  };
  return query;
}
```

**Lesson**: When mocking Firebase, consider ALL query patterns your app uses, not just simple ones.

#### 2. Friend Request Badge Not Updating
**The Problem**: Friend request count badge showed "5" even after accepting/rejecting all requests.

**Root Cause**: `HomeScreen` only loaded the count once on mount - no refresh when returning from other screens.

**The Fix**: Added navigation focus listener:
```javascript
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    loadPendingRequestsCount();
  });
  return unsubscribe;
}, [navigation, user.uid]);
```

**Why This Matters**: React Navigation doesn't re-mount screens when navigating back - they stay mounted in the stack. Without focus listeners, data becomes stale.

**Additional Safety**: Added null check for user:
```javascript
const loadPendingRequestsCount = async () => {
  if (!user?.uid) return; // Prevent crashes
  // ... rest of function
};
```

### Technical Decisions & Rationale:

#### 1. Mock Data Structure
**Decision**: Created 10 interconnected users with existing friendships

**Why**: 
- Testing friend suggestions requires users with mutual connections
- Empty friend lists make suggestion algorithm testing impossible
- Realistic data reveals UI/UX issues early

**Implementation Details**:
```javascript
// Each user has different friend counts (0-3)
// Some users are connected, creating mutual friend scenarios
// Different bio styles show text truncation handling
'user_john': {
  friendIds: ['user_sarah', 'user_mike', 'user_emma'], // 3 friends
  bio: '📸 Photography enthusiast | 🌍 Travel lover', // Emoji test
}
```

#### 2. Pre-populated Friend Requests
**Decision**: Added 5 pending requests to test user

**Why**:
- Tests accept/reject flow without manual setup
- Different timestamps test time display
- Ensures badge count functionality works

**Pattern Used**:
```javascript
'request_mike_to_test': {
  fromUid: 'user_mike',
  toUid: '12345', // test user
  status: 'pending',
  createdAt: new Date(Date.now() - 86400000), // 1 day ago
}
```

#### 3. Alert Placeholders for Future Features
**Decision**: Show informative alerts for Snap/Messages instead of console.log

**Why**:
- Better user experience during testing
- Sets expectations for future phases
- Prevents "broken feature" perception

### Pitfalls Avoided (But Easy to Fall Into):

1. **useEffect Dependency Arrays**
   - Always include ALL dependencies (we added `user.uid`)
   - Missing dependencies = stale closures = bugs
   - ESLint helps but doesn't catch everything

2. **Navigation State Management**
   - Screens stay mounted in stack navigators
   - Data doesn't refresh automatically on "back"
   - Always use focus listeners for data that changes

3. **Mock Firebase Query Limitations**
   - Real Firestore supports complex queries automatically
   - Mock needs explicit implementation for each pattern
   - Test your mock with actual app queries before assuming it works

4. **Async State Updates**
   - Setting state after async operations needs mounted checks
   - Navigation can unmount components during operations
   - Always clean up listeners and check mounting status

### Testing Insights:

1. **Mock Data Best Practices**
   - Use realistic names and data
   - Include edge cases (empty bios, no friends)
   - Test data should tell a story (interconnected users)

2. **State Synchronization**
   - Multiple screens showing same data need coordination
   - Badge counts, friend counts, request lists must stay in sync
   - Consider global state for frequently accessed data

3. **User Credentials**
   - Keep test credentials simple and documented
   - Pattern: `{name}@example.com` / `{name}123`
   - Changed from `password123` to `test123` for consistency

### Performance Considerations Discovered:

1. **Listener Cleanup**
   - Navigation listeners must be unsubscribed
   - Memory leaks from uncleaned listeners accumulate
   - Always return cleanup function from useEffect

2. **Unnecessary Re-renders**
   - Focus listener fires even when data hasn't changed
   - Consider memoization for expensive operations
   - Track if data actually changed before re-rendering

### Future-Proofing Decisions:

1. **API Layer Abstraction**
   - All Firebase calls go through API layer
   - Switching to real Firebase requires minimal changes
   - Mock and real implementations have same interface

2. **Error Boundaries**
   - Added try-catch blocks around all async operations
   - User-friendly error messages vs technical errors
   - Console errors for debugging, alerts for users

3. **Scalability Considerations**
   - Current mock loads all users at once
   - Real app would need pagination
   - Structure supports adding pagination later

### Code Smells to Watch For:

1. **Inline Magic Numbers**
   ```javascript
   // Bad: What does 86400000 mean?
   new Date(Date.now() - 86400000)
   
   // Better: Self-documenting
   const ONE_DAY_MS = 24 * 60 * 60 * 1000;
   new Date(Date.now() - ONE_DAY_MS)
   ```

2. **Inconsistent Error Handling**
   - Some functions alert users, others only console.error
   - Establish consistent error handling patterns
   - User-facing vs developer-facing errors

3. **State Update Patterns**
   ```javascript
   // Good: Functional updates for derived state
   setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
   
   // Avoid: Direct state mutations
   receivedRequests.filter(...) // NO!
   ```

### Mock Firebase Gotchas:

1. **Data Persistence**
   - Mock data resets on every app reload
   - Good for testing, confusing for new developers
   - Document this limitation prominently

2. **Synchronous vs Asynchronous**
   - Mock operations are instant
   - Real Firebase has network latency
   - Consider adding artificial delays for realistic testing

3. **Missing Firebase Features**
   - No real-time sync between devices
   - No offline persistence
   - No security rules validation
   - No composite indexes

### Navigation Patterns Learned:

1. **Screen Communication**
   - Params: One-time data pass
   - Focus listeners: Refresh on return
   - Context/Global state: Shared data
   - Choose based on data freshness needs

2. **Header Customization**
   - `useLayoutEffect` for header changes
   - Prevents flicker on mount
   - Dependencies must include all dynamic values

3. **Deep Linking Preparation**
   - Screen names should be URL-friendly
   - Params should be serializable
   - Consider future deep link structure

### Summary of Key Learnings:

1. **Test with Realistic Data**: Empty databases hide issues
2. **Plan for State Synchronization**: Multiple screens need coordination
3. **Mock Completely**: Partial mocks cause confusing errors
4. **Use Navigation Events**: Don't assume screens refresh
5. **Handle Edge Cases**: Null users, empty lists, network errors
6. **Document Decisions**: Future you will thank current you

---

*Next Session Goals: Begin Phase 3 - Camera Integration*
*Remember: Camera requires development build, plan accordingly*
