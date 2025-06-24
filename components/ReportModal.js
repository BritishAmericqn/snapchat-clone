import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';
import { reportUser } from '../api/moderation';

const ReportModal = ({ 
  visible, 
  targetUserId, 
  targetUsername,
  currentUserId,
  onSubmit, 
  onCancel 
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    {
      id: 'harassment',
      title: 'Harassment or Bullying',
      description: 'Targeting someone with hostile or aggressive behavior'
    },
    {
      id: 'spam',
      title: 'Spam or Unwanted Content',
      description: 'Sending repetitive, irrelevant, or promotional content'
    },
    {
      id: 'inappropriate_content',
      title: 'Inappropriate Content',
      description: 'Sharing content that violates community guidelines'
    },
    {
      id: 'fake_account',
      title: 'Fake Account',
      description: 'Impersonating someone else or creating false identity'
    },
    {
      id: 'other',
      title: 'Other',
      description: 'Something else that concerns you'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    try {
      setLoading(true);
      
      await reportUser(targetUserId, currentUserId, selectedReason, description);
      
      // Reset form
      setSelectedReason('');
      setDescription('');
      
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason('');
    setDescription('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report User</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[
              styles.submitButton,
              (!selectedReason || loading) && styles.submitButtonDisabled
            ]}
            disabled={!selectedReason || loading}
          >
            <Text style={[
              styles.submitButtonText,
              (!selectedReason || loading) && styles.submitButtonTextDisabled
            ]}>
              {loading ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {targetUsername?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.username}>@{targetUsername}</Text>
            <Text style={styles.reportNotice}>
              Reports are anonymous and help keep our community safe
            </Text>
          </View>

          {/* Reason Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why are you reporting this user?</Text>
            <Text style={styles.sectionSubtitle}>
              Select the reason that best describes the issue
            </Text>

            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected
                ]}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
              >
                <View style={styles.reasonOptionContent}>
                  <Text style={[
                    styles.reasonTitle,
                    selectedReason === reason.id && styles.reasonTitleSelected
                  ]}>
                    {reason.title}
                  </Text>
                  <Text style={[
                    styles.reasonDescription,
                    selectedReason === reason.id && styles.reasonDescriptionSelected
                  ]}>
                    {reason.description}
                  </Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedReason === reason.id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional details (optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Provide more context to help us understand the issue
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe what happened..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              placeholderTextColor={Colors.gray}
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Ionicons name="lock-closed" size={16} color={Colors.blue} />
            <Text style={styles.privacyNoticeText}>
              Your report is confidential. The reported user will not know you reported them.
            </Text>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>What happens next?</Text>
            <Text style={styles.guidelinesText}>
              • Our team will review your report within 24 hours{'\n'}
              • We may take action including warnings or account restrictions{'\n'}
              • You can continue using the app normally{'\n'}
              • We may contact you if we need more information
            </Text>
          </View>
        </ScrollView>
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
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.blue,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  submitButton: {
    padding: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.red,
  },
  submitButtonTextDisabled: {
    color: Colors.gray,
  },
  content: {
    flex: 1,
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.snapYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  reportNotice: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 16,
    lineHeight: 18,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  reasonOptionSelected: {
    borderColor: Colors.blue,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  reasonOptionContent: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  reasonTitleSelected: {
    color: Colors.blue,
  },
  reasonDescription: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 18,
  },
  reasonDescriptionSelected: {
    color: Colors.darkGray,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.blue,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'right',
    marginTop: 8,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  privacyNoticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 18,
  },
  guidelines: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
});

export default ReportModal; 