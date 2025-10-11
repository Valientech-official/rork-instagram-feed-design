import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import OnboardingProgress from '../../components/onboarding/OnboardingProgress';
import { useAuthStore } from '../../store/authStore';

export default function OnboardingLayout() {
  const { onboardingStep } = useAuthStore();
  const totalSteps = 7;

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={onboardingStep} totalSteps={totalSteps} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="avatar" />
        <Stack.Screen name="styles" />
        <Stack.Screen name="genres" />
        <Stack.Screen name="brands" />
        <Stack.Screen name="social" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
