/**
 * Utility to wrap RAG operations with notification handling
 */

/**
 * Wraps a RAG operation with automatic notification handling
 * @param {Function} operation - The async operation to wrap
 * @param {Object} notificationHandlers - Notification handlers from useRAGNotification
 * @param {string} operationId - Unique ID for this operation
 * @param {string} message - Message to display during operation
 * @returns {Promise} - Result of the wrapped operation
 */
export const withRAGNotification = async (
  operation,
  notificationHandlers,
  operationId,
  message
) => {
  const { startOperation, endOperation, updateOperationMessage } = notificationHandlers;
  
  try {
    // Start the notification
    startOperation(operationId, message);
    
    // Execute the operation
    const result = await operation();
    
    // Update message on success
    updateOperationMessage(operationId, 'AI knowledge updated');
    
    return result;
  } catch (error) {
    // Update message on error
    updateOperationMessage(operationId, 'Update failed');
    throw error;
  } finally {
    // End the notification after a short delay
    setTimeout(() => {
      endOperation(operationId);
    }, 500);
  }
};

/**
 * Common operation messages for consistency
 */
export const RAG_OPERATION_MESSAGES = {
  CAPTION_GENERATION: 'Analyzing image for captions...',
  TEXT_OVERLAY: 'Generating text overlay suggestions...',
  FILTER_RECOMMENDATIONS: 'Analyzing for filter recommendations...',
  USER_RECOMMENDATIONS: 'Finding personalized recommendations...',
  PROFILE_UPDATE: 'Updating AI understanding of your profile...',
  STORY_DISCOVERY: 'Discovering interesting stories...',
  CONVERSATION_STARTERS: 'Generating conversation ideas...',
  IMAGE_ANALYSIS: 'Analyzing image content...',
  CONTENT_INDEXING: 'Indexing content for search...',
}; 