# 2nd Degree 🌐

*A sophisticated social media platform powered by AI intelligence*

![Supports Expo iOS](https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff)
![Supports Expo Android](https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff)
[![runs with Expo Go](https://img.shields.io/badge/Runs%20with%20Expo%20Go-4630EB.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.dev/client)
![OpenAI Powered](https://img.shields.io/badge/OpenAI%20Powered-412991.svg?style=flat-square&logo=OPENAI&labelColor=f3f3f3&logoColor=000)

**2nd Degree** is a production-ready social media platform that combines authentic social connections with AI-powered creative tools. Built with React Native and enhanced by OpenAI's Vision API, it delivers a premium user experience with professional glassmorphism UI design.

## ✨ Key Features

### 🤝 **Social Connection**
- **Friends System**: Send/accept requests, mutual connections, friend suggestions
- **Direct Messaging**: Real-time chat with text, images, and videos
- **User Discovery**: AI-powered friend recommendations and search

### 📱 **Content Creation**
- **Stories & Posts**: Ephemeral content with customizable expiration (1hr-1week)
- **Camera Integration**: Hybrid system supporting both Expo Go and native builds
- **Video Support**: Full video recording, upload, and playback across all contexts
- **Text Overlays**: Drag-and-drop text positioning with professional composition

### 🤖 **AI Intelligence**
- **Smart Captions**: Context-aware caption generation using OpenAI Vision API
- **Text Overlay Suggestions**: AI-recommended text placement and styling
- **Conversation Starters**: Intelligent conversation prompts based on user context
- **Filter Recommendations**: AI-powered emoji filter suggestions

### 🎨 **Premium Experience**
- **Glassmorphism UI**: Professional frosted glass design system
- **Zima Blue Branding**: Distinctive color palette inspired by premium aesthetics
- **Ephemeral Messaging**: Snapchat-style disappearing content with view tracking
- **Content Moderation**: Comprehensive safety tools (mute, block, report)

### 🔒 **Privacy & Safety**
- **Privacy Controls**: Granular visibility settings (friends, friends-of-friends, public)
- **Content Filtering**: Smart moderation based on user relationships
- **Ephemeral by Design**: Delete-on-view and auto-expiring content
- **User Safety**: Report system with structured categories

## 🏗️ Technical Architecture

### **Frontend Stack**
- **React Native** with Expo SDK 53
- **Modern JavaScript** (ES6+) with React Hooks
- **Navigation** using React Navigation 6.x
- **State Management** with React Context and efficient patterns
- **UI Components** with custom glassmorphism design system

### **AI Integration**
- **OpenAI Vision API** for image analysis and intelligent suggestions
- **Client-side Processing** with robust error handling and fallbacks
- **Mock System** for development with seamless production migration path

### **Backend Architecture**
- **Mock Firebase** system for rapid development and testing
- **Real-time Updates** via Firestore-compatible listeners
- **Production Ready** for immediate Firebase migration
- **Image Composition** using react-native-view-shot for professional editing

### **RAG Backend (Optional)**
- **Vector Database**: Pinecone for semantic search and content similarity
- **Embeddings**: OpenAI text-embedding-3-large (3072 dimensions)
- **Caching Layer**: Redis for performance optimization
- **RESTful API**: Express.js server with 8 specialized endpoints
- **Smart Features**: Content deduplication, batch processing, hybrid search

### **Development Environment**
- **Hybrid Development**: Expo Go for rapid iteration + development builds for native features
- **Cross-Platform**: Single codebase for iOS and Android
- **Hot Reloading** for efficient development workflow
- **Environment Variables** via Expo Constants for secure configuration

## 🚀 Getting Started

> **For Academic Evaluation**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed RAG feature demonstration and grading instructions.

### Prerequisites
- Node.js 18+ 
- Expo CLI
- OpenAI API key (for AI features)
- iOS Simulator (macOS) or Android Emulator

### Installation

1. **Clone the repository**
```bash
git clone [your-repository-url]
cd 2nd-degree
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy example environment file
cp .env.example .env

# Add your OpenAI API key to .env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start the development server**
```bash
npx expo start
```

### Optional: RAG Backend Setup

For advanced AI features with vector search and content similarity:

1. **Backend Setup Required**
   - Separate Node.js backend server
   - Redis for caching
   - Pinecone for vector storage
   - See [BACKEND_SETUP_FOR_GRADERS.md](./BACKEND_SETUP_FOR_GRADERS.md) for detailed instructions

2. **Quick Start** (if backend files provided)
   ```bash
   cd ../backend
   npm install
   npm run dev
   ```

3. **Enable in App**
   - Set `useBackend: true` in `config/rag.js`
   - Backend provides enhanced AI features and content indexing

### Development Options

**Option 1: Expo Go (Recommended for most development)**
- Scan QR code with Expo Go app
- Features: All social features, AI integration, mock messaging
- Limitations: Uses ImagePicker instead of native camera

**Option 2: Development Build (For full native features)**
```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

## 📁 Project Structure

```
2nd Degree/
├── 📱 screens/              # All application screens
│   ├── AuthStack/           # Login, Signup, Password Reset
│   ├── MainStack/           # Core app screens
│   ├── CameraScreen.js      # Hybrid camera implementation
│   ├── ChatRoomScreen.js    # Direct messaging interface
│   ├── MediaPreviewScreen.js # Content creation & editing
│   └── StoryViewerScreen.js # Story viewing experience
├── 🧩 components/           # Reusable UI components
│   ├── VideoPlayer.js       # Professional video playback
│   ├── TextOverlayTools.js  # AI-powered text overlay system
│   ├── ConversationStarterChips.js # AI conversation suggestions
│   ├── EmojiReactionBar.js  # Social engagement features
│   └── FilterOverlay.js     # Interactive filter system
├── 🔌 api/                  # Business logic & data management
│   ├── embeddings.js        # AI/OpenAI integration layer
│   ├── messages.js          # Real-time messaging system
│   ├── users.js             # User management & social graph
│   ├── posts.js             # Content creation & ephemeral logic
│   └── moderation.js        # Safety & content filtering
├── ⚙️ config/               # Configuration & setup
│   ├── rag.js              # AI/OpenAI configuration
│   ├── firebase-mock.js     # Development backend system
│   ├── theme.js            # Glassmorphism design system
│   └── index.js            # Unified configuration exports
├── 🧭 navigation/           # App navigation structure
└── 📝 Documentation/        # Implementation guides & memory bank
```

## 🎯 User Experience Highlights

### **Seamless Social Interaction**
- Discover friends through AI-powered suggestions
- Start conversations with intelligent conversation starters
- Share ephemeral content that disappears automatically
- Engage with emoji reactions and safe moderation tools

### **Creative Content Tools**
- Capture photos/videos with professional camera interface
- Add AI-suggested text overlays with drag-and-drop positioning
- Apply contextual filter recommendations based on image content
- Generate engaging captions using advanced AI analysis

### **Privacy-First Design**
- Control who sees your content with granular privacy settings
- Content automatically expires based on your preferences
- Delete-on-view messaging for sensitive conversations
- Comprehensive blocking and reporting for user safety

## 🔧 Configuration

### **Environment Variables**
```bash
# .env file configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Firebase configuration (for production migration)
API_KEY=your_firebase_api_key
AUTH_DOMAIN=your_project.firebaseapp.com
PROJECT_ID=your_project_id
STORAGE_BUCKET=your_project.appspot.com
MESSAGING_SENDER_ID=your_sender_id
APP_ID=your_app_id
```

### **AI Features Setup**
The app uses OpenAI's Vision API for intelligent features. To enable:
1. Get an API key from [OpenAI Platform](https://platform.openai.com)
2. Add to your `.env` file
3. AI features will automatically activate with fallbacks for rate limits

## 🚀 Deployment

### **Production Readiness Checklist**
- ✅ **Code Quality**: Clean, documented, production-ready codebase
- ✅ **Error Handling**: Comprehensive error boundaries and fallbacks
- ✅ **Performance**: Optimized for mobile with efficient state management
- ✅ **Security**: Privacy controls, content moderation, safe AI integration
- ✅ **UI/UX**: Professional design system with consistent user experience

### **Migration to Production Firebase**
The app uses a sophisticated mock Firebase system for development. To migrate to production:

1. **Update configuration** in `config/index.js`:
```javascript
// Switch from mock to real Firebase
import { auth, db, storage } from "./firebase";
// import { auth, db, storage } from "./firebase-mock";
```

2. **Deploy Firestore security rules** (documented in memory bank)
3. **Set up Cloud Functions** for message cleanup and moderation
4. **Configure Firebase Storage** for media handling

### **App Store Deployment**
- App name: **2nd Degree**
- Bundle ID: `com.2nddegree.app`
- Professional branding and screenshots ready
- Privacy policy and terms of service required

## 🤝 Contributing

This is a production-ready social media platform. Key areas for contribution:
- Advanced AI features (face detection, AR filters)
- Backend infrastructure (Cloud Functions, advanced analytics)
- Platform expansion (Web, Desktop)
- Performance optimizations and accessibility improvements

## 📄 License

Private commercial project. All rights reserved.

## 🎉 Acknowledgments

Built with modern React Native architecture, enhanced by OpenAI's Vision API, and designed with production-grade user experience principles. Special recognition for the comprehensive development journey documented in the project memory bank.

---

**2nd Degree** - *Where authentic connections meet intelligent creativity* ✨
