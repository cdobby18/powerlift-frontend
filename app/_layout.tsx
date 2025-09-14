import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../hooks/useAuth';
import { ErrorToastProvider } from '../hooks/useErrorToast';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Black': require('../assets/fonts/Montserrat-Black.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ErrorToastProvider>
        <ThemeProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="guest-login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="realtime-analysis" />
              <Stack.Screen name="video-analysis" />
              <Stack.Screen name="theme-customization" />
              <Stack.Screen name="results" />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="live" />
            </Stack>
            <StatusBar style="light" />
          </NavigationThemeProvider>
        </ThemeProvider>
      </ErrorToastProvider>
    </AuthProvider>
  );
}
