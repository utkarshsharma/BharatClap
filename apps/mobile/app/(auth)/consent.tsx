import "../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/authStore";

// ---------- Constants ----------
const CONSENT_STORAGE_KEY = "bharatclap_dpdp_consent";

interface ConsentState {
  locationData: boolean;
  notifications: boolean;
  aadhaarData: boolean;
  consentTimestamp: string | null;
}

const DEFAULT_CONSENT: ConsentState = {
  locationData: false,
  notifications: false,
  aadhaarData: false,
  consentTimestamp: null,
};

// ---------- Screen ----------
export default function DPDPConsentScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isProvider = role === "provider";

  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load saved consent on mount
  useEffect(() => {
    const loadConsent = async () => {
      try {
        const saved = await SecureStore.getItemAsync(CONSENT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ConsentState;
          setConsent(parsed);
        }
      } catch {
        // Ignore errors, start with defaults
      } finally {
        setLoading(false);
      }
    };
    loadConsent();
  }, []);

  // Required consents must be checked
  const requiredConsentsMet = consent.locationData;

  const toggleConsent = (key: keyof ConsentState) => {
    if (key === "consentTimestamp") return;
    setConsent((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAgreeAndContinue = async () => {
    if (!requiredConsentsMet) {
      Alert.alert(
        "Required Consent",
        "You must allow location data access to use BharatClap services."
      );
      return;
    }

    setSubmitting(true);
    try {
      const consentData: ConsentState = {
        ...consent,
        consentTimestamp: new Date().toISOString(),
      };

      // Persist consent locally
      await SecureStore.setItemAsync(CONSENT_STORAGE_KEY, JSON.stringify(consentData));

      // TODO: Send consent to backend:
      // await api.post('/auth/consent', {
      //   locationData: consentData.locationData,
      //   notifications: consentData.notifications,
      //   aadhaarData: consentData.aadhaarData,
      //   timestamp: consentData.consentTimestamp,
      // });

      // Navigate forward based on role
      if (isProvider) {
        router.replace("/(provider)/(tabs)/dashboard" as any);
      } else {
        router.replace("/(customer)/(tabs)" as any);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to save consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrivacyPolicy = () => {
    // TODO: Replace with actual privacy policy URL
    Linking.openURL("https://bharatclap.com/privacy-policy").catch(() => {
      Alert.alert("Error", "Unable to open privacy policy link.");
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-4">
          <View className="w-16 h-16 rounded-2xl bg-[#FF6B00]/10 items-center justify-center mb-5">
            <Text style={{ fontSize: 32 }}>{"🛡️"}</Text>
          </View>
          <Text className="text-2xl font-bold text-[#1A1A2E] mb-2">
            Data & Privacy Consent
          </Text>
          <Text className="text-sm text-[#757575] leading-5">
            BharatClap complies with the Digital Personal Data Protection (DPDP) Act, 2023.
            We need your consent to process certain data for providing you the best experience.
          </Text>
        </View>

        {/* Consent Toggles */}
        <View className="px-6 mt-2">

          {/* 1. Location Data (Required) */}
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Text style={{ fontSize: 18 }}>{"📍"}</Text>
                  <Text className="text-base font-bold text-[#1A1A2E] ml-2">
                    Location Data
                  </Text>
                  <View className="ml-2 bg-[#FF6B00]/10 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-[#FF6B00]">REQUIRED</Text>
                  </View>
                </View>
                <Text className="text-sm text-[#757575] leading-5 mt-1">
                  Allow BharatClap to use your location to find nearby services and connect
                  you with service providers in your area.
                </Text>
              </View>
              <Switch
                value={consent.locationData}
                onValueChange={() => toggleConsent("locationData")}
                trackColor={{ false: "#E0E0E0", true: "#FF6B00" }}
                thumbColor={consent.locationData ? "#FFFFFF" : "#F5F5F5"}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>

          {/* 2. Notifications (Optional) */}
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Text style={{ fontSize: 18 }}>{"🔔"}</Text>
                  <Text className="text-base font-bold text-[#1A1A2E] ml-2">
                    Notifications
                  </Text>
                  <View className="ml-2 bg-gray-100 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-[#757575]">OPTIONAL</Text>
                  </View>
                </View>
                <Text className="text-sm text-[#757575] leading-5 mt-1">
                  Receive booking updates, status changes, payment confirmations, and
                  promotional offers via push notifications.
                </Text>
              </View>
              <Switch
                value={consent.notifications}
                onValueChange={() => toggleConsent("notifications")}
                trackColor={{ false: "#E0E0E0", true: "#FF6B00" }}
                thumbColor={consent.notifications ? "#FFFFFF" : "#F5F5F5"}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>

          {/* 3. Aadhaar Data (Provider-only, Optional) */}
          {isProvider && (
            <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <Text style={{ fontSize: 18 }}>{"🪪"}</Text>
                    <Text className="text-base font-bold text-[#1A1A2E] ml-2">
                      Aadhaar Verification
                    </Text>
                    <View className="ml-2 bg-gray-100 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-[#757575]">OPTIONAL</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-[#757575] leading-5 mt-1">
                    Share your Aadhaar details for identity verification. This helps build
                    trust with customers and gives you a verified badge on your profile.
                  </Text>
                </View>
                <Switch
                  value={consent.aadhaarData}
                  onValueChange={() => toggleConsent("aadhaarData")}
                  trackColor={{ false: "#E0E0E0", true: "#FF6B00" }}
                  thumbColor={consent.aadhaarData ? "#FFFFFF" : "#F5F5F5"}
                  ios_backgroundColor="#E0E0E0"
                />
              </View>
            </View>
          )}
        </View>

        {/* Info box */}
        <View className="mx-6 mt-4 bg-[#E3F2FD] rounded-2xl p-4">
          <View className="flex-row items-start">
            <Text style={{ fontSize: 16 }}>{"ℹ️"}</Text>
            <View className="flex-1 ml-2">
              <Text className="text-sm font-semibold text-[#1565C0] mb-1">
                Your Data Rights
              </Text>
              <Text className="text-xs text-[#1565C0] leading-4">
                Under the DPDP Act 2023, you have the right to access, correct, and delete your
                personal data at any time. You can withdraw consent from Settings. Required
                consents are needed for core service functionality.
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Policy Link */}
        <TouchableOpacity
          onPress={handlePrivacyPolicy}
          className="mx-6 mt-4 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-sm text-[#FF6B00] font-semibold underline">
            Read our full Privacy Policy
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Agree & Continue Button */}
      <View className="px-6 py-4 pb-8 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleAgreeAndContinue}
          disabled={!requiredConsentsMet || submitting}
          activeOpacity={0.8}
          className={`py-4 rounded-xl items-center ${
            requiredConsentsMet && !submitting ? "bg-[#FF6B00]" : "bg-gray-300"
          }`}
        >
          {submitting ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-white text-lg font-bold ml-2">Saving...</Text>
            </View>
          ) : (
            <Text
              className={`text-lg font-bold ${
                requiredConsentsMet ? "text-white" : "text-gray-500"
              }`}
            >
              I Agree & Continue
            </Text>
          )}
        </TouchableOpacity>

        {!requiredConsentsMet && (
          <Text className="text-xs text-[#F44336] text-center mt-2">
            Location data consent is required to use BharatClap
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
