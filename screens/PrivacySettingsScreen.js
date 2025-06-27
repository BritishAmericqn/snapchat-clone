import React, { useState } from "react";
import { Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from "react-native";
import { View } from "../components";
import { Colors } from "../config";

export const PrivacySettingsScreen = ({ navigation }) => {
  // Privacy settings state
  const [whoCanMessage, setWhoCanMessage] = useState('friends'); // 'friends' or 'anyone'
  const [whoCanViewStory, setWhoCanViewStory] = useState('friends'); // 'friends' or 'friendsOfFriends' or 'anyone'
  const [showLocation, setShowLocation] = useState(false);
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [allowScreenshots, setAllowScreenshots] = useState(false);
  
  const handleSave = () => {
    // In real app, would save to Firestore
    console.log('[PrivacySettings] Saving settings:', {
      whoCanMessage,
      whoCanViewStory,
      showLocation,
      showActiveStatus,
      allowScreenshots
    });
    Alert.alert('Success', 'Privacy settings updated!');
    navigation.goBack();
  };
  
  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
  
  const SettingRow = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value} ›</Text>
    </TouchableOpacity>
  );
  
  const ToggleRow = ({ label, value, onValueChange }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.lightGray, true: Colors.snapYellow }}
        thumbColor={Colors.white}
      />
    </View>
  );

  return (
    <View isSafe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <SettingSection title="Who Can...">
          <SettingRow
            label="Contact Me"
            value={whoCanMessage === 'friends' ? 'My Friends' : 'Everyone'}
            onPress={() => {
              Alert.alert(
                'Who Can Contact Me',
                'Choose who can send you messages',
                [
                  { text: 'My Friends', onPress: () => setWhoCanMessage('friends') },
                  { text: 'Everyone', onPress: () => setWhoCanMessage('anyone') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          />
          
          <SettingRow
            label="View My Story"
            value={
              whoCanViewStory === 'friends' ? 'My Friends' : 
              whoCanViewStory === 'friendsOfFriends' ? 'Friends + Their Friends' : 
              'Everyone'
            }
            onPress={() => {
              Alert.alert(
                'Who Can View My Story',
                'Choose who can see your stories',
                [
                  { text: 'My Friends', onPress: () => setWhoCanViewStory('friends') },
                  { text: 'Friends + Their Friends', onPress: () => setWhoCanViewStory('friendsOfFriends') },
                  { text: 'Everyone', onPress: () => setWhoCanViewStory('anyone') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          />
        </SettingSection>
        
        <SettingSection title="My Location">
          <ToggleRow
            label="Show on Map"
            value={showLocation}
            onValueChange={setShowLocation}
          />
          <Text style={styles.settingDescription}>
            Allow friends to see your location on Snap Map
          </Text>
        </SettingSection>
        
        <SettingSection title="Activity">
          <ToggleRow
            label="Show Active Status"
            value={showActiveStatus}
            onValueChange={setShowActiveStatus}
          />
          <Text style={styles.settingDescription}>
                          Let friends know when you're active on 2nd Degree
          </Text>
        </SettingSection>
        
        <SettingSection title="Screenshots">
          <ToggleRow
            label="Allow in Chat"
            value={allowScreenshots}
            onValueChange={setAllowScreenshots}
          />
          <Text style={styles.settingDescription}>
            Allow friends to save messages in Chat by taking screenshots
          </Text>
        </SettingSection>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Clear Conversations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={[styles.deleteButtonText, { color: Colors.red }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  backButton: {
    fontSize: 24,
    color: Colors.blue,
  },
  saveButton: {
    fontSize: 16,
    color: Colors.blue,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.black,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.gray,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 5,
    marginBottom: 10,
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deleteButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: Colors.gray,
  },
}); 