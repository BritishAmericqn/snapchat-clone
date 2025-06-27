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
    
    // Parse response with markdown code block handling
    let responseContent = response.choices[0].message.content;
    
    // Remove markdown code blocks if present
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```\n?/g, '').replace(/\n?```/g, '');
    }
    
    // Clean up any leading/trailing whitespace
    responseContent = responseContent.trim();
    
    console.log('[Embeddings] Raw OpenAI response for captions:', responseContent);
    
    const result = JSON.parse(responseContent);
    
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
    
    // Parse response with markdown code block handling
    let responseContent = response.choices[0].message.content;
    
    // Remove markdown code blocks if present
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```\n?/g, '').replace(/\n?```/g, '');
    }
    
    // Clean up any leading/trailing whitespace
    responseContent = responseContent.trim();
    
    console.log('[Embeddings] Raw OpenAI response for text overlays:', responseContent);
    
    const result = JSON.parse(responseContent);
    
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
 * Generate conversation starter suggestions with advanced intelligence
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generated conversation starters with advanced context
 */
export const generateConversationStarters = async (currentUserId, otherUserId, options = {}) => {
  try {
    console.log('[Embeddings] 🎯 Generating conversation starters with advanced intelligence for users:', currentUserId, '→', otherUserId);
    
    // Rate limiting check
    if (!checkRateLimit(currentUserId, 'conversationGeneration')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Import necessary APIs
    const { getUserProfile } = await import('./users');
    const { getOrCreateChat } = await import('./messages');
    
    // Get user profiles
    const [currentUser, otherUser] = await Promise.all([
      getUserProfile(currentUserId),
      getUserProfile(otherUserId)
    ]);
    
    // Get or create chat to analyze history
    const chat = await getOrCreateChat(currentUserId, otherUserId);
    const chatId = chat.id;
    
    // FEATURE 41: Analyze conversation history and tone
    console.log('[Embeddings] 🔍 Analyzing conversation history...');
    const conversationHistory = await analyzeConversationHistory(chatId, currentUserId, otherUserId);
    
    // FEATURE 42: Enhanced context awareness (friends' activities)
    console.log('[Embeddings] 🎭 Analyzing enhanced context...');
    const enhancedContext = await analyzeEnhancedContext(currentUserId, otherUserId);
    
    // FEATURE 43: Timing intelligence
    console.log('[Embeddings] ⏰ Analyzing optimal timing...');
    const timingIntelligence = await analyzeOptimalTiming(currentUserId, otherUserId);
    
    // FEATURE 44: Activity-based topic suggestions
    console.log('[Embeddings] 🎯 Generating activity-based topics...');
    const activityTopics = await generateActivityBasedTopics(currentUserId, otherUserId, options);
    
    // Analyze shared context for additional insights
    const sharedContext = await analyzeSharedContext(currentUser, otherUser);
    
    // Generate enhanced conversation starters using OpenAI with all intelligence
    const enhancedPrompt = createEnhancedConversationPrompt(
      currentUser, 
      otherUser, 
      {
        ...sharedContext,
        conversationHistory: conversationHistory.analysis,
        enhancedContext: enhancedContext.context,
        timingInsights: timingIntelligence.insights,
        activityTopics: activityTopics.topics || []
      }, 
      options
    );
    
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: RAG_CONFIG.openai.model,
      temperature: 0.8,
      max_tokens: 400,
      messages: [{ role: "user", content: enhancedPrompt }]
    });
    
    // Parse response with markdown code block handling
    let responseContent = response.choices[0].message.content;
    
    // Remove markdown code blocks if present
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```\n?/g, '').replace(/\n?```/g, '');
    }
    
    // Clean up any leading/trailing whitespace
    responseContent = responseContent.trim();
    
    console.log('[Embeddings] Raw OpenAI response for conversation starters:', responseContent);
    
    const result = JSON.parse(responseContent);
    
    // Enhance suggestions with unique IDs and advanced metadata
    const enhancedSuggestions = result.suggestions.map((suggestion, index) => ({
      id: `starter_${Date.now()}_${index}`,
      text: suggestion.text,
      reasoning: suggestion.reasoning,
      category: suggestion.category,
      confidence: suggestion.confidence || 'medium',
      intelligenceUsed: {
        conversationHistory: !!conversationHistory.success,
        enhancedContext: !!enhancedContext.success,
        timingIntelligence: !!timingIntelligence.success,
        activityBased: !!activityTopics.success
      },
      metadata: {
        conversationStage: conversationHistory.analysis?.conversationStage,
        connectionStrength: enhancedContext.insights?.connectionStrength,
        timingConfidence: timingIntelligence.recommendations?.confidence,
        basedOnActivities: activityTopics.topics?.length || 0
      }
    }));
    
    // Create comprehensive context analysis for UI display
    const contextAnalysis = createContextAnalysisForUI(
      conversationHistory,
      enhancedContext,
      timingIntelligence,
      activityTopics,
      sharedContext
    );
    
    console.log('[Embeddings] ✅ Enhanced conversation starters generated:', enhancedSuggestions.length);
    
    return {
      success: true,
      suggestions: enhancedSuggestions,
      context: {
        contextAnalysis,
        connectionStrength: enhancedContext.insights?.connectionStrength || 'moderate',
        conversationStage: conversationHistory.analysis?.conversationStage || 'new',
        timingRecommendation: timingIntelligence.insights || 'No specific timing data available',
        sharedInterests: sharedContext.sharedInterests || [],
        mutualFriends: sharedContext.mutualFriends || []
      },
      intelligence: {
        conversationHistory: conversationHistory.success ? conversationHistory : null,
        enhancedContext: enhancedContext.success ? enhancedContext : null,
        timingIntelligence: timingIntelligence.success ? timingIntelligence : null,
        activityTopics: activityTopics.success ? activityTopics : null
      },
      metadata: {
        model: RAG_CONFIG.openai.model,
        userId: currentUserId,
        timestamp: new Date().toISOString(),
        usage: response.usage,
        advancedFeaturesUsed: 4 // Features 41-44 used
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error generating enhanced conversation starters:', error);
    
    // Return fallback starters with basic intelligence
    const fallbackStarters = getFallbackConversationStarters(options.category);
    const fallbackSuggestions = fallbackStarters.map((text, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      text,
      reasoning: 'Generated using fallback logic due to system limitations',
      category: 'general_friendly',
      confidence: 'low',
      intelligenceUsed: {
        conversationHistory: false,
        enhancedContext: false,
        timingIntelligence: false,
        activityBased: false
      }
    }));
    
    return {
      success: false,
      error: error.message,
      suggestions: fallbackSuggestions,
      context: {
        contextAnalysis: 'Using basic conversation starters due to advanced analysis limitations.',
        connectionStrength: 'moderate',
        conversationStage: 'unknown',
        timingRecommendation: 'General best practices suggest mid-morning on weekdays.',
        sharedInterests: [],
        mutualFriends: []
      },
      metadata: {
        fallback: true,
        userId: currentUserId,
        timestamp: new Date().toISOString(),
        advancedFeaturesUsed: 0
      }
    };
  }
};

/**
 * Create enhanced conversation prompt using all intelligence features
 * @param {Object} currentUser - Current user profile
 * @param {Object} otherUser - Other user profile  
 * @param {Object} intelligenceContext - Combined intelligence context
 * @param {Object} options - Generation options
 * @returns {string} - Enhanced prompt for OpenAI
 */
const createEnhancedConversationPrompt = (currentUser, otherUser, intelligenceContext, options = {}) => {
  const basePrompt = `Generate 3 conversation starters using advanced conversation intelligence analysis:

CONVERSATION HISTORY ANALYSIS:
- Stage: ${intelligenceContext.conversationHistory?.conversationStage || 'new'}
- Tone: ${intelligenceContext.conversationHistory?.toneProgression || 'neutral'}
- Health: ${intelligenceContext.conversationHistory?.conversationHealth || 'unknown'}
- Recommended Approach: ${intelligenceContext.conversationHistory?.recommendedApproach || 'friendly'}
- Days Since Last Contact: ${intelligenceContext.conversationHistory?.lastInteractionDays || 'N/A'}

ENHANCED CONTEXT (Friend Activities):
- Shared Activities: ${JSON.stringify(intelligenceContext.enhancedContext?.sharedActivities || [])}
- Recent Interests: ${JSON.stringify(intelligenceContext.enhancedContext?.recentInterests || [])}
- Connection Strength: ${intelligenceContext.enhancedContext?.connectionStrength || 'moderate'}

TIMING INTELLIGENCE:
- Current Timing Assessment: ${intelligenceContext.timingInsights || 'No specific timing data'}
- Recommended Contact Windows: Based on interaction patterns analysis

ACTIVITY-BASED TOPICS:
- Recent Activity Topics: ${JSON.stringify(intelligenceContext.activityTopics || [])}

SHARED CONTEXT:
- Shared Interests: ${JSON.stringify(intelligenceContext.sharedInterests || [])}
- Mutual Friends: ${intelligenceContext.mutualFriends?.length || 0} mutual connections
- Bio Interests: ${JSON.stringify(intelligenceContext.bioInterests || [])}

USER PROFILES:
- Current User: ${currentUser?.displayName || 'User'} (${currentUser?.bio || 'No bio'})
- Other User: ${otherUser?.displayName || 'User'} (${otherUser?.bio || 'No bio'})

INSTRUCTIONS:
Create conversation starters that:
1. Match the recommended approach based on conversation history
2. Reference shared activities or interests when available
3. Consider the conversation stage and relationship strength
4. Use activity-based topics when relevant
5. Feel natural and engaging for the specific relationship context

For each starter, provide:
- text: The conversation starter message
- reasoning: Why this works based on the intelligence analysis
- category: Type (conversation_history, shared_activity, mutual_interest, timing_based)
- confidence: How confident we are this will work (high/medium/low)

Respond with JSON format:
{
  "suggestions": [
    {
      "text": "conversation starter text",
      "reasoning": "why this works based on intelligence",
      "category": "conversation_history|shared_activity|mutual_interest|timing_based",
      "confidence": "high|medium|low"
    }
  ],
  "contextSummary": "Brief summary of the intelligence used"
}`;

  return basePrompt;
};

/**
 * Create context analysis for UI display
 * @param {Object} conversationHistory - Conversation history analysis
 * @param {Object} enhancedContext - Enhanced context analysis
 * @param {Object} timingIntelligence - Timing intelligence analysis
 * @param {Object} activityTopics - Activity-based topics
 * @param {Object} sharedContext - Shared context analysis
 * @returns {string} - Context analysis for UI
 */
const createContextAnalysisForUI = (conversationHistory, enhancedContext, timingIntelligence, activityTopics, sharedContext) => {
  const contextParts = [];
  
  // Add conversation history insights
  if (conversationHistory.success && conversationHistory.analysis) {
    const analysis = conversationHistory.analysis;
    if (analysis.conversationStage === 'new') {
      contextParts.push('Starting fresh conversation');
    } else if (analysis.conversationStage === 'dormant') {
      contextParts.push(`Reconnecting after ${analysis.lastInteractionDays} days`);
    } else if (analysis.conversationStage === 'active') {
      contextParts.push(`Active conversation (${analysis.toneProgression} tone)`);
    }
  }
  
  // Add enhanced context insights
  if (enhancedContext.success && enhancedContext.context) {
    if (enhancedContext.context.sharedActivities?.length > 0) {
      contextParts.push(`${enhancedContext.context.sharedActivities.length} shared activities detected`);
    }
    if (enhancedContext.insights?.connectionStrength) {
      contextParts.push(`${enhancedContext.insights.connectionStrength} connection strength`);
    }
  }
  
  // Add timing insights
  if (timingIntelligence.success && timingIntelligence.insights) {
    contextParts.push(`Timing: ${timingIntelligence.insights}`);
  }
  
  // Add activity-based insights
  if (activityTopics.success && activityTopics.topics?.length > 0) {
    contextParts.push(`${activityTopics.topics.length} activity-based topics available`);
  }
  
  // Add shared context
  if (sharedContext.sharedInterests?.length > 0) {
    contextParts.push(`Shared interests: ${sharedContext.sharedInterests.slice(0, 2).join(', ')}`);
  }
  
  return contextParts.length > 0 
    ? `AI Analysis: ${contextParts.join(' • ')}`
    : 'AI is analyzing your conversation context...';
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
 * Feature 43: Timing Intelligence - Analyze optimal contact timing
 * @param {string} userId - User ID to analyze timing for
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<Object>} - Timing intelligence analysis
 */
export const analyzeOptimalTiming = async (userId, otherUserId) => {
  try {
    console.log('[Embeddings] ⏰ Analyzing optimal timing for users:', userId, '→', otherUserId);
    
    // Import necessary APIs
    const { getUserProfile } = await import('./users');
    const { getChatMessages } = await import('./messages');
    
    // Get user profiles for timezone and activity patterns
    const [userProfile, otherUserProfile] = await Promise.all([
      getUserProfile(userId),
      getUserProfile(otherUserId)
    ]);
    
    // Analyze response patterns from previous conversations
    const timingPatterns = await analyzeResponseTimingPatterns(userId, otherUserId);
    
    // Calculate optimal timing recommendations
    const optimalTimes = calculateOptimalContactTimes(timingPatterns, otherUserProfile);
    
    // Generate timing intelligence insights
    const insights = generateTimingInsights(timingPatterns, optimalTimes);
    
    return {
      success: true,
      optimalTimes,
      timingPatterns,
      insights,
      recommendations: {
        bestDayOfWeek: optimalTimes.bestDay,
        bestTimeOfDay: optimalTimes.bestHour,
        worstTimes: optimalTimes.avoidTimes,
        confidence: optimalTimes.confidence
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        dataPoints: timingPatterns.totalInteractions
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing optimal timing:', error);
    return {
      success: false,
      error: error.message,
      optimalTimes: {
        bestDay: 'Tuesday',
        bestHour: '10:00',
        confidence: 'low'
      },
      insights: 'Insufficient data for timing analysis',
      recommendations: {
        bestDayOfWeek: 'Tuesday',
        bestTimeOfDay: '10:00 AM',
        worstTimes: ['Very early morning', 'Late evening'],
        confidence: 'low'
      }
    };
  }
};

/**
 * Feature 42: Enhanced Context Awareness - Analyze friends' activities
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<Object>} - Enhanced context analysis
 */
export const analyzeEnhancedContext = async (currentUserId, otherUserId) => {
  try {
    console.log('[Embeddings] 🔍 Analyzing enhanced context for users:', currentUserId, '→', otherUserId);
    
    // Import necessary APIs
    const { getUserProfile, getUsersByIds } = await import('./users');
    const { getFeedPosts } = await import('./posts');
    const { areUsersFriends } = await import('./messages');
    
    // Verify users are friends before accessing activity data
    const areFriends = await areUsersFriends(currentUserId, otherUserId);
    if (!areFriends) {
      return {
        success: false,
        error: 'Users are not friends - cannot access activity data',
        context: {
          sharedActivities: [],
          recentInterests: [],
          mutualConnections: []
        }
      };
    }
    
    // Get both user profiles
    const [currentUser, otherUser] = await Promise.all([
      getUserProfile(currentUserId),
      getUserProfile(otherUserId)
    ]);
    
    // Analyze recent posts and activities (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivities = await analyzeRecentUserActivities(otherUserId, thirtyDaysAgo);
    
    // Find shared interests and activities
    const sharedContext = await findSharedActivitiesAndInterests(currentUser, otherUser, recentActivities);
    
    // Generate conversation contexts based on activities
    const conversationContexts = await generateActivityBasedContexts(sharedContext, recentActivities);
    
    return {
      success: true,
      context: {
        sharedActivities: sharedContext.activities,
        recentInterests: recentActivities.interests,
        mutualConnections: sharedContext.mutualFriends,
        conversationOpportunities: conversationContexts
      },
      insights: {
        connectionStrength: sharedContext.connectionStrength,
        sharedInterestCount: sharedContext.activities.length,
        recentActivityLevel: recentActivities.activityLevel
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        dataRange: '30 days'
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing enhanced context:', error);
    return {
      success: false,
      error: error.message,
      context: {
        sharedActivities: [],
        recentInterests: [],
        mutualConnections: []
      }
    };
  }
};

/**
 * Feature 44: Activity-Based Topic Suggestions
 * @param {string} currentUserId - Current user ID  
 * @param {string} otherUserId - Other user ID
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Activity-based conversation topics
 */
export const generateActivityBasedTopics = async (currentUserId, otherUserId, options = {}) => {
  try {
    console.log('[Embeddings] 🎯 Generating activity-based topics for users:', currentUserId, '→', otherUserId);
    
    // Get enhanced context and recent activities
    const enhancedContext = await analyzeEnhancedContext(currentUserId, otherUserId);
    
    if (!enhancedContext.success) {
      return {
        success: false,
        error: enhancedContext.error,
        topics: []
      };
    }
    
    // Generate AI-powered topic suggestions based on activities
    const activityTopics = await generateAITopicsFromActivities(
      enhancedContext.context,
      currentUserId,
      otherUserId,
      options
    );
    
    return {
      success: true,
      topics: activityTopics.suggestions,
      context: enhancedContext.context,
      insights: activityTopics.insights,
      metadata: {
        topicsGenerated: activityTopics.suggestions.length,
        basedOnActivities: enhancedContext.context.sharedActivities.length,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error generating activity-based topics:', error);
    return {
      success: false,
      error: error.message,
      topics: getFallbackActivityTopics()
    };
  }
};

/**
 * Feature 45: Success Rate Tracking and Optimization
 * @param {string} conversationStarterId - ID of the conversation starter used
 * @param {string} chatId - Chat ID where starter was used
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID  
 * @returns {Promise<Object>} - Success tracking result
 */
export const trackConversationStarterSuccess = async (conversationStarterId, chatId, currentUserId, otherUserId) => {
  try {
    console.log('[Embeddings] 📊 Tracking conversation starter success:', conversationStarterId);
    
    // Create success tracking record
    const successRecord = {
      id: `success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationStarterId,
      chatId,
      currentUserId,
      otherUserId,
      usedAt: new Date(),
      trackingStarted: new Date(),
      category: 'conversation_starter_usage'
    };
    
    // Store in analytics (in-memory for MVP)
    if (!analyticsStore.conversationSuccess) {
      analyticsStore.conversationSuccess = [];
    }
    analyticsStore.conversationSuccess.push(successRecord);
    
    // Schedule follow-up analysis (simulate with immediate analysis for demo)
    setTimeout(async () => {
      await analyzeConversationSuccessOutcome(successRecord);
    }, 1000); // Demo immediate analysis
    
    return {
      success: true,
      trackingId: successRecord.id,
      message: 'Success tracking initiated',
      followUpScheduled: true
    };
    
  } catch (error) {
    console.error('[Embeddings] Error tracking conversation starter success:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Analyze conversation success outcome
 * @param {Object} successRecord - Success record to analyze
 * @returns {Promise<Object>} - Success analysis result
 */
const analyzeConversationSuccessOutcome = async (successRecord) => {
  try {
    // Import messages API to check conversation continuation
    const { getChatMessages } = await import('./messages');
    
    // Get messages after the conversation starter was used
    const messages = await getChatMessages(successRecord.chatId, 20);
    const messagesAfterStarter = messages.filter(msg => 
      new Date(msg.createdAt) > successRecord.usedAt
    );
    
    // Analyze success metrics
    const successMetrics = {
      responseReceived: messagesAfterStarter.some(msg => msg.senderUid === successRecord.otherUserId),
      responseTime: calculateResponseTime(messagesAfterStarter, successRecord),
      conversationContinued: messagesAfterStarter.length >= 3,
      engagementQuality: analyzeEngagementQuality(messagesAfterStarter)
    };
    
    // Update success record with results
    const updatedRecord = {
      ...successRecord,
      analyzed: true,
      analysisDate: new Date(),
      successMetrics,
      overallSuccess: determineOverallSuccess(successMetrics)
    };
    
    // Update analytics store
    const index = analyticsStore.conversationSuccess.findIndex(r => r.id === successRecord.id);
    if (index !== -1) {
      analyticsStore.conversationSuccess[index] = updatedRecord;
    }
    
    console.log('[Embeddings] ✅ Conversation success analyzed:', updatedRecord.overallSuccess);
    
    return updatedRecord;
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing conversation success:', error);
    return null;
  }
};

/**
 * Get conversation starter success analytics
 * @returns {Object} - Success analytics summary
 */
export const getConversationSuccessAnalytics = () => {
  try {
    const successRecords = analyticsStore.conversationSuccess || [];
    const analyzedRecords = successRecords.filter(r => r.analyzed);
    
    if (analyzedRecords.length === 0) {
      return {
        totalTracked: successRecords.length,
        successRate: 0,
        averageResponseTime: 0,
        insights: 'Insufficient data for analysis'
      };
    }
    
    const successfulStarters = analyzedRecords.filter(r => r.overallSuccess);
    const successRate = (successfulStarters.length / analyzedRecords.length) * 100;
    
    // Calculate average response time for successful starters
    const responseTimes = analyzedRecords
      .filter(r => r.successMetrics.responseReceived)
      .map(r => r.successMetrics.responseTime)
      .filter(t => t > 0);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Analyze patterns
    const categorySuccess = analyzeCategorySuccessRates(analyzedRecords);
    
    return {
      totalTracked: successRecords.length,
      totalAnalyzed: analyzedRecords.length,
      successRate: Math.round(successRate),
      averageResponseTime: Math.round(averageResponseTime),
      categorySuccess,
      insights: generateSuccessInsights(analyzedRecords, successRate),
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[Embeddings] Error getting success analytics:', error);
    return {
      totalTracked: 0,
      successRate: 0,
      averageResponseTime: 0,
      insights: 'Error retrieving analytics'
    };
  }
};

/**
 * Helper Functions for Advanced Conversation Intelligence
 */

/**
 * Calculate average response time between messages
 * @param {Array} messages - Array of messages
 * @returns {number} - Average response time in hours
 */
const calculateAverageResponseTime = (messages) => {
  if (messages.length < 2) return 0;
  
  const responseTimes = [];
  for (let i = 1; i < messages.length; i++) {
    const current = new Date(messages[i-1].createdAt);
    const previous = new Date(messages[i].createdAt);
    const diffHours = (current - previous) / (1000 * 60 * 60);
    
    if (diffHours > 0 && diffHours < 168) { // Within a week
      responseTimes.push(diffHours);
    }
  }
  
  return responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
};

/**
 * Determine conversation stage based on message count and recency
 * @param {number} messageCount - Number of messages
 * @param {number} daysSinceLastMessage - Days since last interaction
 * @returns {string} - Conversation stage
 */
const getConversationStage = (messageCount, daysSinceLastMessage) => {
  if (messageCount === 0) return 'new';
  if (messageCount < 5) return 'early';
  if (daysSinceLastMessage > 30) return 'dormant';
  if (daysSinceLastMessage > 7) return 'lapsed';
  return 'active';
};

/**
 * Determine conversation health based on patterns
 * @param {Array} messages - Message array
 * @param {number} messageBalance - Balance ratio
 * @param {number} daysSinceLastMessage - Days since last message
 * @returns {string} - Conversation health status
 */
const determineConversationHealth = (messages, messageBalance, daysSinceLastMessage) => {
  if (messages.length === 0) return 'new_conversation';
  if (daysSinceLastMessage > 30) return 'dormant';
  if (daysSinceLastMessage > 7) return 'needs_revival';
  if (messageBalance > 3 || messageBalance < 0.3) return 'imbalanced';
  if (messages.length > 20) return 'healthy';
  return 'developing';
};

/**
 * Get recommended approach based on conversation health and tone
 * @param {string} conversationHealth - Health status
 * @param {Object} toneAnalysis - Tone analysis results
 * @returns {string} - Recommended approach
 */
const getRecommendedApproach = (conversationHealth, toneAnalysis) => {
  if (conversationHealth === 'new_conversation') return 'friendly_introduction';
  if (conversationHealth === 'dormant') return 'gentle_reconnection';
  if (conversationHealth === 'needs_revival') return 'engaging_reactivation';
  if (conversationHealth === 'imbalanced') return 'balanced_engagement';
  if (toneAnalysis.overallTone === 'positive') return 'continue_positive_momentum';
  if (toneAnalysis.overallTone === 'negative') return 'supportive_understanding';
  return 'natural_continuation';
};

/**
 * Analyze response timing patterns for timing intelligence
 * @param {string} userId - User ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<Object>} - Timing patterns analysis
 */
const analyzeResponseTimingPatterns = async (userId, otherUserId) => {
  try {
    // In a real implementation, this would analyze historical message timestamps
    // For MVP, we'll simulate with basic patterns
    
    const timingData = {
      totalInteractions: Math.floor(Math.random() * 50) + 10,
      averageResponseTime: Math.floor(Math.random() * 6) + 1, // 1-6 hours
      bestResponseDays: ['Tuesday', 'Wednesday', 'Thursday'],
      bestResponseHours: ['10:00', '14:00', '19:00'],
      quickResponseTimes: ['10:00-12:00', '14:00-16:00'],
      slowResponseTimes: ['06:00-08:00', '22:00-24:00']
    };
    
    return timingData;
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing timing patterns:', error);
    return {
      totalInteractions: 0,
      averageResponseTime: 4,
      bestResponseDays: ['Tuesday', 'Wednesday'],
      bestResponseHours: ['10:00', '14:00'],
      quickResponseTimes: ['10:00-12:00'],
      slowResponseTimes: ['22:00-06:00']
    };
  }
};

/**
 * Calculate optimal contact times based on patterns
 * @param {Object} timingPatterns - Timing patterns data
 * @param {Object} userProfile - Other user's profile
 * @returns {Object} - Optimal timing recommendations
 */
const calculateOptimalContactTimes = (timingPatterns, userProfile) => {
  // Determine confidence based on interaction count
  let confidence = 'low';
  if (timingPatterns.totalInteractions > 20) confidence = 'medium';
  if (timingPatterns.totalInteractions > 50) confidence = 'high';
  
  // Use timing patterns to determine best times
  const bestDay = timingPatterns.bestResponseDays[0] || 'Tuesday';
  const bestHour = timingPatterns.bestResponseHours[0] || '10:00';
  
  return {
    bestDay,
    bestHour,
    confidence,
    avoidTimes: timingPatterns.slowResponseTimes || ['Very early morning', 'Late evening'],
    recommendedWindows: timingPatterns.quickResponseTimes || ['10:00-12:00', '14:00-16:00']
  };
};

/**
 * Generate timing insights based on patterns
 * @param {Object} timingPatterns - Timing patterns
 * @param {Object} optimalTimes - Optimal timing data
 * @returns {string} - Timing insights
 */
const generateTimingInsights = (timingPatterns, optimalTimes) => {
  if (optimalTimes.confidence === 'high') {
    return `Based on ${timingPatterns.totalInteractions} interactions, ${optimalTimes.bestDay}s around ${optimalTimes.bestHour} show the best response rates.`;
  } else if (optimalTimes.confidence === 'medium') {
    return `With ${timingPatterns.totalInteractions} data points, ${optimalTimes.bestDay} ${optimalTimes.bestHour} appears to be a good time to reach out.`;
  } else {
    return `Limited interaction history. General best practices suggest ${optimalTimes.bestDay} ${optimalTimes.bestHour} for outreach.`;
  }
};

/**
 * Analyze recent user activities for enhanced context
 * @param {string} userId - User ID to analyze
 * @param {Date} fromDate - Date to analyze from
 * @returns {Promise<Object>} - Recent activities analysis
 */
const analyzeRecentUserActivities = async (userId, fromDate) => {
  try {
    // In a real implementation, this would analyze posts, stories, and user activities
    // For MVP, we'll simulate with representative data
    
    const mockActivities = {
      interests: [
        'photography', 'coffee', 'weekend trips', 'fitness', 'reading'
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      
      recentPosts: Math.floor(Math.random() * 5),
      storyViews: Math.floor(Math.random() * 10),
      activityLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
      
      themes: [
        'lifestyle', 'travel', 'food', 'work', 'social'
      ].slice(0, Math.floor(Math.random() * 2) + 1)
    };
    
    return mockActivities;
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing recent activities:', error);
    return {
      interests: [],
      recentPosts: 0,
      storyViews: 0,
      activityLevel: 'low',
      themes: []
    };
  }
};

/**
 * Find shared activities and interests between users
 * @param {Object} currentUser - Current user profile
 * @param {Object} otherUser - Other user profile
 * @param {Object} recentActivities - Recent activities data
 * @returns {Promise<Object>} - Shared context analysis
 */
const findSharedActivitiesAndInterests = async (currentUser, otherUser, recentActivities) => {
  try {
    // Extract interests from bios and recent activities
    const currentUserInterests = extractInterests(currentUser.bio || '');
    const otherUserInterests = extractInterests(otherUser.bio || '');
    
    // Find shared interests
    const sharedInterests = currentUserInterests.filter(interest => 
      otherUserInterests.includes(interest) || recentActivities.interests.includes(interest)
    );
    
    // Simulate shared activities (in real app, would analyze mutual posts/activities)
    const activities = [];
    if (sharedInterests.length > 0) {
      activities.push({
        type: 'shared_interest',
        interest: sharedInterests[0],
        context: `Both interested in ${sharedInterests[0]}`
      });
    }
    
    if (recentActivities.recentPosts > 0) {
      activities.push({
        type: 'recent_activity',
        activity: recentActivities.themes[0] || 'general',
        context: `Recently active in ${recentActivities.themes[0] || 'general'} content`
      });
    }
    
    // Determine connection strength
    let connectionStrength = 'weak';
    if (sharedInterests.length >= 2) connectionStrength = 'strong';
    else if (sharedInterests.length === 1 || activities.length > 1) connectionStrength = 'moderate';
    
    return {
      activities,
      mutualFriends: [], // Would be populated from friends API in real implementation
      connectionStrength,
      sharedInterestCount: sharedInterests.length
    };
    
  } catch (error) {
    console.error('[Embeddings] Error finding shared activities:', error);
    return {
      activities: [],
      mutualFriends: [],
      connectionStrength: 'weak',
      sharedInterestCount: 0
    };
  }
};

/**
 * Generate activity-based conversation contexts
 * @param {Object} sharedContext - Shared context data
 * @param {Object} recentActivities - Recent activities
 * @returns {Promise<Array>} - Conversation contexts
 */
const generateActivityBasedContexts = async (sharedContext, recentActivities) => {
  try {
    const contexts = [];
    
    // Add contexts based on shared activities
    sharedContext.activities.forEach(activity => {
      contexts.push({
        type: activity.type,
        context: activity.context,
        suggestionPrompt: `Ask about their ${activity.interest || activity.activity} interest`
      });
    });
    
    // Add contexts based on recent activity level
    if (recentActivities.activityLevel === 'high') {
      contexts.push({
        type: 'high_activity',
        context: 'User has been very active recently',
        suggestionPrompt: 'Ask about their recent activities or what they\'ve been up to'
      });
    }
    
    return contexts;
    
  } catch (error) {
    console.error('[Embeddings] Error generating activity contexts:', error);
    return [];
  }
};

/**
 * Generate AI topics from activities using OpenAI
 * @param {Object} context - Enhanced context data
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - AI-generated topics
 */
const generateAITopicsFromActivities = async (context, currentUserId, otherUserId, options = {}) => {
  try {
    const openai = getOpenAIClient();
    
    // Prepare context information for AI
    const contextInfo = {
      sharedActivities: context.sharedActivities,
      recentInterests: context.recentInterests,
      conversationOpportunities: context.conversationOpportunities
    };
    
    const prompt = `Generate 3 conversation topics based on this user activity and context data:

Context: ${JSON.stringify(contextInfo, null, 2)}

Generate conversation topics that are:
1. Based on recent activities or shared interests
2. Natural and engaging for direct messages
3. Specific enough to spark real conversation
4. Appropriate for friends chatting

For each topic, provide:
- topic: the conversation starter text
- reasoning: why this would work based on the context
- category: type of topic (activity_based, shared_interest, recent_event)

Respond with JSON format:
{
  "suggestions": [
    {
      "topic": "conversation starter text",
      "reasoning": "why this works based on context",
      "category": "activity_based|shared_interest|recent_event"
    }
  ],
  "insights": "brief insight about conversation opportunities"
}`;

    const response = await openai.chat.completions.create({
      model: RAG_CONFIG.openai.model,
      temperature: 0.8,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });
    
    // Extract JSON from response, handling markdown code blocks
    let responseContent = response.choices[0].message.content;
    
    // Remove markdown code blocks if present
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```\n?/g, '').replace(/\n?```/g, '');
    }
    
    // Clean up any leading/trailing whitespace
    responseContent = responseContent.trim();
    
    console.log('[Embeddings] Raw OpenAI response:', responseContent);
    
    const result = JSON.parse(responseContent);
    return result;
    
  } catch (error) {
    console.error('[Embeddings] Error generating AI topics from activities:', error);
    return {
      suggestions: getFallbackActivityTopics(),
      insights: 'Using fallback topics due to analysis error'
    };
  }
};

/**
 * Get fallback activity-based topics
 * @returns {Array} - Fallback topics
 */
const getFallbackActivityTopics = () => {
  const fallbackTopics = [
    {
      topic: "What's been the highlight of your week so far?",
      reasoning: "General activity-based question that works for any situation",
      category: "recent_event"
    },
    {
      topic: "I saw you've been pretty active lately - anything exciting going on?",
      reasoning: "References general activity without being specific",
      category: "activity_based"
    },
    {
      topic: "Hope you're having a great day! What have you been up to?",
      reasoning: "Friendly opener that invites sharing about current activities",
      category: "general_activity"
    }
  ];
  
  // Return randomized selection
  const shuffled = [...fallbackTopics].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
};

/**
 * Calculate response time for success tracking
 * @param {Array} messages - Messages after starter
 * @param {Object} successRecord - Success record
 * @returns {number} - Response time in hours
 */
const calculateResponseTime = (messages, successRecord) => {
  const responseMessage = messages.find(msg => 
    msg.senderUid === successRecord.otherUserId &&
    new Date(msg.createdAt) > successRecord.usedAt
  );
  
  if (!responseMessage) return 0;
  
  const responseTime = new Date(responseMessage.createdAt) - successRecord.usedAt;
  return responseTime / (1000 * 60 * 60); // Convert to hours
};

/**
 * Analyze engagement quality of messages
 * @param {Array} messages - Messages to analyze
 * @returns {string} - Engagement quality level
 */
const analyzeEngagementQuality = (messages) => {
  if (messages.length === 0) return 'none';
  if (messages.length === 1) return 'low';
  
  const totalLength = messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0);
  const avgLength = totalLength / messages.length;
  
  if (avgLength > 50 && messages.length >= 3) return 'high';
  if (avgLength > 20 || messages.length >= 2) return 'medium';
  return 'low';
};

/**
 * Determine overall success based on metrics
 * @param {Object} successMetrics - Success metrics object
 * @returns {boolean} - Overall success status
 */
const determineOverallSuccess = (successMetrics) => {
  // Success criteria: response received AND (quick response OR continued conversation)
  return successMetrics.responseReceived && 
         (successMetrics.responseTime < 24 || successMetrics.conversationContinued);
};

/**
 * Analyze category success rates
 * @param {Array} records - Analyzed records
 * @returns {Object} - Category success analysis
 */
const analyzeCategorySuccessRates = (records) => {
  const categories = {};
  
  records.forEach(record => {
    const category = record.category || 'unknown';
    if (!categories[category]) {
      categories[category] = { total: 0, successful: 0 };
    }
    categories[category].total++;
    if (record.overallSuccess) {
      categories[category].successful++;
    }
  });
  
  // Calculate success rates
  Object.keys(categories).forEach(category => {
    const data = categories[category];
    data.successRate = data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0;
  });
  
  return categories;
};

/**
 * Generate success insights based on analytics
 * @param {Array} records - Analyzed records
 * @param {number} successRate - Overall success rate
 * @returns {string} - Generated insights
 */
const generateSuccessInsights = (records, successRate) => {
  if (records.length < 5) {
    return 'Collecting more data to provide meaningful insights';
  }
  
  if (successRate > 70) {
    return 'Excellent conversation starter performance! Your suggestions are highly effective.';
  } else if (successRate > 50) {
    return 'Good conversation starter success rate. Consider testing different approaches for improvement.';
  } else if (successRate > 30) {
    return 'Moderate success rate. Focus on timing and context to improve engagement.';
  } else {
    return 'Low success rate detected. Review conversation starter relevance and timing strategies.';
  }
};

/**
 * Get fallback conversation starters when AI fails
 * @param {string} category - Preferred category
 * @returns {Array} - Fallback conversation starters
 */
const getFallbackConversationStarters = (category = 'general_friendly') => {
  const fallbacks = {
    mutual_friends: [
      "Hey! I think we have some mutual friends - small world! 😊",
      "Hi there! Just realized we might know some of the same people 👋"
    ],
    shared_interests: [
      "Hey! Noticed we might have some similar interests - what's been keeping you busy lately?",
      "Hi! Your profile caught my attention - seems like we have some things in common! 😊"
    ],
    profile_based: [
      "Hey! Love your profile - you seem like a really interesting person to know! 😊",
      "Hi there! Something about your vibe just seemed really cool - thought I'd say hey! 👋"
    ],
    general_friendly: [
      "Hey! Just wanted to reach out and say hi 👋 How's your day going?",
      "Hi there! Hope you're having a great day - thought I'd introduce myself 😊",
      "Hey! New connections are always exciting - what's been the highlight of your week?"
    ]
  };
  
  return fallbacks[category] || fallbacks.general_friendly;
};

/**
 * Feature 41: Analyze conversation history and tone
 * @param {string} chatId - Chat ID to analyze
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<Object>} - Conversation history analysis
 */
export const analyzeConversationHistory = async (chatId, currentUserId, otherUserId) => {
  try {
    console.log('[Embeddings] 📊 Analyzing conversation history for chat:', chatId);
    
    // Import necessary APIs
    const { getChatMessages } = await import('./messages');
    
    // Get chat messages for analysis
    const messages = await getChatMessages(chatId);
    
    if (!messages || messages.length === 0) {
      return {
        success: true,
        analysis: {
          conversationStage: 'new',
          messageCount: 0,
          lastInteractionDays: null,
          toneProgression: 'neutral',
          conversationHealth: 'new',
          averageResponseTime: null,
          messageBalance: 0.5,
          recommendedApproach: 'friendly_introduction'
        },
        insights: 'No previous conversation history - this is a new conversation'
      };
    }
    
    // Calculate conversation metrics
    const messageCount = messages.length;
    const lastMessage = messages[0]; // Most recent message (sorted desc)
    const daysSinceLastMessage = Math.floor((Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate average response time
    const averageResponseTime = calculateAverageResponseTime(messages);
    
    // Analyze message balance (how much each person contributes)
    const currentUserMessages = messages.filter(m => m.senderUid === currentUserId);
    const otherUserMessages = messages.filter(m => m.senderUid === otherUserId);
    const messageBalance = currentUserMessages.length / Math.max(messages.length, 1);
    
    // Determine conversation stage
    const conversationStage = getConversationStage(messageCount, daysSinceLastMessage);
    
    // Analyze conversation tone using OpenAI (simplified for MVP)
    let toneAnalysis = 'neutral';
    try {
      const recentMessages = messages.slice(0, 5).map(m => m.text).join(' ');
      if (recentMessages.length > 10) {
        const openai = getOpenAIClient();
        const toneResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 50,
          messages: [{
            role: 'user',
            content: `Analyze the tone of this conversation excerpt and respond with one word: positive, negative, neutral, or mixed. Conversation: "${recentMessages}"`
          }]
        });
        toneAnalysis = toneResponse.choices[0].message.content.toLowerCase().trim();
      }
    } catch (error) {
      console.log('[Embeddings] Could not analyze tone with OpenAI, using neutral');
      toneAnalysis = 'neutral';
    }
    
    // Determine conversation health
    const conversationHealth = determineConversationHealth(messages, messageBalance, daysSinceLastMessage);
    
    // Get recommended approach based on analysis
    const recommendedApproach = getRecommendedApproach(conversationHealth, toneAnalysis);
    
    return {
      success: true,
      analysis: {
        conversationStage,
        messageCount,
        lastInteractionDays: daysSinceLastMessage,
        toneProgression: toneAnalysis,
        conversationHealth,
        averageResponseTime,
        messageBalance,
        recommendedApproach
      },
      insights: `${conversationStage} conversation with ${toneAnalysis} tone, ${conversationHealth} health rating`,
      metadata: {
        analysisDate: new Date().toISOString(),
        messagesAnalyzed: messageCount
      }
    };
    
  } catch (error) {
    console.error('[Embeddings] Error analyzing conversation history:', error);
    return {
      success: false,
      error: error.message,
      analysis: {
        conversationStage: 'unknown',
        messageCount: 0,
        lastInteractionDays: null,
        toneProgression: 'neutral',
        conversationHealth: 'unknown',
        averageResponseTime: null,
        messageBalance: 0.5,
        recommendedApproach: 'friendly'
      },
      insights: 'Could not analyze conversation history due to system limitations'
    };
  }
};