import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions, Share, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import useAuth from '../hooks/useAuth';
import useProgress from '../hooks/useProgress';
import PowerLiftAPI from '../services/api';
import TabBar from '../components/TabBar';
import { fitnessTheme } from '../constants/Colors';

// Type for route params
type ResultsParams = {
  analysisId: string;
  videoUrl?: string;
  radarChartUrl?: string;
  scores?: string; // JSON string of scores
  exerciseType?: string;
  bodyWeight?: string;
  weightUsed?: string;
  isRealTimeAnalysis?: string; // Flag to indicate if this is a real-time analysis
  noBarbellDetected?: string; // Flag to indicate if no barbell was detected
};

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ResultsParams>();
  const { user } = useAuth();
  const { addProgressEntry } = useProgress();
  
  // State
  const [loading, setLoading] = useState(true);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [radarChartUrl, setRadarChartUrl] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    knee_alignment?: number;
    spine_alignment?: number;
    hip_stability?: number;
    bar_path_efficiency?: number;
    form?: number;
    stability?: number;
    range_of_motion?: number;
    tempo?: number;
    overall: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [noBarbellDetected, setNoBarbellDetected] = useState<boolean>(false);
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
  const [activeScoreInfo, setActiveScoreInfo] = useState<{
    title: string;
    description: string;
  }>({ title: '', description: '' });
  
  // Get exercise info from params
  const exerciseType = params.exerciseType as string || 'deadlift';
  const bodyWeight = params.bodyWeight as string || '';
  const weightUsed = params.weightUsed as string || '';
  const analysisId = params.analysisId as string || '';
  
  // Check if no barbell was detected
  useEffect(() => {
    if (params.noBarbellDetected === 'true') {
      setNoBarbellDetected(true);
    }
  }, [params.noBarbellDetected]);
  
  // Get screen dimensions for video sizing
  const { width } = Dimensions.get('window');
  const videoHeight = width * (9/16); // 16:9 aspect ratio

  // Parse scores once when component mounts
  useEffect(() => {
    if (params.scores) {
      try {
        const parsedScores = JSON.parse(params.scores);
        setScores(parsedScores);
        setLoading(false);
        
        // Save to progress tracking if we have an analysis ID and user is logged in
        if (user && analysisId && parsedScores.overall) {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          
          addProgressEntry({
            exercise_type: exerciseType,
            date: today,
            score: parsedScores.overall,
            weight_used: weightUsed,
            body_weight: bodyWeight,
            notes: `Analysis ID: ${analysisId}`
          }).catch(err => {
            console.error('Failed to save progress entry:', err);
          });
        }
      } catch (e) {
        console.error('Error parsing scores:', e);
      }
    }
  }, [params.scores, analysisId, user, addProgressEntry, exerciseType, weightUsed, bodyWeight]);

  // Set URLs just once when they're available in params
  useEffect(() => {
    if (params.videoUrl) {
      setVideoUrl(params.videoUrl);
    }
    
    if (params.radarChartUrl) {
      setRadarChartUrl(params.radarChartUrl);
    }
  }, [params.videoUrl, params.radarChartUrl]);

  // Load URLs from API if not provided in params
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if this is a real-time analysis
        const isRealTimeAnalysis = params.isRealTimeAnalysis === 'true';
        
        // Only fetch video URL if not a real-time analysis
        if (!params.videoUrl && analysisId && !videoUrl && !isRealTimeAnalysis) {
          const url = await PowerLiftAPI.getAnalysisVideoUrl(analysisId);
          setVideoUrl(url);
        } else if (isRealTimeAnalysis) {
          // For real-time analyses, set video error to true
          setVideoError(true);
        }
        
        if (!params.radarChartUrl && analysisId && !radarChartUrl) {
          const url = await PowerLiftAPI.getRadarChartUrl(analysisId);
          setRadarChartUrl(url);
        }
        
        // Always fetch analysis data from backend if we have an analysisId
        if (analysisId) {
          console.log(`Fetching analysis data for ID: ${analysisId}`);
          const analysisData = await PowerLiftAPI.checkAnalysisStatus(analysisId);
          console.log('Raw analysis data from API:', JSON.stringify(analysisData, null, 2));
          
          if (analysisData.status === 'completed') {
            if (analysisData.scores) {
              console.log('Using real scores from backend:', analysisData.scores);
              setScores(analysisData.scores);
              if (analysisData.feedback) {
                setFeedback(analysisData.feedback);
              }
            } else {
              console.warn('API returned completed status but no scores');
              if (!scores) {
                console.log('No scores available, using default scores');
                setScores({
                  knee_alignment: 75,
                  spine_alignment: 80,
                  hip_stability: 70,
                  bar_path_efficiency: 85,
                  overall: 78
                });
              }
            }
          } else if (!scores) {
            // Only use default scores if we don't have any scores and the API didn't return them
            console.log('API returned no scores, using default scores');
            setScores({
              knee_alignment: 75,
              spine_alignment: 80,
              hip_stability: 70,
              bar_path_efficiency: 85,
              overall: 78
            });
            setFeedback([
              "Keep your back straight throughout the movement",
              "Maintain more consistent tempo during the eccentric phase",
              "Keep your knees tracking over your toes during the entire movement"
            ]);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading analysis data:', error);
        setVideoError(true);
        
        // Only use default scores if we don't have any scores already
        if (!scores) {
          console.log('Error fetching scores, using default scores');
          setScores({
            knee_alignment: 75,
            spine_alignment: 80,
            hip_stability: 70,
            bar_path_efficiency: 85,
            overall: 78
          });
          setFeedback([
            "Keep your back straight throughout the movement",
            "Maintain more consistent tempo during the eccentric phase",
            "Keep your knees tracking over your toes during the entire movement"
          ]);
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [analysisId, params.videoUrl, params.radarChartUrl, params.isRealTimeAnalysis, videoUrl, radarChartUrl]);
  
  // Share analysis results
  const shareResults = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out my PowerLift form analysis! Overall score: ${scores?.overall.toFixed(1) || 'N/A'}/100`,
        title: 'PowerLift Form Analysis',
      });
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  }, [scores]);
  
  // Calculate color based on score
  const getScoreColor = useCallback((score: number) => {
    if (score < 50) return fitnessTheme.error; // Red
    if (score < 75) return fitnessTheme.warning; // Yellow
    return fitnessTheme.primary; // Primary color
  }, []);
  
  // Navigate back to home
  const goToHome = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);
  
  // Handle retry recording
  const handleRetry = useCallback(() => {
    router.back();
  }, [router]);
  
  // Get exercise title
  const getExerciseTitle = useCallback(() => {
    switch (exerciseType) {
      case 'deadlift':
        return 'Deadlift';
      case 'bench':
        return 'Bench Press';
      case 'squat':
        return 'Squat';
      default:
        return 'Exercise';
    }
  }, [exerciseType]);
  
  // Function to show score info
  const showScoreInfo = useCallback((scoreType: string) => {
    let title = '';
    let description = '';
    
    switch (scoreType) {
      case 'knee_alignment':
        title = 'Knee Alignment';
        description = exerciseType === 'deadlift' 
          ? 'Measures knee angle at the bottom position (should be 110-130°) and tracks lateral knee movement. Deductions are applied for knee angles outside the optimal range, lateral movement (valgus/varus), and asymmetry between left and right knees.'
          : exerciseType === 'squat'
          ? 'Evaluates if knees track over toes without excessive inward/outward movement and measures knee angle at the bottom (should be 90-110°). Deductions are applied for knee angles outside the optimal range, lateral movement, and asymmetry.'
          : 'Tracks stability of leg position during the press. Less emphasis on knees for bench press, but still monitors for proper foot placement and leg drive.';
        break;
        
      case 'spine_alignment':
        title = 'Spine Alignment';
        description = exerciseType === 'deadlift'
          ? 'Measures lumbar curve and tracks excessive rounding or hyperextension. Deductions are applied for excessive lumbar flexion (rounding), hyperextension of spine, lateral flexion (side bending), and inconsistent spine position.'
          : exerciseType === 'squat'
          ? 'Evaluates torso angle and spine curvature throughout the movement. Deductions are applied for excessive forward lean, lumbar flexion, lateral flexion, and inconsistent spine position.'
          : 'Tracks arching of the back and stability of the torso during the press. Evaluates proper arch without excessive hyperextension and stability throughout the movement.';
        break;
        
      case 'hip_stability':
        title = 'Hip Stability';
        description = exerciseType === 'deadlift'
          ? 'Tracks hip height at starting position, hip hinge pattern, and symmetry. Deductions are applied for asymmetrical hip position, excessive hip rotation, improper hip height at start position, and hip shift during movement.'
          : exerciseType === 'squat'
          ? 'Measures hip rotation, depth, and symmetry during descent and ascent. Deductions are applied for asymmetrical hip position, excessive hip rotation, and hip shift during movement.'
          : 'Evaluates hip position on bench and stability throughout the press. Monitors for excessive movement or shifting during the press.';
        break;
        
      case 'bar_path_efficiency':
        title = 'Bar Path Efficiency';
        description = exerciseType === 'deadlift'
          ? 'Tracks vertical bar path with minimal horizontal deviation. Deductions are applied for horizontal deviation from ideal path, inconsistent bar path between reps, bar path instability (wobbling), and improper bar position relative to body.'
          : exerciseType === 'squat'
          ? 'Measures bar path relative to mid-foot and evaluates consistency. Deductions are applied for horizontal deviation, inconsistent bar path, and bar path instability.'
          : 'Tracks bar path from rack to chest and back, evaluating straightness and consistency. For bench press, this is the most heavily weighted component (50% of overall score).';
        break;
        
      default:
        title = 'Score Information';
        description = 'This score evaluates your form based on biomechanical analysis of your movement patterns.';
    }
    
    setActiveScoreInfo({ title, description });
    setInfoModalVisible(true);
  }, [exerciseType]);
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={fitnessTheme.primary} />
          <Text style={styles.loadingText}>Analyzing your form...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* No Barbell Warning Banner */}
        {noBarbellDetected && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={24} color={fitnessTheme.text} />
            <Text style={styles.warningText}>
              No barbell was detected in this analysis. Results may not be accurate.
            </Text>
          </View>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Analysis Results</Text>
          
          {scores?.overall && (
            <View style={styles.overallScoreContainer}>
              <Text style={styles.overallScore}>
                {scores.overall !== undefined && scores.overall !== null ? scores.overall.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.overallScoreLabel}>/100</Text>
            </View>
          )}
        </View>
        
        {/* Video Analysis */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Video Analysis</Text>
          
          <View style={[styles.videoContainer, { height: videoHeight }]}>
            {videoError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={fitnessTheme.error} />
                <Text style={styles.errorText}>
                  {params.isRealTimeAnalysis === 'true' 
                    ? 'No Video Available' 
                    : 'Failed to load video'}
                </Text>
                <Text style={styles.errorSubtext}>
                  {params.isRealTimeAnalysis === 'true'
                    ? 'Real-time analyses don\'t save video recordings.'
                    : 'The video format may not be supported by your device.'}
                </Text>
                {params.isRealTimeAnalysis !== 'true' && (
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={() => {
                      setVideoError(false);
                      setLoadingVideo(true);
                      // Force refresh by setting videoUrl to null then back
                      setVideoUrl(null);
                      setTimeout(() => {
                        if (params.videoUrl) {
                          setVideoUrl(params.videoUrl);
                        }
                      }, 500);
                    }}
                  >
                    <Text style={styles.retryText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : videoUrl ? (
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body, html { margin: 0; padding: 0; height: 100%; background: ${fitnessTheme.background}; }
                        video { width: 100%; height: 100%; object-fit: contain; }
                      </style>
                    </head>
                    <body>
                      <video controls autoplay playsinline src="${videoUrl}"></video>
                    </body>
                    </html>
                  `
                }}
                style={styles.webView}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                originWhitelist={['*']}
                domStorageEnabled={true}
              />
            ) : null}
          </View>
        </View>
        
        {/* Radar Chart */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Form Analysis</Text>
          
          <View style={styles.radarChartContainer}>
            {(loadingChart || !radarChartUrl) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00FF88" />
                <Text style={styles.loadingText}>Loading analysis...</Text>
              </View>
            )}
            
            {radarChartUrl && (
              <Image
                source={{ uri: radarChartUrl }}
                style={styles.radarChart}
                onLoad={() => setLoadingChart(false)}
                onError={() => setLoadingChart(false)}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
        
        {/* Exercise Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Exercise Information</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Exercise Type:</Text>
              <Text style={styles.infoValue}>{getExerciseTitle()}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Body Weight:</Text>
              <Text style={styles.infoValue}>{bodyWeight} kg</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight Used:</Text>
              <Text style={styles.infoValue}>{weightUsed} kg</Text>
            </View>
          </View>
        </View>
        
        {/* Detailed Scores */}
        {scores && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Detailed Scores</Text>
            
            <View style={styles.scoresContainer}>
              {scores.knee_alignment !== undefined && (
                <View style={styles.scoreItem}>
                  <View style={styles.scoreLabelContainer}>
                    <Text style={styles.scoreLabel}>Knee Alignment</Text>
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={() => showScoreInfo('knee_alignment')}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={fitnessTheme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.knee_alignment) }]}>
                      {scores.knee_alignment !== null ? scores.knee_alignment.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.spine_alignment !== undefined && (
                <View style={styles.scoreItem}>
                  <View style={styles.scoreLabelContainer}>
                    <Text style={styles.scoreLabel}>Spine Alignment</Text>
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={() => showScoreInfo('spine_alignment')}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={fitnessTheme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.spine_alignment) }]}>
                      {scores.spine_alignment !== null ? scores.spine_alignment.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.hip_stability !== undefined && (
                <View style={styles.scoreItem}>
                  <View style={styles.scoreLabelContainer}>
                    <Text style={styles.scoreLabel}>Hip Stability</Text>
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={() => showScoreInfo('hip_stability')}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={fitnessTheme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.hip_stability) }]}>
                      {scores.hip_stability !== null ? scores.hip_stability.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.bar_path_efficiency !== undefined && (
                <View style={styles.scoreItem}>
                  <View style={styles.scoreLabelContainer}>
                    <Text style={styles.scoreLabel}>Bar Path Efficiency</Text>
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={() => showScoreInfo('bar_path_efficiency')}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={fitnessTheme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.bar_path_efficiency) }]}>
                      {scores.bar_path_efficiency !== null ? scores.bar_path_efficiency.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.form !== undefined && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Form</Text>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.form) }]}>
                      {scores.form !== null ? scores.form.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.stability !== undefined && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Stability</Text>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.stability) }]}>
                      {scores.stability !== null ? scores.stability.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.range_of_motion !== undefined && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Range of Motion</Text>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.range_of_motion) }]}>
                      {scores.range_of_motion !== null ? scores.range_of_motion.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {scores.tempo !== undefined && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Tempo</Text>
                  <View style={styles.scoreValueContainer}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(scores.tempo) }]}>
                      {scores.tempo !== null ? scores.tempo.toFixed(1) : '0.0'}/100
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Improvement Tips */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Form Improvement Tips</Text>
          
          <View style={styles.tipsContainer}>
            {feedback.length > 0 ? (
              feedback.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color={fitnessTheme.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tipItem}>
                <Ionicons name="information-circle" size={20} color={fitnessTheme.accent} />
                <Text style={styles.tipText}>
                  Great job! Keep practicing to improve your form and technique.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color={fitnessTheme.text} />
          <Text style={styles.actionButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={shareResults}
        >
          <Ionicons name="share-social" size={20} color={fitnessTheme.text} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={goToHome}
        >
          <Ionicons name="home" size={20} color={fitnessTheme.text} />
          <Text style={styles.actionButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Bar */}
      <TabBar />
      
      {/* Add the information modal */}
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeScoreInfo.title}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={fitnessTheme.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>{activeScoreInfo.description}</Text>
            
            <View style={styles.weightInfoContainer}>
              <Text style={styles.weightInfoTitle}>Score Weight in Overall Score:</Text>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Deadlift:</Text>
                <Text style={styles.weightValue}>
                  {activeScoreInfo.title === 'Knee Alignment' ? '20%' : 
                   activeScoreInfo.title === 'Spine Alignment' ? '35%' : 
                   activeScoreInfo.title === 'Hip Stability' ? '25%' : 
                   activeScoreInfo.title === 'Bar Path Efficiency' ? '20%' : ''}
                </Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Squat:</Text>
                <Text style={styles.weightValue}>
                  {activeScoreInfo.title === 'Knee Alignment' ? '30%' : 
                   activeScoreInfo.title === 'Spine Alignment' ? '25%' : 
                   activeScoreInfo.title === 'Hip Stability' ? '25%' : 
                   activeScoreInfo.title === 'Bar Path Efficiency' ? '20%' : ''}
                </Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Bench Press:</Text>
                <Text style={styles.weightValue}>
                  {activeScoreInfo.title === 'Knee Alignment' ? '10%' : 
                   activeScoreInfo.title === 'Spine Alignment' ? '20%' : 
                   activeScoreInfo.title === 'Hip Stability' ? '20%' : 
                   activeScoreInfo.title === 'Bar Path Efficiency' ? '50%' : ''}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: fitnessTheme.background,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 120, // Extra padding for the bottom action buttons
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: fitnessTheme.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: fitnessTheme.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  overallScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overallScore: {
    color: fitnessTheme.primary,
    fontSize: 36,
    fontWeight: 'bold',
  },
  overallScoreLabel: {
    color: fitnessTheme.textSecondary,
    fontSize: 16,
    marginLeft: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: fitnessTheme.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  videoContainer: {
    backgroundColor: fitnessTheme.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: fitnessTheme.surface,
    padding: 20,
  },
  errorText: {
    color: fitnessTheme.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: fitnessTheme.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: fitnessTheme.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: fitnessTheme.text,
    fontWeight: 'bold',
  },
  radarChartContainer: {
    width: '100%',
    height: 300,
    backgroundColor: fitnessTheme.surface,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarChart: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    backgroundColor: fitnessTheme.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    color: fitnessTheme.textMuted,
    fontSize: 16,
  },
  infoValue: {
    color: fitnessTheme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoresContainer: {
    backgroundColor: fitnessTheme.surface,
    borderRadius: 12,
    padding: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    color: fitnessTheme.text,
    fontSize: 16,
  },
  scoreValueContainer: {
    backgroundColor: fitnessTheme.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreValue: {
    color: fitnessTheme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: fitnessTheme.surface,
    borderRadius: 8,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  tipText: {
    color: fitnessTheme.text,
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 60, // Position above the tab bar
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: fitnessTheme.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: fitnessTheme.border,
    zIndex: 10, // Ensure it's above the tab bar
    elevation: 10, // For Android
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fitnessTheme.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: fitnessTheme.text,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  warningBanner: {
    backgroundColor: fitnessTheme.error,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    color: fitnessTheme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: fitnessTheme.background,
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: fitnessTheme.text,
  },
  closeButton: {
    padding: 8,
  },
  modalDescription: {
    color: fitnessTheme.text,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  weightInfoContainer: {
    marginBottom: 20,
  },
  weightInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: fitnessTheme.text,
    marginBottom: 8,
  },
  weightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weightLabel: {
    color: fitnessTheme.textMuted,
    fontSize: 14,
  },
  weightValue: {
    color: fitnessTheme.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: fitnessTheme.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoButton: {
    padding: 8,
    marginLeft: 4,
  },
}); 