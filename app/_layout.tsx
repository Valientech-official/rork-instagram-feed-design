import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useThemeStore } from "@/store/themeStore";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Handle font loading error
  useEffect(() => {
    if (error) {
      console.error("Error loading fonts:", error);
    }
  }, [error]);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { theme } = useThemeStore();

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
        <Stack.Screen name="cart" options={{ title: "Shopping Cart" }} />
        <Stack.Screen name="live/index" options={{ title: "Live Streams" }} />
        <Stack.Screen name="live/[id]" options={{ title: "Live Stream" }} />
        <Stack.Screen name="live/create" options={{ title: "Go Live" }} />
        <Stack.Screen name="followers" options={{ title: "Followers" }} />
        <Stack.Screen name="following" options={{ title: "Following" }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="saved" options={{ title: "Saved Items" }} />
        <Stack.Screen name="split-view" options={{ title: "Split View" }} />
      </Stack>
    </SafeAreaProvider>
  );
}