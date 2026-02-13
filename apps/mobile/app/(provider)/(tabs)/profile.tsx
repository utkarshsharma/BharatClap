import "../../../global.css";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { providerService } from "@/services/providers";
import { useAuthStore } from "@/store/authStore";
import { formatRating } from "@/utils/format";

interface MenuItem {
  label: string;
  onPress: () => void;
  textColor?: string;
}

export default function ProviderProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: providerService.getOwnProfile,
  });

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login" as any);
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      label: "Edit Profile",
      onPress: () => router.push("/(common)/edit-profile" as any),
    },
    {
      label: "My Services",
      onPress: () => router.push("/(provider)/onboarding/services" as any),
    },
    {
      label: "Availability",
      onPress: () => router.push("/(provider)/onboarding/availability" as any),
    },
    {
      label: "Portfolio",
      onPress: () => router.push("/(provider)/onboarding/portfolio" as any),
    },
    {
      label: "Bank & Payments",
      onPress: () => router.push("/(provider)/onboarding/bank" as any),
    },
    {
      label: "Earnings",
      onPress: () => router.push("/(provider)/earnings" as any),
    },
    {
      label: "KYC Verification",
      onPress: () => router.push("/(provider)/kyc" as any),
    },
    {
      label: "Settings",
      onPress: () => router.push("/(common)/settings" as any),
    },
    {
      label: "Logout",
      onPress: handleLogout,
      textColor: "text-[#F44336]",
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold text-[#1A1A2E]">Profile</Text>
        </View>

        {/* Profile Header - Tappable to edit */}
        <TouchableOpacity
          onPress={() => router.push("/(common)/edit-profile" as any)}
          activeOpacity={0.7}
          className="mx-5 mt-2 bg-gray-50 rounded-2xl p-5 mb-4"
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-[#FF6B00] items-center justify-center mr-4">
              <Text className="text-xl font-bold text-white">
                {getInitials(profile?.name ?? user?.name)}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-0.5">
                <Text className="text-lg font-bold text-[#1A1A2E]">
                  {profile?.name ?? user?.name ?? "Provider"}
                </Text>
                {profile?.isVerified && (
                  <View className="ml-2 bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-[#4CAF50] font-semibold">Verified</Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-[#757575]">
                {profile?.phone ?? user?.phone ?? ""}
              </Text>
              {profile?.city && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  {profile.city}
                </Text>
              )}
            </View>
            <Text className="text-gray-400 text-lg">{"\u203A"}</Text>
          </View>
        </TouchableOpacity>

        {/* Rating & Stats */}
        <View className="mx-5 bg-[#FFF3E0] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#FF6B00]">
                {profile?.rating ? formatRating(profile.rating) : "0.0"} {"\u2605"}
              </Text>
              <Text className="text-xs text-[#757575] mt-1">Rating</Text>
            </View>
            <View className="w-px h-10 bg-[#FFD9B3]" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#1A1A2E]">
                {profile?.completedBookings ?? 0}
              </Text>
              <Text className="text-xs text-[#757575] mt-1">Total Jobs</Text>
            </View>
            <View className="w-px h-10 bg-[#FFD9B3]" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#1A1A2E]">
                {profile?.reviewCount ?? 0}
              </Text>
              <Text className="text-xs text-[#757575] mt-1">Reviews</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row mx-5 mb-4">
          <View className="flex-1 bg-gray-50 rounded-xl p-3 mr-2">
            <Text className="text-xs text-[#757575]">Completion Rate</Text>
            <Text className="text-base font-bold text-[#1A1A2E] mt-1">
              {profile?.completedBookings
                ? `${Math.min(100, Math.round((profile.completedBookings / Math.max(profile.completedBookings, 1)) * 100))}%`
                : "N/A"}
            </Text>
          </View>
          <View className="flex-1 bg-gray-50 rounded-xl p-3 ml-2">
            <Text className="text-xs text-[#757575]">City</Text>
            <Text className="text-base font-bold text-[#1A1A2E] mt-1">
              {profile?.city ?? "Not set"}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mx-5 mb-8">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              activeOpacity={0.6}
              className={`flex-row items-center justify-between py-4 ${
                index < menuItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <Text
                className={`text-base ${
                  item.textColor ?? "text-[#1A1A2E]"
                }`}
              >
                {item.label}
              </Text>
              <Text className="text-[#757575] text-lg">{"\u203A"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
