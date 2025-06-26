import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Dimensions, 
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';

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
  style 
}) => {
  const [textOverlays, setTextOverlays] = useState([]);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [currentText, setCurrentText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('normal');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedTextId, setSelectedTextId] = useState(null);

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

  // Render add text button
  const renderAddTextButton = () => {
    return (
      <TouchableOpacity
        style={styles.addTextButton}
        onPress={() => setShowTextEditor(true)}
      >
        <Ionicons name="text" size={24} color={Colors.white} />
        <Text style={styles.addTextButtonText}>Text</Text>
      </TouchableOpacity>
    );
  };

  if (!isEnabled) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Render existing text overlays */}
      {textOverlays.map(renderTextOverlay)}

      {/* Add text button */}
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
  addTextButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
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
});

export default TextOverlayTools; 