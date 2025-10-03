import React from "react";
import { Tabs } from "expo-router";
import { Home, Search, PlusSquare, Heart, User, DoorOpen, Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.text,
        tabBarInactiveTintColor: Colors.light.secondaryText,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: Colors.light.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 50 + insets.bottom, // Adjust for bottom safe area
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => (
            <View style={styles.createButton}>
              <Plus size={28} color="white" strokeWidth={3} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: "Room",
          tabBarIcon: ({ color, size }) => <DoorOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="live-tab"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="user_search"
        options={{
          href: null, // Hide from tab bar (access via header icon only)
          title: "User Search",
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          href: null, // Hide from tab bar (access via header icon only)
          title: "Notifications",
        }}
      />
      <Tabs.Screen
        name="dm"
        options={{
          href: null, // Hide from tab bar (access via header icon only)
          title: "Messages",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});