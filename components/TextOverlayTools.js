import React, { useState, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';
import { generateTextOverlaySuggestions } from '../api';
import { AuthenticatedUserContext } from '../providers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fixed media container dimensions (from MediaPreviewScreen)
const MEDIA_CONTAINER_WIDTH = SCREEN_WIDTH;
const MEDIA_CONTAINER_HEIGHT = 300;

// Enhanced text style presets with more visual distinction
const TEXT_STYLES = {
  normal: {
    id: 'normal',
    name: 'Normal',
    fontSize: 24,
    fontWeight: '400',
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  bold: {
    id: 'bold', 
    name: 'Bold',
    fontSize: 32,  // Increased from 28 for more distinction
    fontWeight: '800',  // Increased from 700 for more distinction
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  outline: {
    id: 'outline',
    name: 'Outline',
    fontSize: 28,  // Increased from 26
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    // Enhanced outline effect using multiple shadows
    textShadowColor: '#000000',
    textShadowOffset: { width: -1, height: -1 },
    textShadowRadius: 1,
    // Note: React Native doesn't support stroke, so we'll use enhanced shadow
    elevation: 4,  // Android shadow
    shadowColor: '#000000',  // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  background: {
    id: 'background',
    name: 'Background',
    fontSize: 26,  // Increased from 24
    fontWeight: '600',  // Increased from 500
    textAlign: 'center',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,  // Increased from 12
    paddingVertical: 8,     // Increased from 6
    borderRadius: 12,       // Increased from 8
    overflow: 'hidden',
  },
};

// Color options
const COLOR_OPTIONS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF8000', // Orange
  '#8000FF', // Purple
];

export const TextOverlayTools = ({ 
  isEnabled = true,
  onTextAdded,
  onTextUpdated,
  onTextRemoved,
  imageUri, // Add imageUri prop for AI suggestions
  style 
}) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [textOverlays, setTextOverlays] = useState([]);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [currentText, setCurrentText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('normal');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedTextId, setSelectedTextId] = useState(null);

  // AI Text Suggestions State
  const [isGeneratingAISuggestions, setIsGeneratingAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Track initial positions for drag gestures
  const gestureState = useRef({});

  // Generate unique ID for text overlays
  const generateTextId = () => `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new text overlay
  const addTextOverlay = () => {
    const newTextId = generateTextId();
    const newTextOverlay = {
      id: newTextId,
      text: currentText.trim() || 'Tap to edit',
      style: { ...TEXT_STYLES[selectedStyle] },
      color: selectedColor,
      position: {
        // Position relative to media container, not screen
        x: MEDIA_CONTAINER_WIDTH / 2,
        y: MEDIA_CONTAINER_HEIGHT / 2,
      },
      isSelected: false,
    };

    // Apply color to style
    newTextOverlay.style.color = selectedColor;

    setTextOverlays(prev => [...prev, newTextOverlay]);
    setCurrentText('');
    setShowTextEditor(false);

    // Notify parent component
    if (onTextAdded) {
      onTextAdded(newTextOverlay);
    }

    console.log('[TextOverlayTools] Added text overlay:', newTextOverlay);
  };

  // Update existing text overlay
  const updateTextOverlay = (id, updates) => {
    setTextOverlays(prev => 
      prev.map(overlay => 
        overlay.id === id 
          ? { ...overlay, ...updates }
          : overlay
      )
    );

    // Notify parent component
    if (onTextUpdated) {
      const updatedOverlay = textOverlays.find(o => o.id === id);
      if (updatedOverlay) {
        onTextUpdated({ ...updatedOverlay, ...updates });
      }
    }
  };

  // Remove text overlay
  const removeTextOverlay = (id) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    
    // Notify parent component
    if (onTextRemoved) {
      onTextRemoved(id);
    }

    console.log('[TextOverlayTools] Removed text overlay:', id);
  };

  // Handle text overlay tap
  const handleTextOverlayTap = (id) => {
    const overlay = textOverlays.find(o => o.id === id);
    if (overlay) {
      setEditingTextId(id);
      setCurrentText(overlay.text);
      setSelectedStyle(overlay.style.id || 'normal');
      setSelectedColor(overlay.color);
      setShowTextEditor(true);
    }
  };

  // Fixed drag gesture handler
  const handleTextOverlayDrag = (id, gestureEvent) => {
    const { translationX, translationY, state } = gestureEvent.nativeEvent;
    
    const overlay = textOverlays.find(o => o.id === id);
    if (!overlay) return;

    if (state === State.BEGAN) {
      // Store initial position when gesture begins
      gestureState.current[id] = {
        initialX: overlay.position.x,
        initialY: overlay.position.y,
      };
    } else if (state === State.ACTIVE && gestureState.current[id]) {
      // Calculate new position by adding translation to initial position
      const { initialX, initialY } = gestureState.current[id];
      
      // Constrain movement within media container bounds
      const newX = Math.max(50, Math.min(MEDIA_CONTAINER_WIDTH - 50, initialX + translationX));
      const newY = Math.max(20, Math.min(MEDIA_CONTAINER_HEIGHT - 20, initialY + translationY));
      
      updateTextOverlay(id, {
        position: {
          x: newX,
          y: newY,
        }
      });
    } else if (state === State.END || state === State.CANCELLED) {
      // Clean up gesture state
      delete gestureState.current[id];
    }
  };

  // Save text changes
  const saveTextChanges = () => {
    if (editingTextId) {
      // Update existing text
      updateTextOverlay(editingTextId, {
        text: currentText.trim() || 'Tap to edit',
        style: { ...TEXT_STYLES[selectedStyle], color: selectedColor },
        color: selectedColor,
      });
      setEditingTextId(null);
    } else {
      // Add new text
      addTextOverlay();
    }
    
    setCurrentText('');
    setShowTextEditor(false);
  };

  // Cancel text editing
  const cancelTextEdit = () => {
    setCurrentText('');
    setEditingTextId(null);
    setShowTextEditor(false);
  };

  // Render text overlay with enhanced styling
  const renderTextOverlay = (overlay) => {
    // Create enhanced outline style for outline text
    const textStyle = overlay.style.id === 'outline' ? {
      ...overlay.style,
      color: overlay.color,
      // Multiple shadows to create outline effect
      textShadowColor: '#000000',
      textShadowOffset: { width: -2, height: -2 },
      textShadowRadius: 1,
    } : {
      ...overlay.style,
      color: overlay.color,
    };

    return (
      <PanGestureHandler
        key={overlay.id}
        onGestureEvent={(event) => handleTextOverlayDrag(overlay.id, event)}
        onHandlerStateChange={(event) => handleTextOverlayDrag(overlay.id, event)}
      >
        <View
          style={[
            styles.textOverlay,
            {
              left: overlay.position.x - 50, // Center the text
              top: overlay.position.y - 15,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => handleTextOverlayTap(overlay.id)}
            onLongPress={() => removeTextOverlay(overlay.id)}
            activeOpacity={0.8}
          >
            <Text style={textStyle}>
              {overlay.text}
            </Text>
          </TouchableOpacity>

          {/* Delete button for selected text */}
          {selectedTextId === overlay.id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeTextOverlay(overlay.id)}
            >
              <Ionicons name="close-circle" size={20} color="#FF0000" />
            </TouchableOpacity>
          )}
        </View>
      </PanGestureHandler>
    );
  };

  // Render text editor modal
  const renderTextEditor = () => {
    return (
      <Modal
        visible={showTextEditor}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelTextEdit}
      >
        <View style={styles.modalContainer}>
          <View style={styles.textEditorContainer}>
            <Text style={styles.editorTitle}>
              {editingTextId ? 'Edit Text' : 'Add Text'}
            </Text>

            {/* Text input */}
            <TextInput
              style={styles.textInput}
              value={currentText}
              onChangeText={setCurrentText}
              placeholder="Enter text..."
              placeholderTextColor="#999"
              multiline
              autoFocus
            />

            {/* Style options */}
            <Text style={styles.optionLabel}>Style:</Text>
            <View style={styles.styleOptions}>
              {Object.values(TEXT_STYLES).map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleButton,
                    selectedStyle === style.id && styles.styleButtonActive
                  ]}
                  onPress={() => setSelectedStyle(style.id)}
                >
                  <Text style={[
                    styles.styleButtonText,
                    selectedStyle === style.id && styles.styleButtonTextActive
                  ]}>
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color options */}
            <Text style={styles.optionLabel}>Color:</Text>
            <View style={styles.colorOptions}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorButtonActive
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={cancelTextEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveTextChanges}
              >
                <Text style={styles.saveButtonText}>
                  {editingTextId ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // AI Text Suggestion Functions
  const handleGenerateAISuggestions = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Image required for AI text suggestions');
      return;
    }

    try {
      setIsGeneratingAISuggestions(true);
      console.log('[TextOverlayTools] Generating AI text suggestions for image:', imageUri);
      
      const result = await generateTextOverlaySuggestions(
        imageUri,
        user.uid,
        { style: 'mixed' }
      );
      
      console.log('[TextOverlayTools] 🎯 AI Text Suggestions Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.suggestions) {
        setAiSuggestions(result.suggestions);
        setAiAnalysis(result.analysis);
        setShowAISuggestions(true);
        console.log('[TextOverlayTools] ✅ Generated AI text suggestions:', result.suggestions);
      } else {
        // Use fallback suggestions if API fails
        setAiSuggestions(result.suggestions || []);
        setAiAnalysis(result.analysis || 'Analysis unavailable');
        setShowAISuggestions(true);
        console.log('[TextOverlayTools] ⚠️ Using fallback AI text suggestions:', result.suggestions);
      }
    } catch (error) {
      console.error('[TextOverlayTools] Error generating AI text suggestions:', error);
      Alert.alert(
        'AI Suggestions Failed',
        'Unable to generate smart text suggestions. Please try again or add text manually.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGeneratingAISuggestions(false);
    }
  };

  const handleSelectAISuggestion = (suggestion) => {
    // Convert API percentage coordinates to container coordinates
    const suggestedX = (suggestion.position.x / 100) * MEDIA_CONTAINER_WIDTH;
    const suggestedY = (suggestion.position.y / 100) * MEDIA_CONTAINER_HEIGHT;
    
    // Constrain within bounds
    const finalX = Math.max(50, Math.min(MEDIA_CONTAINER_WIDTH - 50, suggestedX));
    const finalY = Math.max(20, Math.min(MEDIA_CONTAINER_HEIGHT - 20, suggestedY));

    // Map AI style to text overlay style
    const styleMap = {
      'motivational': 'bold',
      'aesthetic': 'normal',
      'descriptive': 'background',
      'minimal': 'outline'
    };
    
    const textStyle = styleMap[suggestion.style] || 'normal';

    const newTextId = generateTextId();
    const newTextOverlay = {
      id: newTextId,
      text: suggestion.text,
      style: { ...TEXT_STYLES[textStyle] },
      color: '#FFFFFF', // Default to white, user can change
      position: {
        x: finalX,
        y: finalY,
      },
      isSelected: false,
      aiGenerated: true, // Mark as AI generated
      aiStyle: suggestion.style,
      aiReasoning: suggestion.position.reasoning,
    };

    // Apply color to style
    newTextOverlay.style.color = '#FFFFFF';

    setTextOverlays(prev => [...prev, newTextOverlay]);
    setShowAISuggestions(false);

    // Notify parent component
    if (onTextAdded) {
      onTextAdded(newTextOverlay);
    }

    console.log('[TextOverlayTools] Added AI-suggested text overlay:', newTextOverlay);
    console.log('[TextOverlayTools] AI reasoning:', suggestion.position.reasoning);
  };

  const handleDismissAISuggestions = () => {
    setShowAISuggestions(false);
  };

  // Render AI suggestion chips
  const renderAISuggestions = () => {
    if (!showAISuggestions || aiSuggestions.length === 0) return null;

    return (
      <View style={styles.aiSuggestionsContainer}>
        <View style={styles.aiSuggestionsHeader}>
          <View style={styles.aiSuggestionsTitle}>
            <Ionicons name="sparkles" size={16} color={Colors.snapYellow} />
            <Text style={styles.aiSuggestionsText}>AI Text Suggestions</Text>
          </View>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismissAISuggestions}
          >
            <Ionicons name="close" size={16} color={Colors.lightGray} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
        >
          {aiSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionChip,
                styles[`suggestionChip${suggestion.style.charAt(0).toUpperCase() + suggestion.style.slice(1)}`]
              ]}
              onPress={() => handleSelectAISuggestion(suggestion)}
            >
              <Text style={styles.suggestionText}>
                {suggestion.text}
              </Text>
              <View style={styles.suggestionMeta}>
                <Text style={styles.suggestionStyle}>
                  {suggestion.style}
                </Text>
                <Ionicons name="add-circle" size={16} color={Colors.snapYellow} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {aiAnalysis && (
          <Text style={styles.aiAnalysisText}>
            💡 {aiAnalysis}
          </Text>
        )}
      </View>
    );
  };

  // Update add text button to include AI suggestions
  const renderAddTextButton = () => {
    return (
      <View style={styles.addTextButtonContainer}>
        {/* AI Suggest Button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.addTextButton, styles.aiSuggestButton]}
            onPress={handleGenerateAISuggestions}
            disabled={isGeneratingAISuggestions}
          >
            {isGeneratingAISuggestions ? (
              <ActivityIndicator size="small" color={Colors.snapYellow} />
            ) : (
              <Ionicons name="sparkles" size={20} color={Colors.snapYellow} />
            )}
            <Text style={styles.aiSuggestButtonText}>
              {isGeneratingAISuggestions ? 'AI...' : '✨ AI Suggest'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Manual Text Button */}
        <TouchableOpacity
          style={styles.addTextButton}
          onPress={() => setShowTextEditor(true)}
        >
          <Ionicons name="text" size={24} color={Colors.white} />
          <Text style={styles.addTextButtonText}>Text</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isEnabled) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Render existing text overlays */}
      {textOverlays.map(renderTextOverlay)}

      {/* AI Suggestions */}
      {renderAISuggestions()}

      {/* Add text buttons */}
      {renderAddTextButton()}

      {/* Text editor modal */}
      {renderTextEditor()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textOverlay: {
    position: 'absolute',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  addTextButtonContainer: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  addTextButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTextButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  aiSuggestButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSuggestButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textEditorContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.black,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: Colors.black,
  },
  styleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  styleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleButtonActive: {
    backgroundColor: Colors.snapYellow,
    borderColor: Colors.black,
  },
  styleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  styleButtonTextActive: {
    color: Colors.black,
    fontWeight: '600',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: Colors.black,
    borderWidth: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: Colors.snapYellow,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
     aiSuggestionsContainer: {
     position: 'absolute',
     top: 20,
     left: 15,
     right: 15,
     backgroundColor: 'rgba(0, 0, 0, 0.85)',
     borderRadius: 12,
     padding: 15,
     maxHeight: 200,
   },
   aiSuggestionsHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 10,
   },
   aiSuggestionsTitle: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   aiSuggestionsText: {
     fontSize: 16,
     fontWeight: '600',
     color: Colors.white,
     marginLeft: 8,
   },
   dismissButton: {
     padding: 5,
   },
   suggestionsScroll: {
     marginBottom: 10,
   },
   suggestionChip: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 16,
     marginRight: 8,
     borderWidth: 1,
     borderColor: 'rgba(255, 252, 0, 0.3)',
     minWidth: 100,
   },
   suggestionChipMotivational: {
     borderColor: '#FF6B6B',
     backgroundColor: 'rgba(255, 107, 107, 0.1)',
   },
   suggestionChipAesthetic: {
     borderColor: '#4ECDC4',
     backgroundColor: 'rgba(78, 205, 196, 0.1)',
   },
   suggestionChipDescriptive: {
     borderColor: '#45B7D1',
     backgroundColor: 'rgba(69, 183, 209, 0.1)',
   },
   suggestionChipMinimal: {
     borderColor: '#96CEB4',
     backgroundColor: 'rgba(150, 206, 180, 0.1)',
   },
   suggestionText: {
     fontSize: 14,
     fontWeight: '500',
     color: Colors.white,
     textAlign: 'center',
     marginBottom: 4,
   },
   suggestionMeta: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
   },
   suggestionStyle: {
     fontSize: 11,
     fontWeight: '400',
     color: Colors.lightGray,
     textTransform: 'capitalize',
   },
   aiAnalysisText: {
     color: Colors.lightGray,
     fontSize: 12,
     fontStyle: 'italic',
     textAlign: 'center',
   },
});

export default TextOverlayTools; 