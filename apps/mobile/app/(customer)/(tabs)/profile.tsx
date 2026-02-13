import "../../../global.css";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/users";
import { useAuthStore } from "@/store/authStore";
import { formatPhone } from "@/utils/format";

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
}

export default function CustomerProfileScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: userService.getProfile,
  });

  const displayName = profile?.name ?? authUser?.name ?? "Guest User";
  const displayPhone = profile?.phone ?? authUser?.phone;
  const displayEmail = profile?.email ?? authUser?.email;
  const displayCity = profile?.city;

  const initials = (displayName)
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

  const menuItems: MenuItem[] = [
    {
      label: "Edit Profile",
      icon: "\u270F\uFE0F",
      onPress: () => router.push("/(common)/edit-profile" as any),
    },
    {
      label: "My Addresses",
      icon: "\uD83D\uDCCD",
      onPress: () => Alert.alert("Coming Soon", "Address management will be available in a future update."),
    },
    {
      label: "Favorite Providers",
      icon: "\u2764\uFE0F",
      onPress: () => router.push("/(customer)/favorites" as any),
    },
    {
      label: "Notifications",
      icon: "\uD83D\uDD14",
      onPress: () => router.push("/(customer)/notifications" as any),
    },
    {
      label: "Help & Support",
      icon: "\uD83D\uDCAC",
      onPress: () => router.push("/(customer)/help" as any),
    },
    {
      label: "Settings",
      icon: "\u2699\uFE0F",
      onPress: () => router.push("/(common)/settings" as any),
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
        <TouchableOpacity
          onPress={() => router.push("/(common)/edit-profile" as any)}
          activeOpacity={0.7}
          className="mx-5 mt-4 mb-6 bg-gray-50 rounded-2xl p-5"
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-4">
              <Text className="text-white text-xl font-bold">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-secondary">
                {displayName}
              </Text>
              {displayPhone && (
                <Text className="text-sm text-gray-500 mt-0.5">
                  {formatPhone(displayPhone)}
                </Text>
              )}
              {displayEmail && (
                <Text className="text-sm text-gray-500 mt-0.5">
                  {displayEmail}
                </Text>
              )}
              {displayCity && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  {displayCity}
                </Text>
              )}
            </View>
            <Text className="text-gray-400 text-lg">{"\u203A"}</Text>
          </View>
          {isLoading && (
            <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 8 }} />
          )}
        </TouchableOpacity>

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
              <Text className="text-gray-400 text-lg">{"\u203A"}</Text>
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
