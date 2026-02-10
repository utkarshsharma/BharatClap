import "../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CONFIG } from "@/constants/config";

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidPhone = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

  const handlePhoneChange = (text: string) => {
    // Only allow digits, max 10 characters
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(cleaned);
    if (error) setError("");
  };

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit Indian phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate OTP sending delay (Firebase not configured yet)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to OTP screen with the phone number
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: `${CONFIG.PHONE_PREFIX}${phone}` },
      });
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-12">
          {/* Header */}
          <View className="mb-12">
            <Text className="text-3xl font-bold text-secondary mb-2">
              Welcome to
            </Text>
            <Text className="text-3xl font-bold text-primary">BharatClap</Text>
            <Text className="text-base text-gray-500 mt-3">
              Your trusted service marketplace. Enter your phone number to get
              started.
            </Text>
          </View>

          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-secondary mb-2">
              Phone Number
            </Text>
            <View
              className={`flex-row items-center border rounded-xl px-4 py-1 ${
                error
                  ? "border-red-500"
                  : phone.length > 0
                  ? "border-primary"
                  : "border-gray-300"
              }`}
            >
              {/* Prefix */}
              <View className="flex-row items-center mr-3 pr-3 border-r border-gray-300">
                <Text className="text-base text-secondary font-medium">
                  {CONFIG.PHONE_PREFIX}
                </Text>
              </View>

              {/* Input */}
              <TextInput
                className="flex-1 text-base text-secondary py-3"
                placeholder="Enter 10-digit number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={handlePhoneChange}
                editable={!isLoading}
                autoFocus
              />

              {/* Validation indicator */}
              {phone.length === 10 && (
                <Text className="text-lg">
                  {isValidPhone ? "\u2705" : "\u274C"}
                </Text>
              )}
            </View>

            {/* Error message */}
            {error ? (
              <Text className="text-sm text-red-500 mt-2">{error}</Text>
            ) : null}

            {/* Helper text */}
            <Text className="text-xs text-gray-400 mt-2">
              We will send a {CONFIG.OTP_LENGTH}-digit verification code to this
              number
            </Text>
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={!isValidPhone || isLoading}
            className={`py-4 rounded-xl items-center ${
              isValidPhone && !isLoading ? "bg-primary" : "bg-gray-300"
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white text-lg font-bold ml-2">
                  Sending...
                </Text>
              </View>
            ) : (
              <Text
                className={`text-lg font-bold ${
                  isValidPhone ? "text-white" : "text-gray-500"
                }`}
              >
                Send OTP
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View className="mt-8 items-center">
            <Text className="text-xs text-gray-400 text-center leading-5">
              By continuing, you agree to our{" "}
              <Text className="text-primary">Terms of Service</Text> and{" "}
              <Text className="text-primary">Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
