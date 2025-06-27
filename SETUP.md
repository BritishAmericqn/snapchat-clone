# Snapchat Clone - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Firebase project with Auth, Firestore, and Storage enabled

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```bash
API_KEY=your_firebase_api_key
AUTH_DOMAIN=your_firebase_auth_domain
PROJECT_ID=your_firebase_project_id
STORAGE_BUCKET=your_firebase_storage_bucket
MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
APP_ID=your_firebase_app_id
```

2. Get these values from your Firebase project settings:
   - Go to Firebase Console > Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the configuration values

## Installation

```bash
# Install dependencies
npm install

# Start the Expo development server
npm start
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Project Structure

- `/api` - API interface logic for Firebase operations
- `/assets` - Images, fonts, and other static assets
- `/components` - Reusable UI components
- `/config` - Configuration files (Firebase, theme, etc.)
- `/firebase` - Firebase utilities and helpers
- `/functions` - Firebase Cloud Functions (deployed separately)
- `/hooks` - Custom React hooks
- `/navigation` - React Navigation setup
- `/providers` - Context providers
- `/screens` - App screens
- `/utils` - Utility functions

## Firebase Security Rules

Make sure to set up proper security rules in Firebase Console for:
- Firestore Database
- Storage

## Development Workflow

1. Create feature branches from `main`
2. Run linting before committing: `npm run lint`
3. Format code: `npm run format`
4. Test on both iOS and Android before pushing 

# 2nd Degree Setup Instructions

## Logo Asset Placement

### Required Logo Files:

1. **App Icon** (`assets/icon.png`)
   - Replace the existing `assets/icon.png` with your 2° logo
   - **Size**: 1024x1024 pixels
   - **Format**: PNG with transparency
   - **Usage**: App Store, home screen icon

2. **Splash Screen** (`assets/splash.png`)
   - Replace the existing `assets/splash.png` with your 2° logo
   - **Size**: 1242x2436 pixels (can be smaller logo centered on teal background)
   - **Format**: PNG
   - **Background**: Will show on #61c2e3 teal background
   - **Usage**: Loading screen when app starts

3. **Optional In-App Logo** (`assets/logo.png`)
   - Add your 2° logo for potential in-app usage
   - **Size**: 200x50 pixels (horizontal) or 100x100 pixels (square)
   - **Format**: PNG with transparency
   - **Usage**: Navigation headers, profile screens (if needed)

### Steps to Update:
1. Save your 2° logo as `icon.png` (1024x1024) in the `assets/` folder
2. Save a splash screen version as `splash.png` (1242x2436) in the `assets/` folder
3. The splash screen will automatically use the new teal background color (#61c2e3)

### Color Scheme Applied:
- **Primary Color**: #61c2e3 (Zima Blue)
- **App Name**: 2nd Degree
- **Bundle ID**: com.2nddegree.app

## Development Setup

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. For iPhone testing (recommended method):
   - Get your local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Open Safari on iPhone: `exp://[YOUR_IP]:8081`
   - Choose "Open in Expo Go"

## Environment Variables

Create a `.env` file in the root directory:
```
API_KEY=your_firebase_api_key
AUTH_DOMAIN=your_firebase_auth_domain
PROJECT_ID=your_firebase_project_id
STORAGE_BUCKET=your_firebase_storage_bucket
MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
APP_ID=your_firebase_app_id
OPENAI_API_KEY=your_openai_api_key
```

## Development vs Production

The app currently uses mock Firebase implementations for development. To switch to real Firebase:

1. Update `config/index.js`:
```javascript
// For Development (Mock):
import { auth, db, storage } from "./firebase-mock";

// For Production (Real Firebase):
// import { auth, db, storage } from "./firebase";
```

2. Set up Firebase security rules
3. Deploy Firebase Functions for advanced features

## Features

- Complete user authentication system
- Friend management and social graph
- Ephemeral posts and stories with delete-on-view
- Direct messaging with media support
- AI-powered caption and text overlay suggestions
- Interactive filters and creative tools
- Professional video playback
- Advanced moderation and privacy controls

## Testing

Login credentials for mock system:
- Email: `testuser@example.com`
- Password: `testpassword123`

## Deployment

Ready for production deployment with:
- Real Firebase integration (single config change)
- App Store submission
- EAS Build for native features 