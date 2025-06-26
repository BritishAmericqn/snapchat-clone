import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { createPost } from '../api';
import { TextOverlayTools, ImageComposer } from '../components';

export const MediaPreviewScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const { media } = route.params;
  
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [deleteOnView, setDeleteOnView] = useState(false);
  const [expiresIn, setExpiresIn] = useState(24); // hours
  const [isPosting, setIsPosting] = useState(false);
  
  // Text overlay state
  const [textOverlaysEnabled, setTextOverlaysEnabled] = useState(false);
  const [textOverlays, setTextOverlays] = useState([]);
  
  // Refs for image composition
  const imageComposerRef = useRef(null);

  const handlePost = async () => {
    try {
      setIsPosting(true);
      
      let finalMediaUri = media.uri;
      
      // If there are text overlays, compose them into the image
      if (textOverlays.length > 0 && imageComposerRef.current) {
        console.log('[MediaPreview] Composing image with text overlays...');
        try {
          const compositeUri = await imageComposerRef.current.captureComposition();
          finalMediaUri = compositeUri;
          console.log('[MediaPreview] Using composite image:', compositeUri);
        } catch (compositionError) {
          console.error('[MediaPreview] Image composition failed:', compositionError);
          Alert.alert(
            'Warning', 
            'Failed to apply text overlays. Posting original image instead.',
            [{ text: 'Continue', style: 'default' }]
          );
          // Continue with original image if composition fails
        }
      }
      
      const postData = {
        mediaUri: finalMediaUri, // Use composite image if available
        mediaType: media.type,
        caption,
        visibility,
        expiresIn: expiresIn * 60 * 60 * 1000, // Convert hours to milliseconds
        deleteOnView,
        // No longer save textOverlays separately - they're burned into the image
      };
      
      const postId = await createPost(user.uid, postData);
      console.log('[MediaPreview] Post created:', postId);
      
      Alert.alert(
        'Success',
        'Your snap has been posted!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to MainPager (the new main screen)
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainPager' }],
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error('[MediaPreview] Error posting:', error);
      Alert.alert('Error', 'Failed to post snap. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Handle text overlay callbacks
  const handleTextAdded = (textOverlay) => {
    setTextOverlays(prev => [...prev, textOverlay]);
    console.log('[MediaPreview] Text overlay added:', textOverlay);
  };

  const handleTextUpdated = (updatedOverlay) => {
    setTextOverlays(prev => 
      prev.map(overlay => 
        overlay.id === updatedOverlay.id ? updatedOverlay : overlay
      )
    );
    console.log('[MediaPreview] Text overlay updated:', updatedOverlay);
  };

  const handleTextRemoved = (overlayId) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== overlayId));
    console.log('[MediaPreview] Text overlay removed:', overlayId);
  };

  const toggleTextOverlays = () => {
    setTextOverlaysEnabled(!textOverlaysEnabled);
    console.log('[MediaPreview] Text overlays toggled:', !textOverlaysEnabled);
  };

  const visibilityOptions = [
    { value: 'friends', label: 'Friends Only', icon: 'people' },
    { value: 'friendsOfFriends', label: 'Friends of Friends', icon: 'people-circle' },
    { value: 'public', label: 'Public', icon: 'globe' },
  ];

  const expirationOptions = [
    { value: 1, label: '1 hour' },
    { value: 6, label: '6 hours' },
    { value: 12, label: '12 hours' },
    { value: 24, label: '24 hours' },
    { value: 48, label: '2 days' },
    { value: 168, label: '1 week' },
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>New Snap</Text>
          
          <View style={styles.headerRight}>
            {/* Text Overlay Toggle Button */}
            <TouchableOpacity
              style={[styles.headerButton, textOverlaysEnabled && styles.headerButtonActive]}
              onPress={toggleTextOverlays}
            >
              <Ionicons 
                name="text" 
                size={24} 
                color={textOverlaysEnabled ? Colors.snapYellow : Colors.white} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerButton, styles.postButton]}
              onPress={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color={Colors.black} />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Media Preview Container */}
          <View style={styles.mediaContainer}>
            <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
            
            {/* Text Overlay Tools */}
            {textOverlaysEnabled && (
              <TextOverlayTools
                isEnabled={textOverlaysEnabled}
                onTextAdded={handleTextAdded}
                onTextUpdated={handleTextUpdated}
                onTextRemoved={handleTextRemoved}
                style={styles.textOverlayContainer}
              />
            )}
          </View>
          
          {/* Hidden Image Composer for final composition */}
          <View style={styles.hiddenComposer}>
            <ImageComposer
              ref={imageComposerRef}
              mediaUri={media.uri}
              textOverlays={textOverlays}
              style={styles.composerContainer}
            />
          </View>

          {/* Caption Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor={Colors.lightGray}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
            <Text style={styles.characterCount}>{caption.length}/200</Text>
          </View>

          {/* Visibility Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who can see this?</Text>
            {visibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionRow,
                  visibility === option.value && styles.optionRowSelected,
                ]}
                onPress={() => setVisibility(option.value)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={visibility === option.value ? Colors.snapYellow : Colors.white} 
                  />
                  <Text style={[
                    styles.optionText,
                    visibility === option.value && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {visibility === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.snapYellow} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Ephemeral Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disappear Settings</Text>
            
            {/* Delete on View */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setDeleteOnView(!deleteOnView)}
            >
              <View style={styles.optionLeft}>
                <Ionicons 
                  name="eye-off" 
                  size={24} 
                  color={deleteOnView ? Colors.snapYellow : Colors.white} 
                />
                <Text style={[
                  styles.optionText,
                  deleteOnView && styles.optionTextSelected,
                ]}>
                  Delete after viewing
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, deleteOnView && styles.toggleActive]}
                onPress={() => setDeleteOnView(!deleteOnView)}
              >
                <View style={[styles.toggleThumb, deleteOnView && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Expiration Time */}
            <View style={styles.expirationContainer}>
              <Text style={styles.expirationLabel}>Expires after:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.expirationScroll}
              >
                {expirationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.expirationOption,
                      expiresIn === option.value && styles.expirationOptionSelected,
                    ]}
                    onPress={() => setExpiresIn(option.value)}
                  >
                    <Text style={[
                      styles.expirationOptionText,
                      expiresIn === option.value && styles.expirationOptionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
  },
  postButton: {
    backgroundColor: Colors.snapYellow,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: Colors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.darkGray,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 15,
  },
  captionInput: {
    color: Colors.white,
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: Colors.lightGray,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    color: Colors.white,
    fontSize: 16,
    marginLeft: 12,
  },
  optionTextSelected: {
    color: Colors.snapYellow,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.darkGray,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Colors.snapYellow,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  expirationContainer: {
    marginTop: 20,
  },
  expirationLabel: {
    color: Colors.lightGray,
    fontSize: 14,
    marginBottom: 10,
  },
  expirationScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  expirationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.darkGray,
  },
  expirationOptionSelected: {
    borderColor: Colors.snapYellow,
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
  },
  expirationOptionText: {
    color: Colors.white,
    fontSize: 14,
  },
  expirationOptionTextSelected: {
    color: Colors.snapYellow,
    fontWeight: '600',
  },
  textOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hiddenComposer: {
    position: 'absolute',
    top: -1000, // Hide off-screen
    left: 0,
    width: '100%',
    height: 300, // Same height as media container
  },
  composerContainer: {
    width: '100%',
    height: '100%',
  },
}); 