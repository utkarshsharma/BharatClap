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
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/services/firebase";
import { CONFIG } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth";
import api from "@/services/api";

const RESEND_TIMER_SECONDS = 30;

export default function OtpScreen() {
  const router = useRouter();
  const { phone, verificationId, devMode } = useLocalSearchParams<{
    phone: string;
    verificationId?: string;
    devMode?: string;
  }>();
  const { setUser, setTokens, setRole } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(
    Array(CONFIG.OTP_LENGTH).fill("")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

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

    if (digit.length > 1) {
      const digits = digit.slice(0, CONFIG.OTP_LENGTH).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < CONFIG.OTP_LENGTH) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, CONFIG.OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < CONFIG.OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
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
      let firebaseIdToken: string;

      if (devMode === "true") {
        // Dev mode: use backend dev login directly
        const res = await api.post("/auth/login/dev", { phone });
        const { user, accessToken, refreshToken } = res.data;

        setTokens(accessToken, refreshToken);
        setUser({ id: user.id, phone: user.phone, name: user.name });

        const userRole = user.role?.toLowerCase();
        if (userRole === "customer" || userRole === "provider") {
          setRole(userRole);
          if (userRole === "customer") {
            router.replace("/(customer)/(tabs)");
          } else {
            router.replace("/(provider)/(tabs)/dashboard");
          }
        } else {
          router.replace("/(auth)/role-select");
        }
        return;
      }

      // Firebase flow: verify OTP and get ID token
      if (!verificationId) {
        throw new Error("Missing verification ID");
      }

      const credential = PhoneAuthProvider.credential(verificationId, otpString);
      const userCredential = await signInWithCredential(auth, credential);
      firebaseIdToken = await userCredential.user.getIdToken();

      // Send Firebase ID token to backend
      const response = await authService.login(firebaseIdToken);

      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);

      if (response.user && (response.user as any).role) {
        const role = (response.user as any).role.toLowerCase();
        if (role === "customer" || role === "provider") {
          setRole(role);
          if (role === "customer") {
            router.replace("/(customer)/(tabs)");
          } else {
            router.replace("/(provider)/(tabs)/dashboard");
          }
        } else {
          router.replace("/(auth)/role-select");
        }
      } else {
        router.replace("/(auth)/role-select");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Verification failed";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  }, [isOtpComplete, otpString, phone, verificationId, devMode, setTokens, setUser, setRole, router]);

  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(RESEND_TIMER_SECONDS);
    setOtp(Array(CONFIG.OTP_LENGTH).fill(""));
    setError("");
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
              {devMode === "true"
                ? "Enter any 6 digits to continue (dev mode)"
                : `Enter the ${CONFIG.OTP_LENGTH}-digit code sent to`}
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
