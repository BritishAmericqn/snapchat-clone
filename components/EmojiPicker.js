import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';

const EmojiPicker = ({ visible, onSelectEmoji, onClose, recentEmojis = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('recent');

  // Emoji categories with popular emojis for each
  const emojiCategories = {
    recent: {
      name: 'Recent',
      icon: 'time-outline',
      emojis: recentEmojis.length > 0 ? recentEmojis : ['❤️', '😍', '🔥', '👍', '😂', '😮']
    },
    smileys: {
      name: 'Smileys',
      icon: 'happy-outline',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '😍', '🤩', '😘', '😗', '😚', '😋', '😛',
        '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
        '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪',
        '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶'
      ]
    },
    gestures: {
      name: 'Gestures',
      icon: 'hand-left-outline',
      emojis: [
        '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
        '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲',
        '🤝', '🙏', '✊', '👊', '🤛', '🤜', '👋', '🤚', '🖐', '✋',
        '🖖', '👁', '👀', '🧠', '🫀', '🫁', '🦷', '🦴', '👄', '👅'
      ]
    },
    hearts: {
      name: 'Hearts',
      icon: 'heart-outline',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
        '💯', '💢', '💥', '💫', '💦', '💨', '🕳', '💤', '👋', '🔥'
      ]
    },
    objects: {
      name: 'Objects',
      icon: 'cube-outline',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁',
        '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌',
        '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🏋️‍♂️', '🤼‍♀️', '🤼‍♂️', '🤸‍♀️', '🤸‍♂️'
      ]
    },
    nature: {
      name: 'Nature',
      icon: 'leaf-outline',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
        '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
        '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦢', '🦅',
        '🦉', '🦚', '🦜', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'
      ]
    }
  };

  const filteredEmojis = () => {
    if (!searchQuery) {
      return emojiCategories[selectedCategory]?.emojis || [];
    }
    
    // Simple search - could be enhanced with emoji names/descriptions
    const allEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
    return allEmojis.filter(emoji => emoji.includes(searchQuery));
  };

  const renderEmojiGrid = () => {
    const emojis = filteredEmojis();
    
    return (
      <FlatList
        data={emojis}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={8}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => onSelectEmoji(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.emojiGrid}
      />
    );
  };

  const renderCategoryTabs = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {Object.entries(emojiCategories).map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryTab,
              selectedCategory === key && styles.categoryTabActive
            ]}
            onPress={() => setSelectedCategory(key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={selectedCategory === key ? Colors.snapYellow : Colors.gray}
            />
            <Text style={[
              styles.categoryTabText,
              selectedCategory === key && styles.categoryTabTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose an emoji</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search emojis..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color={Colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        {!searchQuery && renderCategoryTabs()}

        {/* Emoji Grid */}
        <View style={styles.emojiContainer}>
          {renderEmojiGrid()}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick reactions:</Text>
          <View style={styles.quickActionsRow}>
            {['❤️', '😍', '🔥', '👍', '😂', '😮'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.quickActionButton}
                onPress={() => onSelectEmoji(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  clearSearchButton: {
    padding: 4,
  },
  categoryTabs: {
    maxHeight: 80,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    minWidth: 70,
  },
  categoryTabActive: {
    backgroundColor: Colors.snapYellow,
  },
  categoryTabText: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: Colors.black,
    fontWeight: '600',
  },
  emojiContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emojiGrid: {
    paddingVertical: 16,
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emoji: {
    fontSize: 28,
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  quickActionsTitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
});

export default EmojiPicker; 