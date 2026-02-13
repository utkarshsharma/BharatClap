import "../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, UpdateUserData } from "@/services/users";
import { useAuthStore } from "@/store/authStore";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "kn", label: "Kannada" },
] as const;

const CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
] as const;

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setCity = useAuthStore((s) => s.setCity);
  const authUser = useAuthStore((s) => s.user);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: userService.getProfile,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCity, setSelectedCity] = useState("Bangalore");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setSelectedCity(profile.city ?? "Bangalore");
      setSelectedLanguage(profile.preferredLanguage ?? "en");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserData) => userService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Sync auth store with updated data
      setUser({
        id: updatedProfile.id,
        phone: updatedProfile.phone,
        name: updatedProfile.name,
        email: updatedProfile.email,
        avatar: updatedProfile.avatarUrl,
      });
      if (updatedProfile.city) {
        setCity(updatedProfile.city);
      }
      // Invalidate cached profile data
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });

      Alert.alert("Success", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Validation", "Please enter a valid email address.");
      return;
    }

    const data: UpdateUserData = {
      name: name.trim(),
      city: selectedCity,
      preferredLanguage: selectedLanguage,
    };

    if (email.trim()) {
      data.email = email.trim();
    }

    updateMutation.mutate(data);
  };

  const initials = (name || authUser?.phone || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-gray-500 mt-3">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const languageLabel =
    LANGUAGES.find((l) => l.code === selectedLanguage)?.label ?? "English";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-1"
            activeOpacity={0.7}
          >
            <Text className="text-2xl text-secondary">{"\u2190"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-secondary flex-1">
            Edit Profile
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Avatar Section */}
          <View className="items-center py-8">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-white">{initials}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-sm font-semibold text-primary">
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="px-5">
            {/* Name */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-secondary mb-2">
                Full Name
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3.5 text-base text-secondary"
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-secondary mb-2">
                Email Address
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3.5 text-base text-secondary"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone (read-only) */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-secondary mb-2">
                Phone Number
              </Text>
              <View className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50">
                <Text className="text-base text-gray-500">
                  {profile?.phone ?? authUser?.phone ?? "Not set"}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">
                Phone number cannot be changed
              </Text>
            </View>

            {/* City Picker */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-secondary mb-2">
                City
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCityPicker(!showCityPicker);
                  setShowLanguagePicker(false);
                }}
                className="border border-gray-300 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                activeOpacity={0.7}
              >
                <Text className="text-base text-secondary">
                  {selectedCity}
                </Text>
                <Text className="text-gray-400">
                  {showCityPicker ? "\u25B2" : "\u25BC"}
                </Text>
              </TouchableOpacity>
              {showCityPicker && (
                <View className="border border-gray-200 rounded-xl mt-2 overflow-hidden">
                  {CITIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        setSelectedCity(c);
                        setShowCityPicker(false);
                      }}
                      className={`px-4 py-3 border-b border-gray-100 ${
                        c === selectedCity ? "bg-orange-50" : "bg-white"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-base ${
                          c === selectedCity
                            ? "text-primary font-semibold"
                            : "text-secondary"
                        }`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Language Picker */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-secondary mb-2">
                Preferred Language
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLanguagePicker(!showLanguagePicker);
                  setShowCityPicker(false);
                }}
                className="border border-gray-300 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                activeOpacity={0.7}
              >
                <Text className="text-base text-secondary">
                  {languageLabel}
                </Text>
                <Text className="text-gray-400">
                  {showLanguagePicker ? "\u25B2" : "\u25BC"}
                </Text>
              </TouchableOpacity>
              {showLanguagePicker && (
                <View className="border border-gray-200 rounded-xl mt-2 overflow-hidden">
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguagePicker(false);
                      }}
                      className={`px-4 py-3 border-b border-gray-100 ${
                        lang.code === selectedLanguage
                          ? "bg-orange-50"
                          : "bg-white"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-base ${
                          lang.code === selectedLanguage
                            ? "text-primary font-semibold"
                            : "text-secondary"
                        }`}
                      >
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateMutation.isPending}
              className={`py-4 rounded-xl items-center ${
                updateMutation.isPending ? "bg-gray-300" : "bg-primary"
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-lg font-bold text-white">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
