import OpenAI from 'openai';

// Environment detection for safe mock usage
import Constants from 'expo-constants';
const isExpoGo = Constants.appOwnership === 'expo';

// RAG Configuration
export const RAG_CONFIG = {
  // OpenAI Configuration
  openai: {
    model: 'gpt-4o-2024-08-06', // Latest stable model optimized for vision
    temperature: 0.7, // Balanced creativity for captions
    maxTokens: 150, // Enough for 3-5 caption suggestions
    imageDetail: 'low', // Cost optimization - 512px resolution
  },
  
  // Caption Generation Settings
  captions: {
    suggestionsCount: 4, // Generate 4 caption options
    maxLength: 100, // Character limit for captions
    styles: ['casual', 'creative', 'descriptive', 'minimal'],
  },
  
  // Rate Limiting
  rateLimits: {
    captionGeneration: {
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100,
    }
  },
  
  // Analytics Tracking
  analytics: {
    trackFeatureUsage: true,
    trackSuccessRates: true,
    trackUserPreferences: true,
  }
};

// OpenAI Client Initialization
let openaiClient = null;

export const getOpenAIClient = () => {
  if (!openaiClient) {
    if (isExpoGo && !process.env.OPENAI_API_KEY) {
      // Mock client for Expo Go development
      console.log('[RAG] Using mock OpenAI client for Expo Go development');
      return createMockOpenAIClient();
    }
    
    try {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // Required for React Native
      });
      console.log('[RAG] OpenAI client initialized successfully');
    } catch (error) {
      console.error('[RAG] Failed to initialize OpenAI client:', error);
      return createMockOpenAIClient();
    }
  }
  
  return openaiClient;
};

// Mock OpenAI Client for Expo Go Development
const createMockOpenAIClient = () => ({
  chat: {
    completions: {
      create: async (params) => {
        console.log('[RAG Mock] OpenAI Vision API call:', params);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock caption suggestions based on image analysis prompt
        const mockCaptions = [
          "Perfect moment captured! ✨",
          "Living my best life 📸",
          "Another day, another adventure 🌟",
          "Grateful for moments like these 💫"
        ];
        
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                captions: mockCaptions,
                analysis: "Mock image analysis: Detected general photo content"
              })
            }
          }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150
          }
        };
      }
    }
  }
});

// Export configured clients
export { openaiClient }; 