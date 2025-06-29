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
  // Multi-tier OpenAI Configuration for optimal performance
  models: {
    // FAST: For simple text generation (conversation starters, recommendations)
    fast: {
      model: 'gpt-3.5-turbo', // ✅ Base model - works with all API key types
      temperature: 0.7,
      maxTokens: 150,
      useCase: ['conversation', 'recommendations', 'simple_analysis']
    },
    
    // VISION: For image analysis only (captions, text overlays)  
    vision: {
      model: 'gpt-4o-mini', // ✅ Current vision model (not deprecated)
      temperature: 0.8,
      maxTokens: 400, // ⬆️ INCREASED: Prevent JSON truncation for filter recommendations
      imageDetail: 'low', // 2-3x faster than 'high' detail
      useCase: ['captions', 'text_overlays', 'image_analysis']
    },
    
    // HEAVY: For complex analysis only (user matching algorithms)
    heavy: {
      model: 'gpt-4', // ✅ Base GPT-4 model - more compatible than specific versions
      temperature: 0.9,
      maxTokens: 300,
      imageDetail: 'high',
      useCase: ['complex_matching', 'detailed_analysis']
    }
  },
  
  // Legacy single model config - UPDATED to use compatible model
  openai: {
    model: 'gpt-3.5-turbo', // ✅ Changed from gpt-4o-2024-08-06 to base model
    temperature: 0.9,
    maxTokens: 300,
    imageDetail: 'high',
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
    },
    conversationGeneration: {
      maxRequestsPerMinute: 5,  // Lower limit for conversation starters
      maxRequestsPerHour: 50,   // Reasonable limit to prevent spam
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

// Clear cached client function - useful after config changes
export const clearOpenAIClientCache = () => {
  console.log('🔄 [RAG DEBUG] Clearing cached OpenAI client...');
  openaiClient = null;
  console.log('✅ [RAG DEBUG] Client cache cleared - next call will create fresh instance');
};

// Force clear all caches on module load to ensure fresh start
console.log('🚀 [RAG STARTUP] Clearing all caches on module initialization...');
openaiClient = null;
console.log('✅ [RAG STARTUP] All caches cleared - fresh configuration loaded');

export const getOpenAIClient = () => {
  // 🚨 EVEN MORE COMPREHENSIVE DEBUGGING
  console.log('\n🔍 [RAG DEBUG] ======== getOpenAIClient() DETAILED DEBUG ========');
  console.log('🔍 [RAG DEBUG] Function called at:', new Date().toISOString());
  console.log('🔍 [RAG DEBUG] openaiClient exists:', !!openaiClient);
  console.log('🔍 [RAG DEBUG] isExpoGo:', isExpoGo);
  console.log('🔍 [RAG DEBUG] Constants.appOwnership:', Constants.appOwnership);
  
  // Test all possible sources of API key
  console.log('\n🔍 [RAG DEBUG] TESTING ALL API KEY SOURCES:');
  const fromExpoConfig = Constants.expoConfig?.extra?.openaiApiKey;
  const fromProcessEnv = process.env.OPENAI_API_KEY;
  const fromExpoConstants = Constants.manifest?.extra?.openaiApiKey;
  const fromManifest2 = Constants.manifest2?.extra?.openaiApiKey;
  
  console.log('🔍 [RAG DEBUG] Constants.expoConfig?.extra?.openaiApiKey:', fromExpoConfig ? 'EXISTS' : 'MISSING');
  console.log('🔍 [RAG DEBUG] process.env.OPENAI_API_KEY:', fromProcessEnv ? 'EXISTS' : 'MISSING');
  console.log('🔍 [RAG DEBUG] Constants.manifest?.extra?.openaiApiKey:', fromExpoConstants ? 'EXISTS' : 'MISSING');
  console.log('🔍 [RAG DEBUG] Constants.manifest2?.extra?.openaiApiKey:', fromManifest2 ? 'EXISTS' : 'MISSING');
  
  const apiKey = getOpenAIApiKey();
  console.log('\n🔍 [RAG DEBUG] Final API key result:', !!apiKey);
  console.log('🔍 [RAG DEBUG] API key length:', apiKey ? apiKey.length : 0);
  console.log('🔍 [RAG DEBUG] API key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
  console.log('🔍 [RAG DEBUG] Mock condition (isExpoGo && !apiKey):', isExpoGo && !apiKey);
  
  if (!openaiClient) {
    if (isExpoGo && !apiKey) {
      // Mock client for Expo Go development
      console.log('🚨 [RAG DEBUG] ============ USING MOCK CLIENT ============');
      console.log('🚨 [RAG DEBUG] Reason: API key not found in Expo Go');
      console.log('🚨 [RAG DEBUG] This means environment variables are not loading properly!');
      console.log('🚨 [RAG DEBUG] Expected: Real OpenAI API calls');
      console.log('🚨 [RAG DEBUG] Actual: Mock responses only');
      console.log('🚨 [RAG DEBUG] ==========================================');
      return createMockOpenAIClient();
    }
    
    console.log('✅ [RAG DEBUG] ============ REAL OPENAI CLIENT ============');
    console.log('✅ [RAG DEBUG] API key found, attempting real OpenAI client...');
    console.log('✅ [RAG DEBUG] Key preview:', apiKey ? apiKey.substring(0, 20) + '...' : 'NONE');
    
    try {
      openaiClient = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for React Native
      });
      console.log('🎉 [RAG DEBUG] OpenAI client initialized successfully with REAL API!');
      console.log('🚀 [RAG DEBUG] You should now get real image analysis!');
      console.log('🚀 [RAG DEBUG] This means user recommendations will use real AI!');
    } catch (error) {
      console.error('💥 [RAG DEBUG] Failed to initialize OpenAI client:', error);
      console.error('💥 [RAG DEBUG] Error name:', error.name);
      console.error('💥 [RAG DEBUG] Error message:', error.message);
      console.error('💥 [RAG DEBUG] Falling back to mock client due to error');
      return createMockOpenAIClient();
    }
  } else {
    console.log('♻️ [RAG DEBUG] Returning existing OpenAI client (cached)');
    console.log('♻️ [RAG DEBUG] Client type:', openaiClient.constructor.name);
  }
  
  console.log('🔍 [RAG DEBUG] ======== END getOpenAIClient() DEBUG ========\n');
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
          
          // Track mock performance based on model
          const modelUsed = params.model;
          if (modelUsed.includes('gpt-3.5')) {
            performanceStats.fastModelCalls++;
          } else if (modelUsed.includes('4o-mini')) {
            performanceStats.visionModelCalls++;
          } else {
            performanceStats.heavyModelCalls++;
          }
          
          // Simulate different response times based on model complexity
          let simulatedDelay = 1500; // Default
          if (modelUsed.includes('gpt-3.5')) {
            simulatedDelay = 800; // Fast model - much quicker
          } else if (modelUsed.includes('4o-mini')) {
            simulatedDelay = 1200; // Vision model - moderate
          } else {
            simulatedDelay = 2500; // Heavy model - slower
          }
          
          console.log(`[RAG Mock] Simulating ${simulatedDelay}ms delay for ${modelUsed}`);
          
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
          
          // Simulate API delay based on model
          await new Promise(resolve => setTimeout(resolve, simulatedDelay));
          
          // Check if this is a user analysis request
          if (prompt.includes('Analyze this user profile for personalized friend recommendations') ||
              prompt.includes('user profile for personalized friend recommendations')) {
            console.log('[RAG Mock] 👥 USER ANALYSIS REQUEST DETECTED');
            
            // Mock user analysis response
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    interests: ["gaming", "technology", "entertainment", "social media"],
                    personality: ["friendly", "outgoing", "tech-savvy", "creative"],
                    lifestyle: ["urban", "digital native", "social", "active"],
                    analysis: "This user appears to be a tech-savvy gaming enthusiast with strong social connections and an active lifestyle. They would connect well with others who share gaming interests or creative hobbies."
                  })
                }
              }],
              usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
            };
          }
          
          // Check if this is a filter recommendation request
          if (prompt.includes('Analyze this image and recommend the TOP 3-4 emoji filters') ||
              prompt.includes('Available filters:') ||
              prompt.includes('filterId: exact ID from available filters')) {
            console.log('[RAG Mock] 🎭 FILTER RECOMMENDATIONS REQUEST DETECTED');
            
            // Extract available filters from the prompt
            const filterListMatch = prompt.match(/Available filters:\n(.*?)\n\nConsider:/s);
            const availableFilters = filterListMatch ? filterListMatch[1].split('\n').map(line => {
              const filterId = line.split(':')[0];
              return filterId;
            }).filter(id => id && id.trim()) : ['sunglasses', 'sparkle', 'fire', 'star'];
            
            console.log('[RAG Mock] Available filters for recommendations:', availableFilters);
            
            // Mock filter recommendations based on common use cases
            const mockFilterRecommendations = [
              { filterId: 'sunglasses', score: 85, reasoning: 'Cool look that works great for most photos and adds instant style' },
              { filterId: 'sparkle', score: 78, reasoning: 'Adds magical sparkle to enhance the mood and energy of the moment' },
              { filterId: 'fire', score: 72, reasoning: 'Shows this moment is amazing and worth highlighting to friends' },
              { filterId: 'star', score: 68, reasoning: 'Highlights that this is a special moment worth celebrating' }
            ].filter(rec => availableFilters.includes(rec.filterId)).slice(0, 3);
            
            console.log('[RAG Mock] Generated', mockFilterRecommendations.length, 'filter recommendations');
            
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    recommendations: mockFilterRecommendations,
                    analysis: {
                      lighting: "natural daylight",
                      mood: "positive and energetic",
                      scene: "casual photo",
                      faces_detected: true
                    }
                  })
                }
              }],
              usage: { prompt_tokens: 120, completion_tokens: 80, total_tokens: 200 }
            };
          }
          
          // Check if this is a user recommendation request  
          if (prompt.includes('You are an expert at matching people based on shared interests') ||
              prompt.includes('recommend the TOP') ||
              prompt.includes('Candidate Users to Match')) {
            console.log('[RAG Mock] 🤖 USER RECOMMENDATIONS REQUEST DETECTED');
            
            // Extract user bio from prompt to make contextual recommendations
            const bioMatch = prompt.match(/Bio: "(.*?)"/);
            const userBio = bioMatch ? bioMatch[1].toLowerCase() : '';
            
            console.log('[RAG Mock] User bio detected:', userBio);
            
            // Mock recommendation logic based on bio content
            let mockRecommendations = [];
            
            if (userBio.includes('game') || userBio.includes('video')) {
              // Gaming user - recommend the gaming user
              mockRecommendations = [{
                userId: 'user_gaming',
                matchScore: 92,
                reason: 'Shared passion for videogames and retro gaming - perfect match for gaming conversations and sharing favorite titles',
                conversationStarter: 'Hey! I saw you\'re into videogames too! What\'s your favorite retro game? 🎮'
              }];
            } else if (userBio.includes('music')) {
              mockRecommendations = [{
                userId: 'user_chris',
                matchScore: 88,
                reason: 'Both passionate about music - great potential for sharing musical interests and discoveries',
                conversationStarter: 'Hey! I noticed we both love music! What genre gets you most excited? 🎵'
              }];
            } else if (userBio.includes('cook')) {
              mockRecommendations = [{
                userId: 'user_lisa',
                matchScore: 85,
                reason: 'Shared love for cooking and culinary adventures - perfect for sharing recipes and food experiences',
                conversationStarter: 'Hey! Fellow cooking enthusiast here! What\'s your signature dish? 🍳'
              }];
            } else {
              // Default fallback recommendations
              mockRecommendations = [
                {
                  userId: 'user_alex',
                  matchScore: 75,
                  reason: 'Similar social energy and lifestyle preferences',
                  conversationStarter: 'Hey! I think we might have some things in common 👋'
                },
                {
                  userId: 'user_lisa',
                  matchScore: 72,
                  reason: 'Complementary interests and great conversation potential',
                  conversationStarter: 'Hi! Your profile caught my attention - would love to connect! 😊'
                }
              ];
            }
            
            console.log('[RAG Mock] Generated', mockRecommendations.length, 'mock recommendations');
            
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    recommendations: mockRecommendations
                  })
                }
              }],
              usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
            };
          }
          
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

// Helper function to get optimal model config for specific use cases
export const getModelConfig = (useCase) => {
  const { models } = RAG_CONFIG;
  
  console.log(`🔍 [RAG CONFIG DEBUG] getModelConfig called with useCase: ${useCase}`);
  console.log(`🔍 [RAG CONFIG DEBUG] Available models:`, Object.keys(models));
  console.log(`🔍 [RAG CONFIG DEBUG] Vision model config:`, models.vision);
  console.log(`🔍 [RAG CONFIG DEBUG] Vision model useCase includes '${useCase}':`, models.vision.useCase.includes(useCase));
  
  // Determine which tier to use based on use case
  if (models.fast.useCase.includes(useCase)) {
    console.log(`✅ [RAG CONFIG DEBUG] Using FAST model for ${useCase}:`, models.fast.model);
    return models.fast;
  } else if (models.vision.useCase.includes(useCase)) {
    console.log(`✅ [RAG CONFIG DEBUG] Using VISION model for ${useCase}:`, models.vision.model);
    return models.vision;
  } else if (models.heavy.useCase.includes(useCase)) {
    console.log(`✅ [RAG CONFIG DEBUG] Using HEAVY model for ${useCase}:`, models.heavy.model);
    return models.heavy;
  }
  
  // Fallback to fast model for unknown use cases
  console.warn(`[RAG] Unknown use case: ${useCase}, using fast model`);
  return models.fast;
};

// Simple in-memory cache for AI responses (prevents repeated identical calls)
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear response cache on startup to ensure fresh responses
console.log('🧹 [RAG STARTUP] Clearing response cache...');
responseCache.clear();
console.log('✅ [RAG STARTUP] Response cache cleared - no stale cached responses');

export const getCachedResponse = (cacheKey) => {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[RAG Cache] Hit for key: ${cacheKey}`);
    return cached.response;
  }
  return null;
};

export const setCachedResponse = (cacheKey, response) => {
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries (simple cleanup)
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
};

// Performance monitoring
export const performanceStats = {
  fastModelCalls: 0,
  visionModelCalls: 0,
  heavyModelCalls: 0,
  cacheHits: 0,
  averageResponseTime: 0
};

// Get performance statistics
export const getPerformanceStats = () => {
  const totalCalls = performanceStats.fastModelCalls + performanceStats.visionModelCalls + performanceStats.heavyModelCalls;
  const cacheHitRate = totalCalls > 0 ? (performanceStats.cacheHits / (totalCalls + performanceStats.cacheHits) * 100).toFixed(1) : 0;
  
  return {
    ...performanceStats,
    totalAPICalls: totalCalls,
    cacheHitRate: `${cacheHitRate}%`,
    modelDistribution: {
      fast: performanceStats.fastModelCalls,
      vision: performanceStats.visionModelCalls, 
      heavy: performanceStats.heavyModelCalls
    },
    estimatedCostSavings: calculateCostSavings()
  };
};

// Calculate estimated cost savings from using tiered models
const calculateCostSavings = () => {
  // Rough OpenAI pricing estimates (per 1K tokens)
  const pricing = {
    'gpt-4o': 0.03,           // Heavy model
    'gpt-4o-mini': 0.015,     // Vision model
    'gpt-3.5-turbo': 0.001    // Fast model
  };
  
  // If we used GPT-4 for everything vs our tiered approach
  const wouldHaveCost = (performanceStats.fastModelCalls + performanceStats.visionModelCalls + performanceStats.heavyModelCalls) * pricing['gpt-4o'];
  const actualCost = (performanceStats.fastModelCalls * pricing['gpt-3.5-turbo']) + 
                     (performanceStats.visionModelCalls * pricing['gpt-4o-mini']) +
                     (performanceStats.heavyModelCalls * pricing['gpt-4o']);
  
  const savings = wouldHaveCost - actualCost;
  const savingsPercent = wouldHaveCost > 0 ? ((savings / wouldHaveCost) * 100).toFixed(1) : 0;
  
  return {
    estimatedSavings: `$${savings.toFixed(4)}`,
    savingsPercent: `${savingsPercent}%`
  };
};

// ===========================
// BACKEND INTEGRATION CONFIG
// ===========================

export const BACKEND_CONFIG = {
  // Enable backend RAG integration when available
  useBackend: true, // ✅ CHANGED TO TRUE - Backend is now running!
  
  // Backend URL configuration
  backendUrl: __DEV__ 
    ? 'http://localhost:3000' // ✅ This matches your running backend
    : 'https://your-production-backend.com',
  
  // Fallback behavior
  fallbackToClient: true, // Use client-side RAG if backend fails
  
  // Request configuration
  requestTimeout: 10000, // 10 seconds
  retryAttempts: 2,
  
  // Feature flags
  features: {
    vectorSearch: true,
    contentIndexing: true,
    batchProcessing: true,
    hybridSearch: true,
  }
};

// Helper to check if backend is available
export const isBackendAvailable = async () => {
  if (!BACKEND_CONFIG.useBackend) return false;
  
  try {
    const response = await fetch(`${BACKEND_CONFIG.backendUrl}/health`, {
      method: 'GET',
      timeout: 2000,
    });
    return response.ok;
  } catch (error) {
    console.log('[RAG] Backend not available:', error.message);
    return false;
  }
};

// Export the complete configuration
export default {
  ...RAG_CONFIG,
  backend: BACKEND_CONFIG,
}; 