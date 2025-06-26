import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';

/**
 * TagSuggestionSection Component
 * Displays AI-generated hashtag suggestions for posts
 * Follows the same UI patterns as caption suggestions
 */
export const TagSuggestionSection = ({ 
  tags = [], 
  selectedTags = [], 
  onTagToggle, 
  onDismiss,
  visible = false 
}) => {
  console.log('[TagSuggestionSection] 🏷️ Component called with:', {
    tags,
    tagsLength: tags.length,
    selectedTags,
    visible,
    onTagToggle: !!onTagToggle,
    onDismiss: !!onDismiss
  });
  
  if (!visible || tags.length === 0) {
    console.log('[TagSuggestionSection] ❌ Not rendering - visible:', visible, 'tags.length:', tags.length);
    return null;
  }
  
  console.log('[TagSuggestionSection] ✅ Rendering with', tags.length, 'tags');

  const handleTagPress = (tag) => {
    if (onTagToggle) {
      onTagToggle(tag);
    }
  };

  const isTagSelected = (tag) => {
    return selectedTags.includes(tag);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tag Suggestions</Text>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Ionicons name="close" size={16} color={Colors.lightGray} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
      >
        {tags.map((tag, index) => {
          const selected = isTagSelected(tag);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.tagButton,
                selected && styles.tagButtonSelected
              ]}
              onPress={() => handleTagPress(tag)}
            >
              <Text style={[
                styles.tagText,
                selected && styles.tagTextSelected
              ]}>
                {tag}
              </Text>
              <Ionicons 
                name={selected ? "checkmark-circle" : "add-circle-outline"} 
                size={16} 
                color={selected ? Colors.snapYellow : Colors.lightGray} 
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  tagsScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkGray,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagButtonSelected: {
    borderColor: Colors.snapYellow,
    backgroundColor: 'rgba(255, 252, 0, 0.1)',
  },
  tagText: {
    color: Colors.white,
    fontSize: 12,
    marginRight: 4,
  },
  tagTextSelected: {
    color: Colors.snapYellow,
    fontWeight: '600',
  },
}); 