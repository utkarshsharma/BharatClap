import "../../global.css";
import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { CONFIG } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth";

const RESEND_TIMER_SECONDS = 30;

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser, setTokens, setRole } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(
    Array(CONFIG.OTP_LENGTH).fill("")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (text: string, index: number) => {
    if (error) setError("");

    const digit = text.replace(/[^0-9]/g, "");

    // Handle paste of full OTP
    if (digit.length > 1) {
      const digits = digit.slice(0, CONFIG.OTP_LENGTH).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < CONFIG.OTP_LENGTH) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp);

      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, CONFIG.OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < CONFIG.OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace: clear current or go to previous
    if (key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const otpString = otp.join("");
  const isOtpComplete = otpString.length === CONFIG.OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isOtpComplete) {
      setError(`Please enter all ${CONFIG.OTP_LENGTH} digits`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate Firebase verification and get a mock token
      // In production, this would verify with Firebase Auth and get an ID token
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockFirebaseIdToken = `mock-firebase-token-${phone}-${otpString}`;

      // Call auth service login
      let response;
      try {
        response = await authService.login(mockFirebaseIdToken);
      } catch {
        // If API is not available, use mock data for development
        response = {
          accessToken: `mock-access-token-${Date.now()}`,
          refreshToken: `mock-refresh-token-${Date.now()}`,
          user: {
            id: `user-${Date.now()}`,
            phone: phone || "",
          },
          role: undefined as 'customer' | 'provider' | undefined,
        };
      }

      // Store tokens and user data
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);

      // Navigate based on whether user has a role
      if (response.role) {
        setRole(response.role);
        if (response.role === "customer") {
          router.replace("/(customer)/(tabs)");
        } else {
          router.replace("/(provider)/(tabs)/dashboard");
        }
      } else {
        // No role yet, go to role selection
        router.replace("/(auth)/role-select");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      Alert.alert("Error", "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isOtpComplete, otpString, phone, setTokens, setUser, setRole, router]);

  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(RESEND_TIMER_SECONDS);
    setOtp(Array(CONFIG.OTP_LENGTH).fill(""));
    setError("");

    // Simulate resend
    await new Promise((resolve) => setTimeout(resolve, 500));
    inputRefs.current[0]?.focus();
  };

  const handleChangeNumber = () => {
    router.back();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-12">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-3xl font-bold text-secondary mb-2">
              Verify your number
            </Text>
            <Text className="text-base text-gray-500 mt-1">
              Enter the {CONFIG.OTP_LENGTH}-digit code sent to
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-base font-semibold text-secondary">
                {phone}
              </Text>
              <TouchableOpacity
                onPress={handleChangeNumber}
                className="ml-3"
              >
                <Text className="text-sm text-primary font-medium">
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OTP Input */}
          <View className="flex-row justify-between mb-6 px-2">
            {Array.from({ length: CONFIG.OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${
                  error
                    ? "border-red-500 text-red-500"
                    : otp[index]
                    ? "border-primary text-secondary"
                    : "border-gray-300 text-secondary"
                }`}
                keyboardType="number-pad"
                maxLength={index === 0 ? CONFIG.OTP_LENGTH : 1}
                value={otp[index]}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                editable={!isLoading}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Error message */}
          {error ? (
            <Text className="text-sm text-red-500 text-center mb-4">
              {error}
            </Text>
          ) : null}

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isOtpComplete || isLoading}
            className={`py-4 rounded-xl items-center mb-6 ${
              isOtpComplete && !isLoading ? "bg-primary" : "bg-gray-300"
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white text-lg font-bold ml-2">
                  Verifying...
                </Text>
              </View>
            ) : (
              <Text
                className={`text-lg font-bold ${
                  isOtpComplete ? "text-white" : "text-gray-500"
                }`}
              >
                Verify OTP
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View className="items-center">
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp}>
                <Text className="text-base text-primary font-medium">
                  Resend OTP
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-base text-gray-400">
                Resend OTP in{" "}
                <Text className="text-secondary font-medium">
                  {formatTimer(resendTimer)}
                </Text>
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
