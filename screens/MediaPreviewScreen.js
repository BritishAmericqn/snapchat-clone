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
import { createPost, generateCaptionSuggestions } from '../api';
import { TextOverlayTools, ImageComposer, VideoPlayer, TagSuggestionSection, FilterOverlay } from '../components';

export const MediaPreviewScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const { media } = route.params;
  
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [deleteOnView, setDeleteOnView] = useState(false);
  const [expiresIn, setExpiresIn] = useState(24); // hours
  const [isPosting, setIsPosting] = useState(false);
  
  // RAG Caption Generation State
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionSuggestions, setCaptionSuggestions] = useState([]);
  const [showCaptionSuggestions, setShowCaptionSuggestions] = useState(false);
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState('casual');
  
  // RAG Tag Suggestions State
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Text overlay state
  const [textOverlaysEnabled, setTextOverlaysEnabled] = useState(false);
  const [textOverlays, setTextOverlays] = useState([]);
  
  // Filter state
  const [filtersEnabled, setFiltersEnabled] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [appliedFilters, setAppliedFilters] = useState([]);
  
  // Refs for image composition
  const imageComposerRef = useRef(null);

  const handlePost = async () => {
    try {
      setIsPosting(true);
      console.log('[MediaPreview] 🚀 Starting post creation...');
      console.log('[MediaPreview] 🎭 Applied filters at post time:', appliedFilters);
      console.log('[MediaPreview] ✏️ Text overlays at post time:', textOverlays);
      
      let finalMediaUri = media.uri;
      
      // Compose text overlays and filters for images (not videos)
      const hasTextOverlays = textOverlays.length > 0;
      const hasFilters = appliedFilters.length > 0; // ✅ FIXED: Use appliedFilters instead of selectedFilter
      
      if ((hasTextOverlays || hasFilters) && imageComposerRef.current && media.type === 'image') {
        const overlayTypes = [];
        if (hasTextOverlays) overlayTypes.push(`${textOverlays.length} text overlays`);
        if (hasFilters) overlayTypes.push(`${appliedFilters.length} filters`);
        
        console.log(`[MediaPreview] 🎨 Composing image with ${overlayTypes.join(' and ')}...`);
        
        // Debug: Check what data is being passed to composer
        const filtersForComposer = getFilterData();
        console.log('[MediaPreview] 🎭 Filters being passed to composer:', filtersForComposer);
        
        try {
          const compositeUri = await imageComposerRef.current.captureComposition();
          finalMediaUri = compositeUri;
          console.log('[MediaPreview] ✅ Using composite image:', compositeUri);
        } catch (compositionError) {
          console.error('[MediaPreview] ❌ Image composition failed:', compositionError);
          Alert.alert(
            'Warning', 
            `Failed to apply ${overlayTypes.join(' and ')}. Posting original image instead.`,
            [{ text: 'Continue', style: 'default' }]
          );
          // Continue with original image if composition fails
        }
      } else {
        console.log('[MediaPreview] 📷 No overlays or filters to compose, using original image');
      }
      
      const postData = {
        mediaUri: finalMediaUri, // Use composite image if available
        mediaType: media.type,
        caption,
        visibility,
        expiresIn: expiresIn * 60 * 60 * 1000, // Convert hours to milliseconds
        deleteOnView,
        appliedFilters: hasFilters ? appliedFilters : undefined, // ✅ ADDED: Save filter data
        // No longer save textOverlays separately - they're burned into the image
      };
      
      console.log('[MediaPreview] 📝 Post data summary:');
      console.log('- Media URI:', finalMediaUri);
      console.log('- Has Filters:', hasFilters);
      console.log('- Has Text Overlays:', hasTextOverlays);
      console.log('- Caption:', caption);
      
      const postId = await createPost(user.uid, postData);
      console.log('[MediaPreview] ✅ Post created with ID:', postId);
      
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
      console.error('[MediaPreview] ❌ Error posting:', error);
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

  // Filter handling functions
  const toggleFilters = () => {
    setFiltersEnabled(!filtersEnabled);
    if (!filtersEnabled) {
      setSelectedFilter('none'); // Reset filter when disabling
    }
    console.log('[MediaPreview] Filters toggled:', !filtersEnabled);
  };

  const handleFilterChange = (filterId) => {
    setSelectedFilter(filterId);
    console.log('[MediaPreview] Filter changed to:', filterId);
  };

  // Helper function to get filter data for composition
  const getFilterData = () => {
    console.log('[MediaPreview] 🎭 getFilterData called with appliedFilters:', appliedFilters);
    
    if (!appliedFilters || appliedFilters.length === 0) {
      console.log('[MediaPreview] 🎭 No applied filters found');
      return [];
    }

    // Import filter definitions (same as in FilterOverlay) - EXPANDED SET
    const FILTERS = {
      // Face Filters
      sunglasses: { id: 'sunglasses', emoji: '🕶️', position: 'eyes', scale: 1.8 },
      heart_eyes: { id: 'heart_eyes', emoji: '😍', position: 'face', scale: 1.4 },
      cool_face: { id: 'cool_face', emoji: '😎', position: 'face', scale: 1.4 },
      crown: { id: 'crown', emoji: '👑', position: 'forehead', scale: 1.7 },
      
      // Nature & Outdoor Filters
      waterfall: { id: 'waterfall', emoji: '🏞️', position: 'face', scale: 1.5 },
      mountain: { id: 'mountain', emoji: '🏔️', position: 'face', scale: 1.5 },
      tree: { id: 'tree', emoji: '🌲', position: 'face', scale: 1.6 },
      flower: { id: 'flower', emoji: '🌸', position: 'face', scale: 1.3 },
      sun: { id: 'sun', emoji: '☀️', position: 'face', scale: 1.6 },
      rainbow: { id: 'rainbow', emoji: '🌈', position: 'face', scale: 1.7 },
      
      // Activity & Mood Filters  
      fire: { id: 'fire', emoji: '🔥', position: 'face', scale: 1.5 },
      lightning: { id: 'lightning', emoji: '⚡', position: 'face', scale: 1.4 },
      star: { id: 'star', emoji: '⭐', position: 'face', scale: 1.3 },
      sparkle: { id: 'sparkle', emoji: '✨', position: 'face', scale: 1.4 },
      
      // Food & Lifestyle Filters
      coffee: { id: 'coffee', emoji: '☕', position: 'face', scale: 1.3 },
      pizza: { id: 'pizza', emoji: '🍕', position: 'face', scale: 1.4 },
      camera: { id: 'camera', emoji: '📸', position: 'face', scale: 1.3 },
      music: { id: 'music', emoji: '🎵', position: 'face', scale: 1.3 },
      
      // Animals
      cat: { id: 'cat', emoji: '🐱', position: 'face', scale: 1.4 },
      dog: { id: 'dog', emoji: '🐶', position: 'face', scale: 1.4 },
      butterfly: { id: 'butterfly', emoji: '🦋', position: 'face', scale: 1.5 },
      
      // Seasonal & Weather
      snowflake: { id: 'snowflake', emoji: '❄️', position: 'face', scale: 1.3 },
      cloud: { id: 'cloud', emoji: '☁️', position: 'face', scale: 1.5 },
      moon: { id: 'moon', emoji: '🌙', position: 'face', scale: 1.4 }
    };

    // Convert applied filters to composition format
    const filterData = appliedFilters.map(appliedFilter => {
      const filterDef = FILTERS[appliedFilter.filterId];
      if (!filterDef) {
        console.log('[MediaPreview] 🎭 Warning: Filter definition not found for:', appliedFilter.filterId);
        return null;
      }

      const result = {
        id: appliedFilter.id,
        emoji: filterDef.emoji,
        position: appliedFilter.position,
        size: appliedFilter.size,
      };
      
      console.log('[MediaPreview] 🎭 Converted filter:', appliedFilter.filterId, '→', result);
      return result;
    }).filter(Boolean);
    
    console.log('[MediaPreview] 🎭 Final filter data for composition:', filterData);
    return filterData;
  };

  // RAG Caption Generation Functions
  const handleGenerateCaptions = async () => {
    try {
      setIsGeneratingCaptions(true);
      console.log('[MediaPreview] Generating captions for image:', media.uri);
      
      const result = await generateCaptionSuggestions(
        media.uri,
        user.uid,
        { style: selectedCaptionStyle }
      );
      
      console.log('[MediaPreview] 🎯 API RESPONSE COMPLETE:', JSON.stringify(result, null, 2));
      
      if (result.success && result.captions) {
        setCaptionSuggestions(result.captions);
        setShowCaptionSuggestions(true);
        console.log('[MediaPreview] ✅ Generated captions:', result.captions);
        
        // Extract and display tag suggestions
        console.log('[MediaPreview] 🏷️ Checking tags:', result.tags, 'Length:', result.tags?.length);
        if (result.tags && result.tags.length > 0) {
          setTagSuggestions(result.tags);
          setShowTagSuggestions(true);
          console.log('[MediaPreview] ✅ Setting tag suggestions:', result.tags);
          console.log('[MediaPreview] ✅ showTagSuggestions set to: true');
        } else {
          console.log('[MediaPreview] ❌ No tags in successful response');
        }
      } else {
        // Use fallback captions if API fails
        setCaptionSuggestions(result.captions || []);
        setShowCaptionSuggestions(true);
        console.log('[MediaPreview] ⚠️ Using fallback captions:', result.captions);
        
        // Show fallback tags if available
        console.log('[MediaPreview] 🏷️ Checking fallback tags:', result.tags, 'Length:', result.tags?.length);
        if (result.tags && result.tags.length > 0) {
          setTagSuggestions(result.tags);
          setShowTagSuggestions(true);
          console.log('[MediaPreview] ✅ Setting fallback tag suggestions:', result.tags);
          console.log('[MediaPreview] ✅ showTagSuggestions set to: true');
        } else {
          console.log('[MediaPreview] ❌ No fallback tags available');
        }
      }
    } catch (error) {
      console.error('[MediaPreview] Error generating captions:', error);
      Alert.alert(
        'Caption Generation Failed',
        'Unable to generate smart captions. Please try again or add a caption manually.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleSelectCaption = (selectedCaption) => {
    setCaption(selectedCaption);
    setShowCaptionSuggestions(false);
    console.log('[MediaPreview] Caption selected:', selectedCaption);
  };

  const handleDismissSuggestions = () => {
    setShowCaptionSuggestions(false);
  };

  const handleCaptionStyleChange = (style) => {
    setSelectedCaptionStyle(style);
    
    // ALWAYS regenerate if suggestions have been shown at least once
    // This fixes the issue where style changes don't regenerate captions
    if (showCaptionSuggestions || captionSuggestions.length > 0) {
      handleGenerateCaptions();
    }
  };

  // RAG Tag Suggestion Functions
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.includes(tag);
      let newSelectedTags;
      
      if (isSelected) {
        // Remove tag
        newSelectedTags = prev.filter(t => t !== tag);
      } else {
        // Add tag
        newSelectedTags = [...prev, tag];
      }
      
      // Update caption with selected tags
      updateCaptionWithTags(newSelectedTags);
      
      return newSelectedTags;
    });
  };

  const handleDismissTagSuggestions = () => {
    setShowTagSuggestions(false);
  };

  const updateCaptionWithTags = (tags) => {
    // Remove existing tags from caption
    const captionWithoutTags = caption.replace(/#\w+/g, '').trim();
    
    // Add selected tags to caption
    const tagString = tags.length > 0 ? ' ' + tags.join(' ') : '';
    const newCaption = (captionWithoutTags + tagString).trim();
    
    // Ensure we don't exceed character limit
    if (newCaption.length <= 200) {
      setCaption(newCaption);
    }
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
            {/* Text Overlay Toggle Button - Only show for images */}
            {media.type === 'image' && (
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
            )}
            
            {/* Filter Toggle Button - Only show for images */}
            {media.type === 'image' && (
              <TouchableOpacity
                style={[styles.headerButton, filtersEnabled && styles.headerButtonActive]}
                onPress={toggleFilters}
              >
                <Ionicons 
                  name="happy" 
                  size={24} 
                  color={filtersEnabled ? Colors.snapYellow : Colors.white} 
                />
              </TouchableOpacity>
            )}
            
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
            {media.type === 'video' ? (
              <VideoPlayer
                source={{ uri: media.uri }}
                style={styles.mediaPreview}
                showControls={true}
                autoPlay={false}
                isMuted={true}
                isLooping={false}
              />
            ) : (
              <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
            )}
            
            {/* Filter Overlay - Always show for images if there are applied filters OR menu is open */}
            {media.type === 'image' && (appliedFilters.length > 0 || filtersEnabled) && (
              <FilterOverlay
                detectedFaces={[]} // No face detection data in preview, but AI will analyze the image
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
                appliedFilters={appliedFilters}
                onFiltersChange={setAppliedFilters}
                isEnabled={filtersEnabled}
                showMenuOnly={!filtersEnabled && appliedFilters.length > 0}
                imageUri={media.uri}
                userId={user.uid}
                style={styles.filterOverlayContainer}
              />
            )}
            
            {/* Text Overlay Tools - Only show for images */}
            {textOverlaysEnabled && media.type === 'image' && (
              <TextOverlayTools
                isEnabled={textOverlaysEnabled}
                imageUri={media.uri}
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
              filters={getFilterData()}
              style={styles.composerContainer}
            />
          </View>

          {/* Caption Input */}
          <View style={styles.section}>
            <View style={styles.captionHeader}>
              <Text style={styles.sectionTitle}>Caption</Text>
              {/* Smart Caption Generation Button - Only show for images */}
              {media.type === 'image' && (
                <TouchableOpacity
                  style={styles.generateCaptionButton}
                  onPress={handleGenerateCaptions}
                  disabled={isGeneratingCaptions}
                >
                  {isGeneratingCaptions ? (
                    <ActivityIndicator size="small" color={Colors.snapYellow} />
                  ) : (
                    <Ionicons name="sparkles" size={16} color={Colors.snapYellow} />
                  )}
                  <Text style={styles.generateCaptionText}>
                    {isGeneratingCaptions ? 'Generating...' : 'Generate'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Caption Style Selector - Show when generating or suggestions visible */}
            {(isGeneratingCaptions || showCaptionSuggestions) && media.type === 'image' && (
              <View style={styles.captionStyleContainer}>
                <Text style={styles.captionStyleLabel}>Style:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['casual', 'creative', 'descriptive', 'minimal'].map((style) => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.captionStyleButton,
                        selectedCaptionStyle === style && styles.captionStyleButtonActive
                      ]}
                      onPress={() => handleCaptionStyleChange(style)}
                    >
                      <Text style={[
                        styles.captionStyleButtonText,
                        selectedCaptionStyle === style && styles.captionStyleButtonTextActive
                      ]}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Caption Suggestions */}
            {showCaptionSuggestions && captionSuggestions.length > 0 && (
              <View style={styles.captionSuggestionsContainer}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsTitle}>Suggestions</Text>
                  <TouchableOpacity
                    style={styles.dismissSuggestionsButton}
                    onPress={handleDismissSuggestions}
                  >
                    <Ionicons name="close" size={16} color={Colors.lightGray} />
                  </TouchableOpacity>
                </View>
                
                {captionSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.captionSuggestion}
                    onPress={() => handleSelectCaption(suggestion)}
                  >
                    <Text style={styles.captionSuggestionText}>{suggestion}</Text>
                    <Ionicons name="add-circle-outline" size={20} color={Colors.snapYellow} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Tag Suggestions */}
            {media.type === 'image' && (
              <TagSuggestionSection
                tags={tagSuggestions}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onDismiss={handleDismissTagSuggestions}
                visible={showTagSuggestions}
              />
            )}
            
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
  filterOverlayContainer: {
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
  
  // RAG Caption Generation Styles
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  generateCaptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.snapYellow,
  },
  generateCaptionText: {
    color: Colors.snapYellow,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  captionStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  captionStyleLabel: {
    color: Colors.lightGray,
    fontSize: 14,
    marginRight: 10,
  },
  captionStyleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.darkGray,
  },
  captionStyleButtonActive: {
    borderColor: Colors.snapYellow,
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
  },
  captionStyleButtonText: {
    color: Colors.white,
    fontSize: 12,
  },
  captionStyleButtonTextActive: {
    color: Colors.snapYellow,
    fontWeight: '600',
  },
  captionSuggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionsTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissSuggestionsButton: {
    padding: 4,
  },
  captionSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  captionSuggestionText: {
    color: Colors.white,
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
}); 