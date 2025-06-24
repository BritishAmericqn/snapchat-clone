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