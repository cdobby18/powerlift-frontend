import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { FONTS, SIZES, Typography } from '../../constants/Typography';
import useCustomTheme from '../../hooks/useCustomTheme';

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useCustomTheme();
  
  const [bodyWeight, setBodyWeight] = useState('');
  const [weightUsed, setWeightUsed] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<'deadlift' | 'bench' | 'squat'>('deadlift');

  // Auto-populate weights from user profile when component mounts or user changes
  useEffect(() => {
    if (user) {
      // Set body weight from user profile if available
      if (user.person_weight) {
        setBodyWeight(user.person_weight.toString());
      }
      
      // Set barbell weight from user profile if available
      if (user.barbell_weight) {
        setWeightUsed(user.barbell_weight.toString());
      }
    }
  }, [user]);

  const handleRecordVideo = () => {
    // Navigate to video recording screen with exercise type and weights
    router.push({
      pathname: '/video-analysis',
      params: {
        exerciseType: selectedExercise,
        bodyWeight,
        weightUsed
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Record Exercise Video</Text>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>VIDEO RECORD</Text>
        
        <View style={styles.exercisesContainer}>
          {/* Deadlift Card */}
          <TouchableOpacity 
            style={[
              styles.exerciseCard,
              { backgroundColor: theme.surface },
              selectedExercise === 'deadlift' && [
                styles.selectedExerciseCard, 
                { 
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}20`
                }
              ]
            ]}
            onPress={() => setSelectedExercise('deadlift')}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={require('../../assets/images/exercises/deadlift.png')} 
                style={styles.exerciseImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={[
              styles.exerciseText,
              { color: theme.textMuted },
              selectedExercise === 'deadlift' && { color: theme.primary }
            ]}>
              DEADLIFT
            </Text>
          </TouchableOpacity>
          
          {/* Bench Press Card */}
          <TouchableOpacity 
            style={[
              styles.exerciseCard,
              { backgroundColor: theme.surface },
              selectedExercise === 'bench' && [
                styles.selectedExerciseCard, 
                { 
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}20`
                }
              ]
            ]}
            onPress={() => setSelectedExercise('bench')}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={require('../../assets/images/exercises/bench.png')} 
                style={styles.exerciseImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={[
              styles.exerciseText,
              { color: theme.textMuted },
              selectedExercise === 'bench' && { color: theme.primary }
            ]}>
              BENCH PRESS
            </Text>
          </TouchableOpacity>
          
          {/* Squat Card */}
          <TouchableOpacity 
            style={[
              styles.exerciseCard,
              { backgroundColor: theme.surface },
              selectedExercise === 'squat' && [
                styles.selectedExerciseCard, 
                { 
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}20`
                }
              ]
            ]}
            onPress={() => setSelectedExercise('squat')}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={require('../../assets/images/exercises/squat.png')} 
                style={styles.exerciseImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={[
              styles.exerciseText,
              { color: theme.textMuted },
              selectedExercise === 'squat' && { color: theme.primary }
            ]}>
              SQUAT
            </Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          placeholder="Enter Body Weight (kg)"
          placeholderTextColor={theme.textMuted}
          keyboardType="numeric"
          value={bodyWeight}
          onChangeText={setBodyWeight}
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          placeholder="Enter Weight Used (kg)"
          placeholderTextColor={theme.textMuted}
          keyboardType="numeric"
          value={weightUsed}
          onChangeText={setWeightUsed}
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.recordButton, { backgroundColor: theme.primary }]}
            onPress={handleRecordVideo}
          >
            <Ionicons name="videocam" size={20} color="#000000" style={styles.buttonIcon} />
            <Text style={styles.recordButtonText}>
              RECORD {selectedExercise.toUpperCase()}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // Increased bottom padding to avoid tab bar overlap
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
    ...Typography.h5,
    fontFamily: FONTS.bold,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  exercisesContainer: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  exerciseCard: {
    width: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedExerciseCard: {
    // Style overrides for selected card are applied inline
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseImage: {
    width: 60,
    height: 60,
  },
  exerciseText: {
    ...Typography.caption,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  selectedExerciseText: {
    // Color override is applied inline
  },
  input: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body1,
  },
  buttonContainer: {
    marginTop: 10,
  },
  recordButton: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  recordButtonText: {
    ...Typography.button,
    fontFamily: FONTS.bold,
    color: '#000000',
    letterSpacing: 1,
  },
}); 