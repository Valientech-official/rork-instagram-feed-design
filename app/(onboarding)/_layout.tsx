import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
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
  );
}
