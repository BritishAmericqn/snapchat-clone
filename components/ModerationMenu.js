import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';
import { muteUser, unmuteUser, blockUser, unblockUser } from '../api/moderation';
import ReportModal from './ReportModal';

const ModerationMenu = ({ 
  targetUserId, 
  targetUsername,
  currentUserId, 
  visible, 
  onClose,
  moderationStatus = {},
  onModerationChange,
  isFriend = false,
  onRemoveFriend
}) => {
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isMuted, isBlocked, hasReported, canInteract } = moderationStatus;

  const handleMuteToggle = async () => {
    try {
      setLoading(true);
      
      if (isMuted) {
        await unmuteUser(targetUserId, currentUserId);
        Alert.alert('Success', `${targetUsername} has been unmuted`);
      } else {
        Alert.alert(
          'Mute User',
          `Are you sure you want to mute ${targetUsername}? You won't receive notifications from them.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mute',
              style: 'destructive',
              onPress: async () => {
                await muteUser(targetUserId, currentUserId);
                Alert.alert('Success', `${targetUsername} has been muted`);
                if (onModerationChange) onModerationChange();
              }
            }
          ]
        );
      }
      
      if (onModerationChange) onModerationChange();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update mute status');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    try {
      setLoading(true);
      
      if (isBlocked) {
        Alert.alert(
          'Unblock User',
          `Are you sure you want to unblock ${targetUsername}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unblock',
              onPress: async () => {
                await unblockUser(targetUserId, currentUserId);
                Alert.alert('Success', `${targetUsername} has been unblocked`);
                if (onModerationChange) onModerationChange();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Block User',
          `Are you sure you want to block ${targetUsername}? This will:\n\n• Remove them from your friends\n• Hide all their content\n• Prevent them from messaging you\n• Hide your content from them`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await blockUser(targetUserId, currentUserId);
                Alert.alert('Success', `${targetUsername} has been blocked`);
                if (onModerationChange) onModerationChange();
                onClose();
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update block status');
    } finally {
      setLoading(false);
    }
  };

  const handleReportUser = () => {
    setReportModalVisible(true);
  };

  const handleReportSubmit = () => {
    setReportModalVisible(false);
    Alert.alert(
      'Report Submitted',
      'Thank you for your report. We\'ll review it and take appropriate action.',
      [{ text: 'OK', onPress: onClose }]
    );
    if (onModerationChange) onModerationChange();
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove @${targetUsername} as a friend?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (onRemoveFriend) {
              onRemoveFriend();
            }
            onClose();
          }
        }
      ]
    );
  };

  const menuOptions = [
    // Add remove friend option if they are friends
    ...(isFriend ? [{
      id: 'removeFriend',
      icon: 'person-remove-outline',
      title: 'Remove Friend',
      subtitle: 'Remove this person from your friends list',
      onPress: handleRemoveFriend,
      disabled: loading,
      style: 'destructive'
    }] : []),
    {
      id: 'mute',
      icon: isMuted ? 'volume-high' : 'volume-mute',
      title: isMuted ? 'Unmute User' : 'Mute User',
      subtitle: isMuted 
        ? 'Start receiving notifications from this user'
        : 'Stop receiving notifications from this user',
      onPress: handleMuteToggle,
      disabled: loading || isBlocked,
      style: isMuted ? 'default' : 'warning'
    },
    {
      id: 'block',
      icon: isBlocked ? 'person-add' : 'person-remove',
      title: isBlocked ? 'Unblock User' : 'Block User',
      subtitle: isBlocked
        ? 'Allow this user to interact with you again'
        : 'Completely prevent interaction with this user',
      onPress: handleBlockToggle,
      disabled: loading,
      style: isBlocked ? 'default' : 'destructive'
    },
    {
      id: 'report',
      icon: 'flag',
      title: hasReported ? 'Report Submitted' : 'Report User',
      subtitle: hasReported
        ? 'You have already reported this user'
        : 'Report this user for inappropriate behavior',
      onPress: handleReportUser,
      disabled: loading || hasReported,
      style: 'destructive'
    }
  ];

  return (
    <>
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
            <Text style={styles.headerTitle}>User Options</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {targetUsername?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.username}>@{targetUsername}</Text>
            {!canInteract && (
              <Text style={styles.blockedNotice}>
                You and this user have restricted access
              </Text>
            )}
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.menuOption,
                  option.disabled && styles.menuOptionDisabled,
                  option.style === 'destructive' && styles.menuOptionDestructive,
                  option.style === 'warning' && styles.menuOptionWarning
                ]}
                onPress={option.onPress}
                disabled={option.disabled}
                activeOpacity={0.7}
              >
                <View style={styles.menuOptionIcon}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={
                      option.disabled
                        ? Colors.lightGray
                        : option.style === 'destructive'
                        ? Colors.red
                        : option.style === 'warning'
                        ? Colors.orange
                        : Colors.black
                    }
                  />
                </View>
                <View style={styles.menuOptionContent}>
                  <Text style={[
                    styles.menuOptionTitle,
                    option.disabled && styles.menuOptionTitleDisabled,
                    option.style === 'destructive' && styles.menuOptionTitleDestructive
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[
                    styles.menuOptionSubtitle,
                    option.disabled && styles.menuOptionSubtitleDisabled
                  ]}>
                    {option.subtitle}
                  </Text>
                </View>
                {!option.disabled && (
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Safety Notice */}
          <View style={styles.safetyNotice}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.blue} />
            <Text style={styles.safetyNoticeText}>
              Your safety and privacy are important to us. These tools help you control your experience.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        targetUserId={targetUserId}
        targetUsername={targetUsername}
        currentUserId={currentUserId}
        onSubmit={handleReportSubmit}
        onCancel={() => setReportModalVisible(false)}
      />
    </>
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
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.snapYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  blockedNotice: {
    fontSize: 14,
    color: Colors.red,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  menuOptionDisabled: {
    opacity: 0.5,
  },
  menuOptionDestructive: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  menuOptionWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
  },
  menuOptionIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  menuOptionTitleDisabled: {
    color: Colors.lightGray,
  },
  menuOptionTitleDestructive: {
    color: Colors.red,
  },
  menuOptionSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 18,
  },
  menuOptionSubtitleDisabled: {
    color: Colors.lightGray,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.lightGray,
    marginTop: 'auto',
  },
  safetyNoticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 18,
  },
});

export default ModerationMenu; 