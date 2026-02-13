import "../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/users";
import { useAuthStore } from "@/store/authStore";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "kn", label: "Kannada" },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: userService.getProfile,
  });

  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.preferredLanguage) setSelectedLanguage(profile.preferredLanguage);
      setPushNotifications((profile as any).notifPush ?? true);
      setWhatsappNotifications((profile as any).notifWhatsapp ?? false);
      setBookingNotifications((profile as any).notifBooking ?? true);
      setPromoNotifications((profile as any).notifPromo ?? true);
    }
  }, [profile]);

  const updateLanguageMutation = useMutation({
    mutationFn: (langCode: string) =>
      userService.updateProfile({ preferredLanguage: langCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => {
      // Revert on error
      if (profile?.preferredLanguage) {
        setSelectedLanguage(profile.preferredLanguage);
      }
      Alert.alert("Error", "Failed to update language preference.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: () => {
      Alert.alert(
        "Account Deleted",
        "Your account has been deleted. You will be logged out.",
        [
          {
            text: "OK",
            onPress: () => {
              logout();
              router.replace("/(auth)/login" as any);
            },
          },
        ]
      );
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete account. Please try again.");
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: () => userService.exportData(),
    onSuccess: (data) => {
      Alert.alert(
        "Data Exported",
        `Your data has been exported successfully. Export contains ${Object.keys(data).length} sections of data.`,
        [{ text: "OK" }]
      );
    },
    onError: () => {
      Alert.alert("Error", "Failed to export data. Please try again.");
    },
  });

  const handleNotifToggle = async (field: string, value: boolean) => {
    setSavingNotif(true);
    try {
      await userService.updateProfile({ [field]: value } as any);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    } catch {
      // Revert on error
      if (field === "notifPush") setPushNotifications(!value);
      if (field === "notifWhatsapp") setWhatsappNotifications(!value);
      if (field === "notifBooking") setBookingNotifications(!value);
      if (field === "notifPromo") setPromoNotifications(!value);
      Alert.alert("Error", "Failed to update notification preference.");
    } finally {
      setSavingNotif(false);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    updateLanguageMutation.mutate(langCode);
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Download all your personal data stored on BharatClap?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => exportDataMutation.mutate(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "This cannot be undone. All your bookings, reviews, and personal data will be deleted.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete My Account",
                  style: "destructive",
                  onPress: () => deleteAccountMutation.mutate(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
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

  return (
    <SafeAreaView className="flex-1 bg-white">
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
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Language Section */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Language
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            {LANGUAGES.map((lang, index) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                disabled={updateLanguageMutation.isPending}
                className={`flex-row items-center justify-between px-4 py-3.5 ${
                  index < LANGUAGES.length - 1 ? "border-b border-gray-100" : ""
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
                <View className="flex-row items-center">
                  {updateLanguageMutation.isPending &&
                    updateLanguageMutation.variables === lang.code && (
                      <ActivityIndicator
                        size="small"
                        color="#FF6B00"
                        style={{ marginRight: 8 }}
                      />
                    )}
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      lang.code === selectedLanguage
                        ? "border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {lang.code === selectedLanguage && (
                      <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notification Preferences */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Notifications
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text className="text-base text-secondary font-medium">
                  Push Notifications
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Receive alerts on your device
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={(v) => { setPushNotifications(v); handleNotifToggle("notifPush", v); }}
                trackColor={{ false: "#D1D5DB", true: "#FFCEA0" }}
                thumbColor={pushNotifications ? "#FF6B00" : "#9CA3AF"}
              />
            </View>

            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text className="text-base text-secondary font-medium">
                  WhatsApp Notifications
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Get updates on WhatsApp
                </Text>
              </View>
              <Switch
                value={whatsappNotifications}
                onValueChange={(v) => { setWhatsappNotifications(v); handleNotifToggle("notifWhatsapp", v); }}
                trackColor={{ false: "#D1D5DB", true: "#FFCEA0" }}
                thumbColor={whatsappNotifications ? "#FF6B00" : "#9CA3AF"}
              />
            </View>

            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text className="text-base text-secondary font-medium">
                  Booking Updates
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Status changes and reminders
                </Text>
              </View>
              <Switch
                value={bookingNotifications}
                onValueChange={(v) => { setBookingNotifications(v); handleNotifToggle("notifBooking", v); }}
                trackColor={{ false: "#D1D5DB", true: "#FFCEA0" }}
                thumbColor={bookingNotifications ? "#FF6B00" : "#9CA3AF"}
              />
            </View>

            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-1 mr-3">
                <Text className="text-base text-secondary font-medium">
                  Promotional
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Deals, offers, and new services
                </Text>
              </View>
              <Switch
                value={promoNotifications}
                onValueChange={(v) => { setPromoNotifications(v); handleNotifToggle("notifPromo", v); }}
                trackColor={{ false: "#D1D5DB", true: "#FFCEA0" }}
                thumbColor={promoNotifications ? "#FF6B00" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Account
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <TouchableOpacity
              onPress={handleExportData}
              disabled={exportDataMutation.isPending}
              className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="text-lg mr-3">{"\uD83D\uDCE4"}</Text>
                <Text className="text-base text-secondary">Export My Data</Text>
              </View>
              {exportDataMutation.isPending ? (
                <ActivityIndicator size="small" color="#FF6B00" />
              ) : (
                <Text className="text-gray-400">{"\u203A"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              className="flex-row items-center justify-between px-4 py-3.5"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="text-lg mr-3">{"\uD83D\uDDD1\uFE0F"}</Text>
                <Text className="text-base text-red-500 font-medium">
                  Delete Account
                </Text>
              </View>
              {deleteAccountMutation.isPending ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <Text className="text-gray-400">{"\u203A"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            About
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <Text className="text-base text-secondary">App Version</Text>
              <Text className="text-sm text-gray-500">1.0.0</Text>
            </View>

            <TouchableOpacity
              onPress={() => Linking.openURL("https://bharatclap.in/privacy")}
              className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <Text className="text-base text-secondary">Privacy Policy</Text>
              <Text className="text-gray-400">{"\u203A"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("https://bharatclap.in/terms")}
              className="flex-row items-center justify-between px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Text className="text-base text-secondary">
                Terms of Service
              </Text>
              <Text className="text-gray-400">{"\u203A"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-5 pt-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="py-4 rounded-xl items-center border-2 border-red-500"
            activeOpacity={0.8}
          >
            <Text className="text-lg font-bold text-red-500">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center mt-6">
          <Text className="text-xs text-gray-400">
            Made with care in India
          </Text>
          <Text className="text-xs text-gray-300 mt-1">
            BharatClap v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
