import "dotenv/config";

export default {
  expo: {
    name: "2nd Degree",
    slug: "2nd-degree",
    platforms: ["ios", "android"],
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#61c2e3",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "2nd Degree accesses your photos to let you share them with friends.",
          cameraPermission: "2nd Degree accesses your camera to let you take photos and videos to share with friends."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow 2nd Degree to access your camera to take photos and videos.",
          microphonePermission: "Allow 2nd Degree to access your microphone to record videos with sound.",
          recordAudioAndroid: true
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.2nddegree.app",
      infoPlist: {
        NSCameraUsageDescription: "2nd Degree uses the camera to take photos and videos to share with friends.",
        NSMicrophoneUsageDescription: "2nd Degree uses the microphone to record videos with sound.",
        NSPhotoLibraryUsageDescription: "2nd Degree uses the photo library to let you share photos with friends."
      }
    },
    android: {
      package: "com.2nddegree.app",
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
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
  },
};
