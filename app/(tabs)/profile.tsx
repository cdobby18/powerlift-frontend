import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { FONTS, SIZES, Typography } from '../../constants/Typography';
import useCustomTheme from '../../hooks/useCustomTheme';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useCustomTheme();
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [username, setUsername] = useState(user?.username || 'Guest');
  const [email, setEmail] = useState(user?.email || '');
  const [personWeight, setPersonWeight] = useState(user?.person_weight?.toString() || '');
  const [barbellWeight, setBarbellWeight] = useState(user?.barbell_weight?.toString() || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleUpdateProfile = async () => {
    // Validate inputs
    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (email && !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!oldPassword) {
      Alert.alert('Error', 'Current password is required to make changes');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    // Convert weight values to numbers if provided
    const personWeightNum = personWeight ? parseFloat(personWeight) : undefined;
    const barbellWeightNum = barbellWeight ? parseFloat(barbellWeight) : undefined;

    // Only update fields that have changed
    const updates: {
      username?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      person_weight?: number;
      barbell_weight?: number;
      old_password: string;
      new_password?: string;
    } = {
      old_password: oldPassword
    };
    
    if (username !== user?.username) {
      updates.username = username;
    }
    
    if (email !== user?.email && email.trim() !== '') {
      updates.email = email;
    }
    
    if (firstName !== user?.first_name) {
      updates.first_name = firstName;
    }
    
    if (lastName !== user?.last_name) {
      updates.last_name = lastName;
    }
    
    if (personWeightNum !== user?.person_weight) {
      updates.person_weight = personWeightNum;
    }
    
    if (barbellWeightNum !== user?.barbell_weight) {
      updates.barbell_weight = barbellWeightNum;
    }
    
    if (newPassword) {
      updates.new_password = newPassword;
    }
    
    // Check if there are any updates to make besides the old password
    if (Object.keys(updates).length === 1) {
      Alert.alert('No Changes', 'No changes were made to your profile');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(updates);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear password fields after successful update
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Alert message is handled by useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}>
          <Text style={[styles.title, { color: theme.text }]}>User Profile</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Update Profile</Text>
          
          {successMessage ? (
            <Text style={[styles.successMessage, { color: theme.success }]}>{successMessage}</Text>
          ) : null}
          
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>First Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>
          
          <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={theme.textMuted}
          />
          
          <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Your Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                value={personWeight}
                onChangeText={setPersonWeight}
                placeholder="Your weight"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Barbell Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                value={barbellWeight}
                onChangeText={setBarbellWeight}
                placeholder="Barbell weight"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Change Password</Text>
          
          <Text style={[styles.inputLabel, { color: theme.text }]}>Current Password</Text>
          <View style={[styles.passwordContainer, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.text }]}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showOldPassword}
              autoCapitalize="none"
            />
            <Pressable 
              style={styles.eyeIcon} 
              onPress={() => setShowOldPassword(!showOldPassword)}
            >
              <Ionicons 
                name={showOldPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={theme.textMuted} 
              />
            </Pressable>
          </View>
          
          <Text style={[styles.inputLabel, { color: theme.text }]}>New Password</Text>
          <View style={[styles.passwordContainer, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <Pressable 
              style={styles.eyeIcon} 
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons 
                name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={theme.textMuted} 
              />
            </Pressable>
          </View>
          
          <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm New Password</Text>
          <View style={[styles.passwordContainer, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={theme.textMuted} 
              />
            </Pressable>
          </View>
          
          <TouchableOpacity 
            style={[styles.updateButton, { backgroundColor: theme.primary }]}
            onPress={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    ...Typography.h1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  successMessage: {
    ...Typography.body1,
    textAlign: 'center',
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfInput: {
    width: '48%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    ...Typography.body2,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body1,
  },
  passwordContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body1,
  },
  eyeIcon: {
    padding: 15,
  },
  updateButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  updateButtonText: {
    ...Typography.button,
    color: '#000000',
  },
}); 