// Image Analysis and Embedding API using OpenAI Vision
import { getOpenAIClient, RAG_CONFIG } from '../config/rag';
import * as FileSystem from 'expo-file-system';

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
            required: ["captions", "analysis", "tags"],
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
      tags: getFallbackTags(options.style),
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
    console.log('[Embeddings] 🖼️ Preparing image for analysis:', imageUri);
    
    // If it's already a data URI, return as-is
    if (imageUri.startsWith('data:image/')) {
      console.log('[Embeddings] ✅ Data URI detected, using as-is');
      return imageUri;
    }
    
    // For HTTP URLs, return as-is
    if (imageUri.startsWith('http')) {
      console.log('[Embeddings] ✅ HTTP URL detected, using as-is');
      return imageUri;
    }
    
    // For file:// URIs from React Native, use expo-file-system
    if (imageUri.startsWith('file://')) {
      console.log('[Embeddings] 📱 File URI detected, converting with expo-file-system...');
      
      try {
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist at URI: ' + imageUri);
        }
        
        console.log('[Embeddings] 📄 File exists, size:', fileInfo.size, 'bytes');
        
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64 || base64.length === 0) {
          throw new Error('Failed to read file content');
        }
        
        // Determine image type from URI or default to JPEG
        let mimeType = 'image/jpeg';
        if (imageUri.toLowerCase().includes('.png')) {
          mimeType = 'image/png';
        } else if (imageUri.toLowerCase().includes('.webp')) {
          mimeType = 'image/webp';
        } else if (imageUri.toLowerCase().includes('.gif')) {
          mimeType = 'image/gif';
        }
        
        // Format as data URI
        const dataUri = `data:${mimeType};base64,${base64}`;
        
        console.log('[Embeddings] ✅ Successfully converted to base64');
        console.log('[Embeddings] 📊 Data URI length:', dataUri.length, 'characters');
        console.log('[Embeddings] 🎯 MIME type:', mimeType);
        console.log('[Embeddings] 🚀 Sending REAL user image to OpenAI!');
        
        return dataUri;
        
      } catch (error) {
        console.error('[Embeddings] ❌ Error reading file with expo-file-system:', error);
        console.error('[Embeddings] 💥 This means OpenAI will NOT analyze your actual image!');
        throw error; // Don't use placeholder - let it fail properly
      }
    }
    
    // For content:// URIs (Android)
    if (imageUri.startsWith('content://')) {
      console.log('[Embeddings] 🤖 Android content URI detected, converting...');
      
      try {
        // expo-file-system can handle content:// URIs on Android
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const dataUri = `data:image/jpeg;base64,${base64}`;
        console.log('[Embeddings] ✅ Android content URI converted successfully');
        return dataUri;
        
      } catch (error) {
        console.error('[Embeddings] ❌ Error reading Android content URI:', error);
        throw error;
      }
    }
    
    // Unknown format - throw error instead of using placeholder
    console.error('[Embeddings] ❌ Unknown image URI format:', imageUri);
    throw new Error('Unsupported image URI format: ' + imageUri);
    
  } catch (error) {
    console.error('[Embeddings] 💥 CRITICAL: Image preparation failed!', error);
    console.error('[Embeddings] 🚨 This means AI cannot analyze your image');
    
    // Re-throw the error instead of using placeholder
    // This will trigger the fallback responses with clear error messages
    throw new Error('Failed to prepare image for analysis: ' + error.message);
  }
};

/**
 * Create caption generation prompt based on style
 * @param {string} style - Caption style preference
 * @returns {string} - Formatted prompt
 */
const createCaptionPrompt = (style = 'casual') => {
  const stylePrompts = {
    casual: `Analyze this image and create 4 Gen-Z friendly captions that would get engagement on social media. Think like a 20-something would actually talk:
    - Use current slang and expressions (but avoid cringe)
    - Reference pop culture, moods, or relatable situations
    - Include strategic emoji placement 
    - Make it feel authentic, not corporate
    - Examples: "POV: you're that person who..." or "this is my villain era" or "not me crying over..."`,
    
    creative: `Create 4 artistic, poetic captions that transform this ordinary moment into something magical:
    - Use metaphors, wordplay, or unexpected perspectives
    - Reference literature, art, music, or philosophy
    - Create emotional resonance through imagery
    - Think Instagram poet meets visual storyteller
    - Examples: "where shadows dance with forgotten dreams" or "caught between golden hour and eternity"`,
    
    descriptive: `Write 4 detailed captions that paint a vivid picture of this scene:
    - Include sensory details (what you'd hear, smell, feel)
    - Mention specific visual elements and their emotional impact
    - Set the scene like a travel writer or photographer
    - Make viewers feel like they're experiencing it
    - Examples: "morning light filtering through..." or "the kind of evening where..."`,
    
    minimal: `Create 4 ultra-concise captions (under 25 characters) that capture the FEELING of this moment:
    - Single words or short phrases that hit different
    - Focus on emotion over description
    - Think gallery wall text or poetry book titles  
    - Examples: "exhale ✨" or "golden" or "this feeling" or "main character energy"`
  };
  
  const basePrompt = stylePrompts[style] || stylePrompts.casual;
  
  return `${basePrompt}

  CRITICAL: Analyze the ACTUAL image content first. Consider:
  - Time of day, lighting, colors
  - Facial expressions and body language (if people present)
  - Setting/location and its vibe
  - Objects and their significance
  - Overall mood and energy
  
  Then craft captions that are SPECIFIC to what you see, not generic.

  Also provide:
  - A vivid analysis of the image content, mood, and story
  - 5-6 trend-aware hashtags that would actually perform on social media
  
  Make the hashtags SPECIFIC and engaging:
  - Mix popular tags (#aesthetic) with niche ones (#cottagecore)
  - Include mood tags (#maincharacterenergy) 
  - Add temporal tags (#sundayvibes, #goldenhour)
  - Consider current trends and seasons

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
 * Generate text overlay suggestions using OpenAI Vision API
 * @param {string} imageUri - URI of the image to analyze
 * @param {string} userId - User ID for analytics and rate limiting
 * @param {Object} options - Additional options for text overlay generation
 * @returns {Promise<Object>} - Text overlay suggestions with positioning
 */
export const generateTextOverlaySuggestions = async (imageUri, userId, options = {}) => {
  try {
    console.log('[Embeddings] Generating text overlay suggestions for image:', imageUri);
    
    // Rate limiting check
    if (!checkRateLimit(userId, 'textOverlayGeneration')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Track analytics
    analyticsStore.textOverlayRequests = (analyticsStore.textOverlayRequests || 0) + 1;
    
    const openai = getOpenAIClient();
    const config = RAG_CONFIG.openai;
    
    // Prepare image for analysis
    const imageData = await prepareImageForAnalysis(imageUri);
    
    // Create prompt for text overlay suggestions
    const prompt = createTextOverlayPrompt(options.style || 'mixed');
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: 0.8, // Slightly lower for more focused suggestions
      max_tokens: 400, // More tokens for positioning analysis
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
          name: "text_overlay_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      description: "The suggested text overlay"
                    },
                    style: {
                      type: "string",
                      enum: ["motivational", "aesthetic", "descriptive", "minimal"],
                      description: "The style category of the text"
                    },
                    position: {
                      type: "object",
                      properties: {
                        x: {
                          type: "number",
                          description: "X coordinate as percentage of image width (0-100)"
                        },
                        y: {
                          type: "number",
                          description: "Y coordinate as percentage of image height (0-100)"
                        },
                        reasoning: {
                          type: "string",
                          description: "Why this position was chosen"
                        }
                      },
                      required: ["x", "y", "reasoning"],
                      additionalProperties: false
                    }
                  },
                  required: ["text", "style", "position"],
                  additionalProperties: false
                },
                minItems: 3,
                maxItems: 4
              },
              analysis: {
                type: "string",
                description: "Brief analysis of the image composition and optimal text zones"
              },
              composition: {
                type: "object",
                properties: {
                  mood: {
                    type: "string",
                    description: "Overall mood of the image"
                  },
                  lighting: {
                    type: "string",
                    description: "Lighting conditions (golden hour, bright, dramatic, etc.)"
                  },
                  emptyZones: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Areas of the image suitable for text overlay"
                  }
                },
                required: ["mood", "lighting", "emptyZones"],
                additionalProperties: false
              }
            },
            required: ["suggestions", "analysis", "composition"],
            additionalProperties: false
          }
        }
      }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Log successful parsing for testing
    console.log('[Embeddings] Successfully parsed text overlay response:', JSON.stringify(result, null, 2));
    
    // Track successful generation
    analyticsStore.successfulTextOverlays = (analyticsStore.successfulTextOverlays || 0) + 1;
    
    // Store user analytics
    updateUserAnalytics(userId, 'textOverlayGenerated', {
      style: options.style,
      suggestionCount: result.suggestions.length,
      timestamp: new Date().toISOString()
    });
    
    console.log('[Embeddings] Text overlay suggestions generated successfully:', result.suggestions.length);
    
    return {
      success: true,
      suggestions: result.suggestions,
      analysis: result.analysis,
      composition: result.composition,
      metadata: {
        model: config.model,
        userId,
        timestamp: new Date().toISOString(),
        usage: response.usage
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error generating text overlay suggestions:', error);
    
    // Return fallback suggestions on error
    return {
      success: false,
      error: error.message,
      suggestions: getFallbackTextOverlays(options.style),
      analysis: "Image analysis unavailable - using fallback suggestions",
      composition: {
        mood: "unknown",
        lighting: "unknown", 
        emptyZones: ["center"]
      },
      metadata: {
        fallback: true,
        userId,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Create text overlay prompt based on style preference
 * @param {string} style - Text overlay style preference
 * @returns {string} - Formatted prompt
 */
const createTextOverlayPrompt = (style = 'mixed') => {
  const basePrompt = `Analyze this image and suggest 3-4 short text overlays that would enhance it for social media. 

CRITICAL REQUIREMENTS:
1. Analyze the image composition to identify optimal text placement zones
2. Avoid placing text over important visual elements (faces, focal points, busy areas)
3. Consider contrast - suggest positions where text will be readable
4. Respect mobile safe zones - avoid top 15%, right 15%, and bottom 25% of image
5. Suggest positioning as percentages of image dimensions

TEXT STYLE GUIDELINES:
- MOTIVATIONAL: Inspiring quotes, positive affirmations (e.g., "chase your dreams", "good vibes only")
- AESTHETIC: Mood-setting, atmospheric text (e.g., "golden hour magic", "cozy autumn vibes") 
- DESCRIPTIVE: Scene-setting, storytelling (e.g., "sunday morning coffee", "city lights calling")
- MINIMAL: Single impactful words or very short phrases (e.g., "breathe", "wanderlust", "bliss")

Keep text overlays:
- SHORT (1-4 words typically, max 6 words)
- IMPACTFUL and emotionally resonant
- AUTHENTIC (not generic or corporate-sounding)
- APPROPRIATE to the image content and mood

For positioning:
- Identify empty spaces or areas with minimal visual interest
- Avoid faces, important objects, or the main subject
- Consider visual balance and composition
- Ensure sufficient contrast for readability
- Use percentage coordinates (0-100 for both x and y)

Generate a mix of styles unless specifically requested. Provide detailed reasoning for positioning choices.`;

  const styleSpecificGuidance = {
    motivational: `Focus on MOTIVATIONAL text that inspires and uplifts. Think positive affirmations, life mantras, and empowering phrases.`,
    aesthetic: `Focus on AESTHETIC text that captures mood and atmosphere. Think poetic, atmospheric phrases that enhance the visual vibe.`,
    descriptive: `Focus on DESCRIPTIVE text that tells the story of the moment. Think scene-setting phrases that add context.`,
    minimal: `Focus on MINIMAL text with maximum impact. Think single powerful words or very short impactful phrases.`,
    mixed: `Provide a variety of styles - mix motivational, aesthetic, descriptive, and minimal approaches for diverse options.`
  };

  const guidance = styleSpecificGuidance[style] || styleSpecificGuidance.mixed;
  
  return `${basePrompt}\n\nSTYLE FOCUS: ${guidance}\n\nRespond with valid JSON matching the specified schema.`;
};

/**
 * Get fallback text overlays when API fails
 * @param {string} style - Text overlay style
 * @returns {Array} - Fallback text overlay suggestions
 */
const getFallbackTextOverlays = (style = 'mixed') => {
  const fallbacks = {
    motivational: [
      {
        text: "chase your dreams",
        style: "motivational",
        position: { x: 50, y: 30, reasoning: "Center-top placement for impact" }
      },
      {
        text: "good vibes only",
        style: "motivational", 
        position: { x: 50, y: 60, reasoning: "Center placement for readability" }
      },
      {
        text: "believe in yourself",
        style: "motivational",
        position: { x: 50, y: 40, reasoning: "Balanced center positioning" }
      }
    ],
    aesthetic: [
      {
        text: "golden hour magic",
        style: "aesthetic",
        position: { x: 30, y: 70, reasoning: "Lower-left for aesthetic balance" }
      },
      {
        text: "dreamy vibes",
        style: "aesthetic",
        position: { x: 70, y: 30, reasoning: "Upper-right for visual flow" }
      },
      {
        text: "cozy moments",
        style: "aesthetic",
        position: { x: 50, y: 45, reasoning: "Center for maximum impact" }
      }
    ],
    descriptive: [
      {
        text: "sunday morning",
        style: "descriptive",
        position: { x: 40, y: 35, reasoning: "Off-center for natural feel" }
      },
      {
        text: "city lights calling",
        style: "descriptive", 
        position: { x: 60, y: 55, reasoning: "Right-center for balance" }
      },
      {
        text: "quiet moments",
        style: "descriptive",
        position: { x: 50, y: 40, reasoning: "Center for emphasis" }
      }
    ],
    minimal: [
      {
        text: "breathe",
        style: "minimal",
        position: { x: 50, y: 50, reasoning: "Perfect center for minimal impact" }
      },
      {
        text: "wanderlust",
        style: "minimal",
        position: { x: 30, y: 60, reasoning: "Lower-left for subtlety" }
      },
      {
        text: "bliss",
        style: "minimal", 
        position: { x: 70, y: 40, reasoning: "Right-center for elegance" }
      }
    ]
  };

  // For mixed style, combine different categories
  if (style === 'mixed') {
    return [
      fallbacks.motivational[0],
      fallbacks.aesthetic[0], 
      fallbacks.minimal[0]
    ];
  }

  return fallbacks[style] || fallbacks.mixed;
};

/**
 * Get fallback captions when API fails
 * @param {string} style - Caption style
 * @returns {Array} - Fallback captions
 */
const getFallbackCaptions = (style = 'casual') => {
  const fallbacks = {
    casual: [
      "the energy this photo gives off is unmatched 💫",
      "POV: you're living your best life and it shows ✨",
      "not me saving this as my new personality 📸",
      "when the moment hits different and you know it 🌟"
    ],
    creative: [
      "caught between the ordinary and the extraordinary 🎨",
      "where light meets soul and magic happens ✨",
      "this moment speaks in colors I can't name 🌅", 
      "fragments of beauty woven into reality 💝"
    ],
    descriptive: [
      "the kind of scene that makes you pause and breathe deeply",
      "captured in perfect lighting with that effortless beauty",
      "this moment tells a story without saying a word",
      "the gentle beauty that exists in everyday magic"
    ],
    minimal: [
      "transcendent ✨",
      "pure gold 🌟",
      "ethereal vibes",
      "magic hour 💫"
    ]
  };
  
  return fallbacks[style] || fallbacks.casual;
};

/**
 * Get fallback tags when API fails
 * @param {string} style - Caption style  
 * @returns {Array} - Fallback hashtags
 */
const getFallbackTags = (style = 'casual') => {
  const tagFallbacks = {
    casual: ["#maincharacterenergy", "#aesthetic", "#vibes", "#moodbooster"],
    creative: ["#ethereal", "#artisticvibes", "#dreamyaesthetic", "#visualpoetry"],
    descriptive: ["#goldenhour", "#storytelling", "#capturedmoment", "#wanderlust"],
    minimal: ["#minimalism", "#zen", "#serene", "#breathe"]
  };
  
  return tagFallbacks[style] || tagFallbacks.casual;
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

/**
 * Generate conversation starter suggestions using OpenAI
 * @param {string} currentUserId - Current user's ID
 * @param {string} otherUserId - Other user's ID  
 * @param {Object} options - Additional options for generation
 * @returns {Promise<Object>} - Conversation starter suggestions and context
 */
export const generateConversationStarters = async (currentUserId, otherUserId, options = {}) => {
  try {
    console.log('[Embeddings] Generating conversation starters for users:', currentUserId, '→', otherUserId);
    
    // Rate limiting check
    if (!checkRateLimit(currentUserId, 'conversationGeneration')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Track analytics
    analyticsStore.conversationRequests = (analyticsStore.conversationRequests || 0) + 1;
    
    // Import user and friends APIs dynamically to avoid circular dependencies
    const { getUserProfile, getUsersByIds } = await import('./users');
    const { getFriendSuggestions } = await import('./friends');
    
    // Get both user profiles
    const [currentUser, otherUser] = await Promise.all([
      getUserProfile(currentUserId),
      getUserProfile(otherUserId)
    ]);
    
    if (!currentUser || !otherUser) {
      throw new Error('Unable to load user profiles for conversation analysis');
    }
    
    // Analyze shared context
    const context = await analyzeSharedContext(currentUser, otherUser);
    
    // Generate AI suggestions using OpenAI
    const openai = getOpenAIClient();
    const config = RAG_CONFIG.openai;
    
    // Create prompt for conversation starters
    const prompt = createConversationPrompt(currentUser, otherUser, context, options);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: 0.8, // Higher creativity for conversation starters
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "conversation_starters",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      description: "The conversation starter message"
                    },
                    reasoning: {
                      type: "string", 
                      description: "Why this starter was suggested"
                    },
                    category: {
                      type: "string",
                      enum: ["mutual_friends", "shared_interests", "profile_based", "general_friendly"],
                      description: "The type of conversation starter"
                    }
                  },
                  required: ["text", "reasoning", "category"],
                  additionalProperties: false
                },
                minItems: 2,
                maxItems: 3
              },
              context_analysis: {
                type: "string",
                description: "Brief analysis of what these users have in common"
              },
              connection_strength: {
                type: "string",
                enum: ["strong", "moderate", "weak"],
                description: "How connected these users appear to be"
              }
            },
            required: ["suggestions", "context_analysis", "connection_strength"],
            additionalProperties: false
          }
        }
      }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Log successful parsing for testing
    console.log('[Embeddings] Successfully parsed conversation starters:', JSON.stringify(result, null, 2));
    
    // Track successful generation
    analyticsStore.successfulConversations = (analyticsStore.successfulConversations || 0) + 1;
    
    // Store user analytics
    updateUserAnalytics(currentUserId, 'conversationStartersGenerated', {
      otherUserId,
      suggestionCount: result.suggestions.length,
      connectionStrength: result.connection_strength,
      hasSharedContext: context.mutualFriends.length > 0 || context.sharedInterests.length > 0,
      timestamp: new Date().toISOString()
    });
    
    console.log('[Embeddings] Conversation starters generated successfully:', result.suggestions.length);
    
    return {
      success: true,
      suggestions: result.suggestions,
      context: context,
      contextAnalysis: result.context_analysis,
      connectionStrength: result.connection_strength,
      metadata: {
        model: config.model,
        currentUserId,
        otherUserId,
        timestamp: new Date().toISOString(),
        usage: response.usage
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error generating conversation starters:', error);
    
    // Return fallback suggestions on error
    const fallbackSuggestions = getFallbackConversationStarters(options.category);
    
    return {
      success: false,
      error: error.message,
      suggestions: fallbackSuggestions,
      context: {
        mutualFriends: [],
        sharedInterests: [],
        connectionType: 'unknown'
      },
      contextAnalysis: "Unable to analyze shared context - using friendly fallback suggestions",
      connectionStrength: "moderate",
      metadata: {
        fallback: true,
        currentUserId,
        otherUserId,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Analyze shared context between two users
 * @param {Object} currentUser - Current user profile
 * @param {Object} otherUser - Other user profile
 * @returns {Object} - Shared context analysis
 */
const analyzeSharedContext = async (currentUser, otherUser) => {
  try {
    // Find mutual friends
    const currentUserFriends = currentUser.friendIds || [];
    const otherUserFriends = otherUser.friendIds || [];
    const mutualFriendIds = currentUserFriends.filter(friendId => otherUserFriends.includes(friendId));
    
    // Get mutual friend names for context
    let mutualFriends = [];
    if (mutualFriendIds.length > 0) {
      const { getUsersByIds } = await import('./users');
      const mutualFriendProfiles = await getUsersByIds(mutualFriendIds.slice(0, 3)); // Limit to 3 for privacy
      mutualFriends = mutualFriendProfiles.map(friend => friend.displayName || friend.username);
    }
    
    // Analyze shared interests from bios
    const sharedInterests = extractSharedInterests(currentUser.bio, otherUser.bio);
    
    // Determine connection type
    let connectionType = 'stranger';
    if (mutualFriends.length >= 2) {
      connectionType = 'mutual_friends';
    } else if (mutualFriends.length === 1) {
      connectionType = 'one_mutual_friend';
    } else if (sharedInterests.length > 0) {
      connectionType = 'shared_interests';
    }
    
    return {
      mutualFriends,
      mutualFriendIds,
      sharedInterests,
      connectionType,
      currentUserInterests: extractInterests(currentUser.bio),
      otherUserInterests: extractInterests(otherUser.bio)
    };
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing shared context:', error);
    return {
      mutualFriends: [],
      mutualFriendIds: [],
      sharedInterests: [],
      connectionType: 'unknown',
      currentUserInterests: [],
      otherUserInterests: []
    };
  }
};

/**
 * Extract interests from user bio
 * @param {string} bio - User bio text
 * @returns {Array} - Array of interest keywords
 */
const extractInterests = (bio) => {
  if (!bio || typeof bio !== 'string') return [];
  
  const interestKeywords = [
    // Hobbies & Activities
    'photography', 'music', 'travel', 'hiking', 'reading', 'cooking', 'art', 'gaming', 
    'fitness', 'yoga', 'running', 'cycling', 'swimming', 'dancing', 'writing',
    'movies', 'books', 'sports', 'football', 'basketball', 'soccer', 'tennis',
    
    // Lifestyle & Interests  
    'coffee', 'tea', 'food', 'fashion', 'design', 'tech', 'coding', 'startup',
    'entrepreneur', 'business', 'finance', 'crypto', 'investing', 'stocks',
    'nature', 'outdoors', 'camping', 'beach', 'mountains', 'city', 'urban',
    
    // Creative & Academic
    'student', 'college', 'university', 'graduate', 'learning', 'education',
    'science', 'research', 'engineering', 'medicine', 'law', 'journalism',
    'marketing', 'sales', 'consulting', 'nonprofit', 'volunteer',
    
    // Entertainment & Culture
    'concerts', 'festivals', 'theater', 'comedy', 'standup', 'podcast',
    'anime', 'manga', 'netflix', 'streaming', 'vinyl', 'records',
    'wine', 'beer', 'cocktails', 'bartender', 'chef', 'foodie'
  ];
  
  const bioLower = bio.toLowerCase();
  const foundInterests = interestKeywords.filter(keyword => 
    bioLower.includes(keyword)
  );
  
  return foundInterests;
};

/**
 * Extract shared interests between two bios
 * @param {string} bio1 - First user's bio
 * @param {string} bio2 - Second user's bio  
 * @returns {Array} - Array of shared interest keywords
 */
const extractSharedInterests = (bio1, bio2) => {
  const interests1 = extractInterests(bio1);
  const interests2 = extractInterests(bio2);
  
  return interests1.filter(interest => interests2.includes(interest));
};

/**
 * Create conversation starter prompt
 * @param {Object} currentUser - Current user profile
 * @param {Object} otherUser - Other user profile
 * @param {Object} context - Shared context analysis
 * @param {Object} options - Generation options
 * @returns {string} - Formatted prompt
 */
const createConversationPrompt = (currentUser, otherUser, context, options = {}) => {
  const currentUserName = currentUser.displayName || currentUser.username || 'User';
  const otherUserName = otherUser.displayName || otherUser.username || 'Friend';
  
  let contextInfo = '';
  
  // Add mutual friends context
  if (context.mutualFriends.length > 0) {
    const friendsList = context.mutualFriends.slice(0, 2).join(' and ');
    contextInfo += `\n- Mutual friends: ${friendsList}`;
  }
  
  // Add shared interests context
  if (context.sharedInterests.length > 0) {
    const interestsList = context.sharedInterests.slice(0, 3).join(', ');
    contextInfo += `\n- Shared interests: ${interestsList}`;
  }
  
  // Add individual interests for broader context
  if (context.currentUserInterests.length > 0) {
    const currentInterests = context.currentUserInterests.slice(0, 3).join(', ');
    contextInfo += `\n- ${currentUserName}'s interests: ${currentInterests}`;
  }
  
  if (context.otherUserInterests.length > 0) {
    const otherInterests = context.otherUserInterests.slice(0, 3).join(', ');
    contextInfo += `\n- ${otherUserName}'s interests: ${otherInterests}`;
  }
  
  const basePrompt = `Generate 2-3 friendly, natural conversation starters for ${currentUserName} to send to ${otherUserName} as a direct message.

USER CONTEXT:${contextInfo || '\n- No specific shared context found'}

CONVERSATION STARTER REQUIREMENTS:
1. Sound authentic and natural (not corporate or robotic)
2. Be specific to their shared context when possible
3. Keep it casual and non-intrusive
4. Avoid being too personal or forward
5. Make it easy for the other person to respond

CATEGORIES TO USE:
- MUTUAL_FRIENDS: Reference shared connections when available
- SHARED_INTERESTS: Connect over common hobbies/interests  
- PROFILE_BASED: Comment on something from their profile
- GENERAL_FRIENDLY: Warm, welcoming conversation starters

EXAMPLES OF GOOD CONVERSATION STARTERS:
- "Hey! I noticed we both know Sarah - small world! How do you know her?"
- "Saw you're into photography too! Have you checked out the new exhibit downtown?"
- "Hi! Your bio mentioned hiking - any favorite trails around here?"
- "Hey there! Just wanted to say hi since we got connected 👋"

TONE GUIDELINES:
- Friendly but not overly enthusiastic
- Curious rather than interrogating
- Natural conversation flow
- Include light emoji usage when appropriate
- Make it feel like something a real person would type

Focus on creating starters that give ${otherUserName} multiple ways to respond and continue the conversation naturally.

Provide reasoning for each suggestion explaining why it would work well for these specific users.

Respond with valid JSON matching the specified schema.`;

  return basePrompt;
};

/**
 * Get fallback conversation starters when API fails
 * @param {string} category - Preferred category
 * @returns {Array} - Fallback conversation starters
 */
const getFallbackConversationStarters = (category = 'general_friendly') => {
  const fallbacks = {
    mutual_friends: [
      {
        text: "Hey! I think we have some mutual friends - small world! 😊",
        reasoning: "References potential shared connections without being specific",
        category: "mutual_friends"
      },
      {
        text: "Hi there! Just realized we might know some of the same people 👋",
        reasoning: "Casual way to acknowledge shared social circles", 
        category: "mutual_friends"
      }
    ],
    shared_interests: [
      {
        text: "Hey! Noticed we might have some similar interests - what's been keeping you busy lately?",
        reasoning: "Opens conversation about shared hobbies without being too specific",
        category: "shared_interests"
      },
      {
        text: "Hi! Your profile caught my attention - seems like we have some things in common! 😊",
        reasoning: "Acknowledges profile content while keeping things general",
        category: "shared_interests"
      }
    ],
    profile_based: [
      {
        text: "Hey! Love your profile - you seem like a really interesting person to know! 😊",
        reasoning: "Positive comment about their profile that invites conversation",
        category: "profile_based"
      },
      {
        text: "Hi there! Something about your vibe just seemed really cool - thought I'd say hey! 👋",
        reasoning: "Compliments their overall presence without being too specific",
        category: "profile_based"
      }
    ],
    general_friendly: [
      {
        text: "Hey! Just wanted to reach out and say hi 👋 How's your day going?",
        reasoning: "Simple, friendly opener that's easy to respond to",
        category: "general_friendly"
      },
      {
        text: "Hi there! Hope you're having a great day - thought I'd introduce myself 😊",
        reasoning: "Warm introduction that sets a positive tone",
        category: "general_friendly"
      },
      {
        text: "Hey! New connections are always exciting - what's been the highlight of your week?",
        reasoning: "Enthusiastic but not overwhelming, asks an engaging question",
        category: "general_friendly"  
      }
    ]
  };
  
  return fallbacks[category] || fallbacks.general_friendly;
};

/**
 * Generate smart filter recommendations based on image analysis
 * @param {string} imageUri - URI of the image to analyze
 * @param {string} userId - User ID for analytics and rate limiting
 * @param {Object} options - Additional options for filter recommendations
 * @returns {Promise<Object>} - Filter recommendations and analysis
 */
export const generateFilterRecommendations = async (imageUri, userId, options = {}) => {
  try {
    console.log('[Embeddings] 🎭 Generating smart filter recommendations for image:', imageUri);
    
    // Rate limiting check
    if (!checkRateLimit(userId, 'filterRecommendation')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    const openai = getOpenAIClient();
    const config = RAG_CONFIG.openai;
    
    // Prepare image for analysis
    const imageData = await prepareImageForAnalysis(imageUri);
    
    // Create prompt for filter recommendation
    const prompt = createFilterRecommendationPrompt(options);
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: 0.8, // Balanced creativity for recommendations
      max_tokens: 400,
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
          name: "filter_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    filterId: {
                      type: "string",
                      description: "ID of the recommended filter"
                    },
                    score: {
                      type: "number",
                      minimum: 0,
                      maximum: 100,
                      description: "Effectiveness score for this filter (0-100)"
                    },
                    reasoning: {
                      type: "string",
                      description: "Why this filter is recommended"
                    },
                    category: {
                      type: "string",
                      enum: ["lighting", "mood", "facial", "scene"],
                      description: "Category of recommendation"
                    }
                  },
                  required: ["filterId", "score", "reasoning", "category"],
                  additionalProperties: false
                },
                minItems: 1,
                maxItems: 5
              },
              analysis: {
                type: "object",
                properties: {
                  lighting: {
                    type: "string",
                    enum: ["bright", "dim", "golden_hour", "indoor", "outdoor", "artificial"],
                    description: "Lighting condition analysis"
                  },
                  mood: {
                    type: "string", 
                    enum: ["happy", "serious", "playful", "romantic", "energetic", "calm"],
                    description: "Overall mood of the image"
                  },
                  scene: {
                    type: "string",
                    enum: ["selfie", "group", "outdoor", "indoor", "close_up", "wide_shot"],
                    description: "Scene type analysis"
                  },
                  faces_detected: {
                    type: "boolean",
                    description: "Whether faces are detected in the image"
                  },
                  primary_colors: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Dominant colors in the image"
                  }
                },
                required: ["lighting", "mood", "scene", "faces_detected", "primary_colors"],
                additionalProperties: false
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Overall confidence in recommendations"
              }
            },
            required: ["recommendations", "analysis", "confidence"],
            additionalProperties: false
          }
        }
      }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    
    console.log('[Embeddings] ✅ Filter recommendations generated:', result.recommendations.length);
    
    // Store user analytics
    updateUserAnalytics(userId, 'filterRecommendationGenerated', {
      recommendationCount: result.recommendations.length,
      confidence: result.confidence,
      lighting: result.analysis.lighting,
      mood: result.analysis.mood,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      recommendations: result.recommendations,
      analysis: result.analysis,
      confidence: result.confidence,
      metadata: {
        model: config.model,
        userId,
        timestamp: new Date().toISOString(),
        usage: response.usage
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] ❌ Error generating filter recommendations:', error);
    
    // Return fallback recommendations on error
    return {
      success: false,
      error: error.message,
      recommendations: getFallbackFilterRecommendations(),
      analysis: {
        lighting: "unknown",
        mood: "unknown", 
        scene: "unknown",
        faces_detected: false
      },
      confidence: 30,
      metadata: {
        fallback: true,
        userId,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Create filter recommendation prompt based on available filters
 * @param {Object} options - Recommendation options
 * @returns {string} - Formatted prompt
 */
const createFilterRecommendationPrompt = (options = {}) => {
  return `Analyze this image and recommend the most suitable emoji filters based on the image content and characteristics.

AVAILABLE EMOJI FILTERS (Choose the most contextually relevant):

🎭 FACE FILTERS:
- "sunglasses" 🕶️ - Cool sunglasses (bright lighting, casual selfies)
- "heart_eyes" 😍 - Heart eyes (romantic, cute, positive mood)
- "cool_face" 😎 - Cool emoji (confident, relaxed vibes)
- "crown" 👑 - Royal crown (celebratory, special occasions)

🌿 NATURE & OUTDOOR FILTERS:
- "waterfall" 🏞️ - Waterfall/nature scenery (perfect for waterfalls, landscapes, natural scenes)
- "mountain" 🏔️ - Mountain emoji (hiking, mountain views, outdoor adventures)
- "tree" 🌲 - Tree emoji (forests, nature, outdoor activities)
- "flower" 🌸 - Flower emoji (gardens, spring, beautiful blooms)
- "sun" ☀️ - Sunshine (bright sunny days, golden hour, outdoor fun)
- "rainbow" 🌈 - Rainbow (colorful scenes, after rain, pride, happiness)

✨ MOOD & ENERGY FILTERS:
- "fire" 🔥 - Fire emoji (hot, energetic, exciting content)
- "lightning" ⚡ - Lightning bolt (high energy, powerful moments)
- "star" ⭐ - Star (special moments, achievements, night scenes)
- "sparkle" ✨ - Sparkles (magical, glittery, special effects)

☕ LIFESTYLE & ACTIVITY FILTERS:
- "coffee" ☕ - Coffee (café scenes, morning vibes, coffee culture)
- "pizza" 🍕 - Pizza (food photos, casual dining, fun meals)
- "camera" 📸 - Camera (photography, creative content, artistic shots)
- "music" 🎵 - Music notes (concerts, musical moments, artistic vibes)

🐾 ANIMAL FILTERS:
- "cat" 🐱 - Cat face (cute, playful, pet photos)
- "dog" 🐶 - Dog face (friendly, loyal, pet content)
- "butterfly" 🦋 - Butterfly (delicate, beautiful, transformation)

🌤️ WEATHER & SEASONAL FILTERS:
- "snowflake" ❄️ - Snowflake (winter, cold, snow scenes)
- "cloud" ☁️ - Cloud (overcast, dreamy, soft lighting)
- "moon" 🌙 - Moon (night, romantic, celestial)

RECOMMENDATION PRIORITY:
1. **CONTENT MATCH**: Does the emoji directly relate to what's in the image? (waterfall photo = 🏞️ gets 95+ score)
2. **SCENE RELEVANCE**: Does the emoji fit the scene type? (nature scene = nature emojis score 80-90)
3. **MOOD ENHANCEMENT**: Does the emoji match the image mood? (energetic scene = ⚡🔥 score 70-80)
4. **LIGHTING COMPATIBILITY**: Does the emoji work with the lighting? (bright = ☀️, dim = 🌙)
5. **GENERAL APPEAL**: Generic but attractive options (face filters score 50-60)

SCORING CRITERIA (0-100):
- 95-100: Perfect content match (waterfall image gets waterfall emoji)
- 85-94: Excellent thematic relevance (nature scene gets nature emoji)
- 75-84: Strong mood/activity match (energetic scene gets energy emoji)
- 60-74: Good general enhancement (face filters on portraits)
- 40-59: Okay but not optimal (unrelated but harmless)
- 0-39: Poor match, doesn't fit the content

ANALYSIS CRITERIA:
- **Primary Content**: What is the main subject? (waterfall, person, food, etc.)
- **Scene Type**: landscape/portrait/close-up/wide-shot/indoor/outdoor
- **Mood Assessment**: peaceful/energetic/fun/romantic/serious/playful
- **Lighting**: bright/dim/golden_hour/natural/artificial
- **Colors**: What are the dominant colors and how do they relate to available emojis?

Focus on recommending 3-4 filters that genuinely match the image content.
Prioritize content relevance over generic appeal.

For a waterfall image: waterfall 🏞️ should score 95+, other nature emojis 85+, mood emojis 70+, generic face filters 50-.

Respond with valid JSON matching the specified schema.`;
};

/**
 * Get fallback filter recommendations when AI fails
 * @returns {Array} - Default filter recommendations
 */
const getFallbackFilterRecommendations = () => {
  // Provide a diverse mix of filters as fallbacks
  const fallbackOptions = [
    // Always include some safe options
    { filterId: "sparkle", score: 80, reasoning: "Magical sparkles enhance most photos", category: "mood" },
    { filterId: "sunglasses", score: 75, reasoning: "Cool sunglasses work well for many selfies", category: "facial" },
    { filterId: "fire", score: 70, reasoning: "Fire emoji adds energy and excitement", category: "mood" },
    { filterId: "star", score: 68, reasoning: "Star emoji highlights special moments", category: "mood" },
    
    // Nature options for outdoor content
    { filterId: "sun", score: 72, reasoning: "Sunshine emoji brightens outdoor photos", category: "lighting" },
    { filterId: "flower", score: 69, reasoning: "Flower emoji adds beauty to natural scenes", category: "scene" },
    
    // Lifestyle options
    { filterId: "camera", score: 66, reasoning: "Camera emoji perfect for photography content", category: "scene" },
    { filterId: "heart_eyes", score: 65, reasoning: "Heart eyes express positive emotions", category: "mood" }
  ];
  
  // Return a random selection of 3-4 fallback options
  const shuffled = [...fallbackOptions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}; 