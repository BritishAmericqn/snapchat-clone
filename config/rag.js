import OpenAI from 'openai';

// Environment detection for safe mock usage
import Constants from 'expo-constants';
const isExpoGo = Constants.appOwnership === 'expo';

// Get OpenAI API key from Expo config (more reliable than process.env)
const getOpenAIApiKey = () => {
  // Try multiple sources for the API key
  const fromExpoConfig = Constants.expoConfig?.extra?.openaiApiKey;
  const fromProcessEnv = process.env.OPENAI_API_KEY;
  
  console.log('🔍 [RAG DEBUG] API Key Sources:');
  console.log('  - From Expo Config:', fromExpoConfig ? 'EXISTS' : 'MISSING');
  console.log('  - From process.env:', fromProcessEnv ? 'EXISTS' : 'MISSING');
  
  // Prefer Expo config, fallback to process.env
  const apiKey = fromExpoConfig || fromProcessEnv;
  
  if (apiKey) {
    console.log('✅ [RAG DEBUG] API Key found via:', fromExpoConfig ? 'Expo Config' : 'process.env');
    console.log('✅ [RAG DEBUG] Key length:', apiKey.length, 'characters');
    console.log('✅ [RAG DEBUG] Starts with sk-:', apiKey.startsWith('sk-'));
  } else {
    console.log('❌ [RAG DEBUG] No API key found in any source!');
  }
  
  return apiKey;
};

// RAG Configuration
export const RAG_CONFIG = {
  // OpenAI Configuration
  openai: {
    model: 'gpt-4o-2024-08-06', // Latest stable model optimized for vision
    temperature: 0.9, // Higher creativity for more engaging captions
    maxTokens: 300, // More tokens for detailed, creative responses
    imageDetail: 'high', // Higher resolution for better image analysis
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
    },
    textOverlayGeneration: {
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
  // 🚨 COMPREHENSIVE DEBUGGING - Let's see exactly what's happening
  console.log('\n🔍 [RAG DEBUG] getOpenAIClient() called');
  console.log('🔍 [RAG DEBUG] openaiClient exists:', !!openaiClient);
  console.log('🔍 [RAG DEBUG] isExpoGo:', isExpoGo);
  
  const apiKey = getOpenAIApiKey();
  console.log('🔍 [RAG DEBUG] API key retrieved:', !!apiKey);
  console.log('🔍 [RAG DEBUG] Mock condition (isExpoGo && !apiKey):', isExpoGo && !apiKey);
  
  if (!openaiClient) {
    if (isExpoGo && !apiKey) {
      // Mock client for Expo Go development
      console.log('🚨 [RAG DEBUG] USING MOCK CLIENT - API key not found in Expo Go');
      console.log('🚨 [RAG DEBUG] This means environment variables are not loading properly!');
      return createMockOpenAIClient();
    }
    
    console.log('✅ [RAG DEBUG] API key found, attempting real OpenAI client...');
    
    try {
      openaiClient = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for React Native
      });
      console.log('🎉 [RAG DEBUG] OpenAI client initialized successfully with REAL API!');
      console.log('🚀 [RAG DEBUG] You should now get real image analysis!');
    } catch (error) {
      console.error('💥 [RAG DEBUG] Failed to initialize OpenAI client:', error);
      console.error('💥 [RAG DEBUG] Falling back to mock client due to error');
      return createMockOpenAIClient();
    }
  } else {
    console.log('♻️ [RAG DEBUG] Returning existing OpenAI client');
  }
  
  return openaiClient;
};

// Mock OpenAI Client for Expo Go Development
const createMockOpenAIClient = () => {
  console.log('🔧 [RAG DEBUG] Creating mock OpenAI client - this means real API is NOT being used!');
  return {
    chat: {
      completions: {
        create: async (params) => {
          console.log('[RAG Mock] OpenAI Vision API call:', params);
          
          // Extract style from prompt
          const prompt = params.messages[0].content.find(c => c.type === 'text')?.text || '';
          let style = 'casual';
          let isTextOverlay = false;
          
          // Detect if this is text overlay request vs caption request
          if (prompt.includes('text overlay') || prompt.includes('TEXT STYLE GUIDELINES')) {
            isTextOverlay = true;
            // Extract text overlay style
            if (prompt.includes('MOTIVATIONAL')) style = 'motivational';
            else if (prompt.includes('AESTHETIC')) style = 'aesthetic';
            else if (prompt.includes('DESCRIPTIVE')) style = 'descriptive';
            else if (prompt.includes('MINIMAL')) style = 'minimal';
            else style = 'mixed';
          } else {
            // Caption request style detection
            if (prompt.includes('creative')) style = 'creative';
            else if (prompt.includes('descriptive')) style = 'descriptive'; 
            else if (prompt.includes('minimal')) style = 'minimal';
          }
          
          console.log('[RAG Mock] Detected request type:', isTextOverlay ? 'textOverlay' : 'caption', 'style:', style);
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (isTextOverlay) {
            // TEXT OVERLAY SUGGESTIONS
            const textOverlaySuggestions = {
              motivational: [
                { text: "chase your dreams", style: "motivational", position: { x: 50, y: 35, reasoning: "Center-top for motivational impact" } },
                { text: "good vibes only", style: "motivational", position: { x: 30, y: 60, reasoning: "Left-center for balance" } },
                { text: "be unstoppable", style: "motivational", position: { x: 70, y: 45, reasoning: "Right-center for emphasis" } }
              ],
              aesthetic: [
                { text: "golden hour magic", style: "aesthetic", position: { x: 40, y: 25, reasoning: "Upper-left for aesthetic flow" } },
                { text: "dreamy vibes", style: "aesthetic", position: { x: 60, y: 70, reasoning: "Lower-right for balance" } },
                { text: "soft moments", style: "aesthetic", position: { x: 50, y: 50, reasoning: "Perfect center for impact" } }
              ],
              descriptive: [
                { text: "sunday morning", style: "descriptive", position: { x: 35, y: 40, reasoning: "Off-center for natural feel" } },
                { text: "quiet moments", style: "descriptive", position: { x: 65, y: 30, reasoning: "Upper-right for storytelling" } },
                { text: "city lights", style: "descriptive", position: { x: 50, y: 65, reasoning: "Lower-center for scene setting" } }
              ],
              minimal: [
                { text: "breathe", style: "minimal", position: { x: 50, y: 50, reasoning: "Perfect center for minimal impact" } },
                { text: "bliss", style: "minimal", position: { x: 30, y: 35, reasoning: "Left-upper for subtlety" } },
                { text: "zen", style: "minimal", position: { x: 70, y: 60, reasoning: "Right-lower for elegance" } }
              ],
              mixed: [
                { text: "chase your dreams", style: "motivational", position: { x: 50, y: 30, reasoning: "Center-top for motivation" } },
                { text: "golden hour magic", style: "aesthetic", position: { x: 30, y: 70, reasoning: "Lower-left for aesthetic" } },
                { text: "breathe", style: "minimal", position: { x: 70, y: 50, reasoning: "Right-center minimal" } }
              ]
            };
            
            const suggestions = textOverlaySuggestions[style] || textOverlaySuggestions.mixed;
            
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    suggestions: suggestions,
                    analysis: `Mock text overlay analysis: Detected good contrast zones for text placement`,
                    composition: {
                      mood: "positive",
                      lighting: "good",
                      emptyZones: ["center", "upper-left", "lower-right"]
                    }
                  })
                }
              }],
              usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
            };
          } else {
            // CAPTION GENERATION - existing logic
            const styleBasedCaptions = {
              casual: [
                "POV: you're that friend who takes the best photos 📸",
                "not me crying over how aesthetic this is 🥺✨",
                "this is my main character moment and I'm here for it",
                "when the lighting hits just right >>> 💫",
                "manifesting this energy for the rest of the week 🌟", 
                "the way this just healed something in me ✨",
                "no thoughts, just vibes and good lighting 📱",
                "caught in 4k being absolutely iconic 💅"
              ],
              creative: [
                "where golden hour meets the poetry of existence ✨",
                "caught between reality and the dreams I chase",
                "this moment tastes like nostalgia and feels like hope 🌅",
                "painting with light, writing with shadows 🎨",
                "when the universe conspires to create beauty",
                "fragments of eternity captured in pixels ⚡",
                "the art of being present in a world of noise",
                "dancing on the edge of memory and magic 💫"
              ],
              descriptive: [
                "soft afternoon light spilling through windows, creating shadows that dance",
                "the kind of golden hour that makes everything feel cinematic",
                "captured in that perfect moment when everything aligns just right",
                "warm light painting everything in honey and amber tones",
                "that magical time when ordinary moments become extraordinary",
                "the gentle interplay of light and shadow telling its own story",
                "nature's own spotlight creating a masterpiece in real time",
                "the quiet beauty found in everyday moments like this"
              ],
              minimal: [
                "golden ✨",
                "serene 🌅", 
                "ethereal",
                "bliss 💫",
                "luminous",
                "dreamy ☁️",
                "pure magic",
                "transcendent ⚡"
              ]
            };
            
            // Trend-aware, engaging tags
            const styleBasedTags = {
              casual: ["#maincharacterenergy", "#aesthetic", "#goodvibes", "#moodbooster", "#sundayvibes", "#livingmybestlife", "#nofilterneeded", "#thatgirl", "#softlaunch"],
              creative: ["#cottagecore", "#darkacademia", "#ethereal", "#dreamyaesthetic", "#artisticvibes", "#poetryinmotion", "#cinematic", "#visualpoetry", "#artjournal"],
              descriptive: ["#goldenhour", "#naturephotography", "#capturedmoment", "#storytelling", "#visualnarrative", "#photographylife", "#scenicview", "#wanderlust", "#momentsintime"],
              minimal: ["#minimalism", "#zen", "#serene", "#pure", "#breathe", "#stillness", "#simplicity", "#mindful", "#lessismore"]
            };
            
            // Randomize selections
            const availableCaptions = styleBasedCaptions[style] || styleBasedCaptions.casual;
            const availableTags = styleBasedTags[style] || styleBasedTags.casual;
            
            // Pick 4 random captions and 4-5 random tags
            const shuffledCaptions = [...availableCaptions].sort(() => 0.5 - Math.random()).slice(0, 4);
            const shuffledTags = [...availableTags].sort(() => 0.5 - Math.random()).slice(0, 5);
            
            console.log('[RAG Mock] Generated captions for style:', style, shuffledCaptions);
            console.log('[RAG Mock] Generated tags for style:', style, shuffledTags);
            
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    captions: shuffledCaptions,
                    analysis: `Mock image analysis for ${style} style: Detected photo content with ${style} approach`,
                    tags: shuffledTags
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
    }
  };
};

// Export configured clients
export { openaiClient }; 