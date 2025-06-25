import "dotenv/config";

export default {
  expo: {
    name: "Snapchat Clone",
    slug: "snapchat-clone",
    platforms: ["ios", "android"],
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "cover",
      backgroundColor: "#FFFC00",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them with friends.",
          cameraPermission: "The app accesses your camera to let you take photos and videos to share with friends."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow Snapchat Clone to access your camera to take photos and videos.",
          microphonePermission: "Allow Snapchat Clone to access your microphone to record videos with sound.",
          recordAudioAndroid: true
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.snapchatclone.app",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to take photos and videos to share with friends.",
        NSMicrophoneUsageDescription: "This app uses the microphone to record videos with sound.",
        NSPhotoLibraryUsageDescription: "This app uses the photo library to let you share photos with friends."
      }
    },
    android: {
      package: "com.snapchatclone.app",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    extra: {
      eas: {
        projectId: "e09a4a91-8386-420d-9275-8fda8a7f7129"
      },
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
    },
  },
};
