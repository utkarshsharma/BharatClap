import "../../../global.css";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { formatPhone } from "@/utils/format";

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
}

export default function CustomerProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/welcome" as any);
        },
      },
    ]);
  };

  const comingSoon = (feature: string) => {
    Alert.alert("Coming Soon", `${feature} will be available in a future update.`);
  };

  const menuItems: MenuItem[] = [
    {
      label: "Edit Profile",
      icon: "👤",
      onPress: () => comingSoon("Edit Profile"),
    },
    {
      label: "My Addresses",
      icon: "📍",
      onPress: () => comingSoon("My Addresses"),
    },
    {
      label: "Favorite Providers",
      icon: "❤️",
      onPress: () => comingSoon("Favorite Providers"),
    },
    {
      label: "Notifications",
      icon: "🔔",
      onPress: () => comingSoon("Notifications"),
    },
    {
      label: "Help & Support",
      icon: "💬",
      onPress: () => comingSoon("Help & Support"),
    },
    {
      label: "About",
      icon: "ℹ️",
      onPress: () => comingSoon("About"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold text-secondary">Profile</Text>
        </View>

        {/* Profile Card */}
        <View className="items-center mt-4 mb-6">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-secondary">
            {user?.name ?? "Guest User"}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {user?.phone ? formatPhone(user.phone) : "No phone number"}
          </Text>
        </View>

        {/* Menu Items */}
        <View className="mx-5">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center py-4 ${
                index < menuItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: 20 }} className="mr-4">
                {item.icon}
              </Text>
              <Text className="flex-1 text-base text-secondary">{item.label}</Text>
              <Text className="text-gray-400 text-lg">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mx-5 mt-8 mb-8 py-4 rounded-xl border border-red-200 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-base font-semibold text-red-500">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
