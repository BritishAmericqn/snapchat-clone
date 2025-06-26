import React, { useRef } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const ImageComposer = React.forwardRef(({ 
  mediaUri, 
  textOverlays = [], 
  style,
  onCompositionComplete,
  onCompositionError
}, ref) => {
  const composerRef = useRef();

  // Capture the composed view as an image
  const captureComposition = async () => {
    try {
      console.log('[ImageComposer] Starting composition capture...');
      
      // Capture the view as an image
      const compositeUri = await captureRef(composerRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile', // Save to temp file for better performance
      });
      
      console.log('[ImageComposer] Composition captured:', compositeUri);
      
      if (onCompositionComplete) {
        onCompositionComplete(compositeUri);
      }
      
      return compositeUri;
    } catch (error) {
      console.error('[ImageComposer] Composition capture failed:', error);
      
      if (onCompositionError) {
        onCompositionError(error);
      }
      
      throw error;
    }
  };

  // Expose capture method to parent
  React.useImperativeHandle(ref, () => ({
    captureComposition
  }));

  return (
    <View 
      ref={composerRef}
      style={[styles.container, style]}
      collapsable={false} // Important for view-shot to work properly
    >
      {/* Base Image */}
      <Image 
        source={{ uri: mediaUri }} 
        style={styles.baseImage}
        resizeMode="cover"
      />
      
      {/* Text Overlays */}
      {textOverlays.map((overlay) => {
        // Ensure we have valid overlay data
        if (!overlay || !overlay.text || !overlay.position) {
          return null;
        }

        // Build text style from overlay data
        const textStyle = {
          position: 'absolute',
          left: overlay.position.x,
          top: overlay.position.y,
          fontSize: overlay.style?.fontSize || 24,
          fontWeight: overlay.style?.fontWeight || '400',
          color: overlay.color || '#FFFFFF',
          backgroundColor: overlay.style?.backgroundColor || 'transparent',
          paddingHorizontal: overlay.style?.paddingHorizontal || 0,
          paddingVertical: overlay.style?.paddingVertical || 0,
          borderRadius: overlay.style?.borderRadius || 0,
          textAlign: 'center',
          maxWidth: 250, // Prevent text from being too wide
        };

        // Add text shadow for outline style
        if (overlay.style?.id === 'outline') {
          textStyle.textShadowOffset = { width: -2, height: -2 };
          textStyle.textShadowRadius = 1;
          textStyle.textShadowColor = '#000000';
          textStyle.elevation = 4; // Android shadow
          textStyle.shadowOpacity = 0.8; // iOS shadow
        }

        return (
          <Text
            key={overlay.id}
            style={textStyle}
            numberOfLines={3} // Prevent extremely long text
          >
            {overlay.text}
          </Text>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000000', // Black background for composition
  },
  baseImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImageComposer; 