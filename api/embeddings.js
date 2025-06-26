// Image Analysis and Embedding API using OpenAI Vision
import { getOpenAIClient, RAG_CONFIG } from '../config/rag';

// Rate limiting store (in-memory for MVP)
const rateLimitStore = new Map();

// Analytics store (in-memory for MVP)  
const analyticsStore = {
  captionRequests: 0,
  successfulCaptions: 0,
  userPreferences: new Map(),
};

/**
 * Generate caption suggestions using OpenAI Vision API
 * @param {string} imageUri - URI of the image to analyze
 * @param {string} userId - User ID for analytics and rate limiting
 * @param {Object} options - Additional options for caption generation
 * @returns {Promise<Object>} - Caption suggestions and analysis
 */
export const generateCaptionSuggestions = async (imageUri, userId, options = {}) => {
  try {
    console.log('[Embeddings] Generating caption suggestions for image:', imageUri);
    
    // Rate limiting check
    if (!checkRateLimit(userId, 'captionGeneration')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Track analytics
    analyticsStore.captionRequests++;
    
    const openai = getOpenAIClient();
    const config = RAG_CONFIG.openai;
    
    // Prepare image for analysis
    const imageData = await prepareImageForAnalysis(imageUri);
    
    // Create prompt for caption generation
    const prompt = createCaptionPrompt(options.style || 'casual');
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: config.imageDetail
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "caption_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              captions: {
                type: "array",
                items: {
                  type: "string",
                  description: "A creative caption suggestion for the image"
                },
                minItems: 3,
                maxItems: 5
              },
              analysis: {
                type: "string", 
                description: "Brief analysis of the image content and mood"
              },
              tags: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Relevant hashtags or keywords for the image"
              }
            },
            required: ["captions", "analysis"],
            additionalProperties: false
          }
        }
      }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Log successful parsing for testing
    console.log('[Embeddings] Successfully parsed JSON response:', JSON.stringify(result, null, 2));
    
    // Track successful generation
    analyticsStore.successfulCaptions++;
    
    // Store user analytics
    updateUserAnalytics(userId, 'captionGenerated', {
      style: options.style,
      captionCount: result.captions.length,
      timestamp: new Date().toISOString()
    });
    
    console.log('[Embeddings] Caption suggestions generated successfully:', result.captions.length);
    
    return {
      success: true,
      captions: result.captions,
      analysis: result.analysis,
      tags: result.tags || [],
      metadata: {
        model: config.model,
        userId,
        timestamp: new Date().toISOString(),
        usage: response.usage
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error generating caption suggestions:', error);
    
    // Return fallback captions on error
    return {
      success: false,
      error: error.message,
      captions: getFallbackCaptions(options.style),
      analysis: "Image analysis unavailable",
      tags: [],
      metadata: {
        fallback: true,
        userId,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Analyze image and generate embeddings for content search
 * @param {string} imageUri - URI of the image to analyze
 * @param {Object} metadata - Additional metadata for the image
 * @returns {Promise<Object>} - Image analysis and embedding data
 */
export const analyzeImageForEmbedding = async (imageUri, metadata = {}) => {
  try {
    console.log('[Embeddings] Analyzing image for embedding generation');
    
    const openai = getOpenAIClient();
    
    // Analyze image content for embedding
    const analysisPrompt = `Analyze this image and provide a detailed description focusing on:
    - Main subjects and objects
    - Setting and environment  
    - Mood and atmosphere
    - Activities happening
    - Visual style and composition
    
    Format your response as a detailed paragraph suitable for semantic search.`;
    
    const imageData = await prepareImageForAnalysis(imageUri);
    
    const response = await openai.chat.completions.create({
      model: RAG_CONFIG.openai.model,
      temperature: 0.3, // Lower temperature for consistent analysis
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: RAG_CONFIG.imageDetail
              }
            }
          ]
        }
      ]
    });
    
    const analysis = response.choices[0].message.content;
    
    // Generate text embedding from analysis (future: integrate with embedding model)
    // For now, return analysis for manual embedding generation
    
    return {
      success: true,
      analysis,
      metadata: {
        ...metadata,
        analysisTimestamp: new Date().toISOString(),
        model: RAG_CONFIG.openai.model
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing image for embedding:', error);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
};

/**
 * Store content embedding in Pinecone
 * @param {string} contentId - Unique ID for the content
 * @param {Array} embedding - Vector embedding
 * @param {Object} metadata - Content metadata
 * @returns {Promise<Object>} - Storage result
 */
export const storeContentEmbedding = async (contentId, embedding, metadata) => {
  try {
    console.log('[Embeddings] Storing content embedding - Pinecone disabled for React Native compatibility');
    
    // Pinecone is not compatible with React Native due to Node.js dependencies
    // This function is kept for future server-side implementation
    
    return {
      success: true,
      message: 'Embedding storage disabled in React Native - implement server-side',
      contentId,
      metadata
    };
    
  } catch (error) {
    console.error('[Embeddings] Error storing content embedding:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Search for similar content using embeddings
 * @param {Array} queryEmbedding - Query vector embedding
 * @param {Object} filters - Metadata filters
 * @param {number} topK - Number of results to return
 * @returns {Promise<Object>} - Search results
 */
export const searchSimilarContent = async (queryEmbedding, filters = {}, topK = 5) => {
  try {
    console.log('[Embeddings] Searching for similar content - Pinecone disabled for React Native compatibility');
    
    // Pinecone is not compatible with React Native due to Node.js dependencies
    // This function is kept for future server-side implementation
    
    return {
      success: true,
      message: 'Similarity search disabled in React Native - implement server-side',
      matches: [],
      count: 0
    };
    
  } catch (error) {
    console.error('[Embeddings] Error searching similar content:', error);
    return {
      success: false,
      error: error.message,
      matches: []
    };
  }
};

// HELPER FUNCTIONS

/**
 * Prepare image for OpenAI Vision API analysis
 * @param {string} imageUri - Image URI from camera or gallery
 * @returns {string} - Formatted image data for API
 */
const prepareImageForAnalysis = async (imageUri) => {
  try {
    // If it's already a data URI, return as-is
    if (imageUri.startsWith('data:image/')) {
      return imageUri;
    }
    
    // For file:// URIs from React Native, we need to read and convert to base64
    if (imageUri.startsWith('file://')) {
      // In a real implementation, you'd use expo-file-system to read the file
      // For now, return the URI (will work in mock mode)
      console.log('[Embeddings] File URI detected, would convert to base64 in production');
      return imageUri;
    }
    
    // For HTTP URLs, return as-is
    if (imageUri.startsWith('http')) {
      return imageUri;
    }
    
    // Fallback
    return imageUri;
    
  } catch (error) {
    console.error('[Embeddings] Error preparing image for analysis:', error);
    throw new Error('Failed to prepare image for analysis');
  }
};

/**
 * Create caption generation prompt based on style
 * @param {string} style - Caption style preference
 * @returns {string} - Formatted prompt
 */
const createCaptionPrompt = (style = 'casual') => {
  const stylePrompts = {
    casual: "Generate 4 casual, friendly captions for this image that sound natural and relatable. Include relevant emojis.",
    creative: "Create 4 creative, unique captions for this image with wordplay, metaphors, or interesting perspectives. Be artistic and expressive.",
    descriptive: "Write 4 detailed, descriptive captions that clearly explain what's happening in the image. Focus on observable details.",
    minimal: "Create 4 short, minimal captions (under 30 characters each) that capture the essence of the image. Be concise and impactful."
  };
  
  const basePrompt = stylePrompts[style] || stylePrompts.casual;
  
  return `${basePrompt}

  Also provide:
  - A brief analysis of the image content and mood
  - 3-5 relevant hashtags or keywords

  Respond with valid JSON matching the specified schema.`;
};

/**
 * Check rate limiting for user actions
 * @param {string} userId - User ID
 * @param {string} action - Action type
 * @returns {boolean} - Whether action is allowed
 */
const checkRateLimit = (userId, action) => {
  const now = Date.now();
  const limits = RAG_CONFIG.rateLimits[action];
  
  if (!limits) return true;
  
  const userKey = `${userId}:${action}`;
  const userLimits = rateLimitStore.get(userKey) || { minute: [], hour: [] };
  
  // Clean old timestamps
  userLimits.minute = userLimits.minute.filter(timestamp => now - timestamp < 60000);
  userLimits.hour = userLimits.hour.filter(timestamp => now - timestamp < 3600000);
  
  // Check limits
  if (userLimits.minute.length >= limits.maxRequestsPerMinute) {
    return false;
  }
  
  if (userLimits.hour.length >= limits.maxRequestsPerHour) {
    return false;
  }
  
  // Update counters
  userLimits.minute.push(now);
  userLimits.hour.push(now);
  rateLimitStore.set(userKey, userLimits);
  
  return true;
};

/**
 * Update user analytics
 * @param {string} userId - User ID
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
const updateUserAnalytics = (userId, event, data) => {
  if (!RAG_CONFIG.analytics.trackUserPreferences) return;
  
  const userAnalytics = analyticsStore.userPreferences.get(userId) || [];
  userAnalytics.push({
    event,
    data,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 100 events per user
  if (userAnalytics.length > 100) {
    userAnalytics.splice(0, userAnalytics.length - 100);
  }
  
  analyticsStore.userPreferences.set(userId, userAnalytics);
};

/**
 * Get fallback captions when API fails
 * @param {string} style - Caption style
 * @returns {Array} - Fallback captions
 */
const getFallbackCaptions = (style = 'casual') => {
  const fallbacks = {
    casual: [
      "Captured a moment ✨",
      "Living life to the fullest 📸",
      "Another memory made 💫",
      "Good vibes only 🌟"
    ],
    creative: [
      "When words fall short, images speak 🎨",
      "Painting memories with light ✨",
      "Life through my lens 📷",
      "Moments that matter most 💝"
    ],
    descriptive: [
      "A moment worth sharing",
      "Capturing today's experience",
      "Visual story unfolding",
      "Scene from my day"
    ],
    minimal: [
      "Now ✨",
      "This 📸",
      "Today 🌟",
      "Here 💫"
    ]
  };
  
  return fallbacks[style] || fallbacks.casual;
};

/**
 * Get analytics summary
 * @returns {Object} - Analytics data
 */
export const getAnalyticsSummary = () => {
  return {
    totalCaptionRequests: analyticsStore.captionRequests,
    successfulCaptions: analyticsStore.successfulCaptions,
    successRate: analyticsStore.captionRequests > 0 
      ? (analyticsStore.successfulCaptions / analyticsStore.captionRequests * 100).toFixed(2) + '%'
      : '0%',
    activeUsers: analyticsStore.userPreferences.size,
    timestamp: new Date().toISOString()
  };
}; 