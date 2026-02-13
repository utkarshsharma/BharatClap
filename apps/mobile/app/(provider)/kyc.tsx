import "../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { providerService } from "@/services/providers";

type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";

interface StepConfig {
  title: string;
  subtitle: string;
}

const STEPS: StepConfig[] = [
  {
    title: "Enter Aadhaar Number",
    subtitle: "Enter your 12-digit Aadhaar number",
  },
  {
    title: "Verify OTP",
    subtitle: "Enter the OTP sent to your Aadhaar-registered mobile",
  },
  {
    title: "Processing",
    subtitle: "Verifying your identity...",
  },
  {
    title: "Verification Result",
    subtitle: "Your KYC verification status",
  },
];

function getStatusBadge(status: KycStatus) {
  switch (status) {
    case "VERIFIED":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Verified",
        icon: "\u2705",
      };
    case "PENDING":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Pending",
        icon: "\u23F3",
      };
    case "REJECTED":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Rejected",
        icon: "\u274C",
      };
    case "NOT_STARTED":
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Not Started",
        icon: "\u2796",
      };
  }
}

export default function KycScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: providerService.getOwnProfile,
  });

  const kycStatus: KycStatus =
    (profile as any)?.kycStatus ?? "NOT_STARTED";

  const [showFlow, setShowFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [processing, setProcessing] = useState(false);
  const [flowComplete, setFlowComplete] = useState(false);

  const isValidAadhaar =
    aadhaarNumber.replace(/\s/g, "").length === 12 &&
    /^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ""));

  const isValidOtp = otp.length === 6 && /^\d{6}$/.test(otp);

  const handleAadhaarChange = (text: string) => {
    // Allow only digits and spaces, limit to 14 chars (12 digits + 2 spaces)
    const cleaned = text.replace(/[^0-9\s]/g, "").slice(0, 14);
    setAadhaarNumber(cleaned);
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(cleaned);
  };

  const handleStartVerification = () => {
    setShowFlow(true);
    setCurrentStep(0);
    setAadhaarNumber("");
    setOtp("");
    setFlowComplete(false);
  };

  const handleSubmitAadhaar = () => {
    if (!isValidAadhaar) {
      Alert.alert("Invalid Aadhaar", "Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setCurrentStep(1);
  };

  const handleSubmitOtp = async () => {
    if (!isValidOtp) {
      Alert.alert("Invalid OTP", "Please enter a valid 6-digit OTP.");
      return;
    }

    // Move to processing step
    setCurrentStep(2);
    setProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      setProcessing(false);
      setCurrentStep(3);
      setFlowComplete(true);
    }, 3000);
  };

  const handleFlowDone = () => {
    setShowFlow(false);
    Alert.alert(
      "KYC Initiated",
      "KYC verification initiated. You will be notified when verified.",
      [{ text: "OK" }]
    );
    queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
  };

  const statusBadge = getStatusBadge(kycStatus);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">Loading KYC status...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center px-5 pt-4 pb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-1"
            >
              <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-[#1A1A2E]">
              Aadhaar e-KYC
            </Text>
          </View>

          {!showFlow ? (
            <>
              {/* KYC Status Card */}
              <View className="px-5 mt-6">
                <View className="bg-white border border-gray-200 rounded-2xl p-6 items-center">
                  {/* Status Icon */}
                  <Text style={{ fontSize: 56, marginBottom: 16 }}>
                    {kycStatus === "VERIFIED"
                      ? "\uD83D\uDEE1\uFE0F"
                      : kycStatus === "PENDING"
                      ? "\u23F3"
                      : kycStatus === "REJECTED"
                      ? "\u26A0\uFE0F"
                      : "\uD83C\uDD94"}
                  </Text>

                  {/* Status Badge */}
                  <View
                    className={`px-4 py-2 rounded-full mb-4 ${statusBadge.bg}`}
                  >
                    <Text
                      className={`text-sm font-bold ${statusBadge.text}`}
                    >
                      {statusBadge.icon} {statusBadge.label}
                    </Text>
                  </View>

                  {/* Status Messages */}
                  {kycStatus === "NOT_STARTED" && (
                    <>
                      <Text className="text-base font-semibold text-[#1A1A2E] mb-2 text-center">
                        Identity Verification Required
                      </Text>
                      <Text className="text-sm text-[#757575] text-center mb-6 leading-5">
                        Complete Aadhaar e-KYC to verify your identity. This
                        helps build trust with customers and is required to
                        receive bookings.
                      </Text>
                      <TouchableOpacity
                        onPress={handleStartVerification}
                        className="bg-[#FF6B00] rounded-xl py-4 px-8 items-center w-full"
                        activeOpacity={0.8}
                      >
                        <Text className="text-base font-bold text-white">
                          Start Verification
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {kycStatus === "PENDING" && (
                    <>
                      <Text className="text-base font-semibold text-[#1A1A2E] mb-2 text-center">
                        Verification In Progress
                      </Text>
                      <Text className="text-sm text-[#757575] text-center leading-5">
                        Your Aadhaar verification is being processed. This
                        usually takes 24-48 hours. You will be notified once
                        the verification is complete.
                      </Text>
                    </>
                  )}

                  {kycStatus === "VERIFIED" && (
                    <>
                      <Text className="text-base font-semibold text-green-700 mb-2 text-center">
                        Aadhaar Verified
                      </Text>
                      <Text className="text-sm text-[#757575] text-center leading-5">
                        Your identity has been successfully verified through
                        Aadhaar e-KYC. You can now receive bookings from
                        customers.
                      </Text>
                    </>
                  )}

                  {kycStatus === "REJECTED" && (
                    <>
                      <Text className="text-base font-semibold text-red-600 mb-2 text-center">
                        Verification Failed
                      </Text>
                      <Text className="text-sm text-[#757575] text-center mb-6 leading-5">
                        Your Aadhaar verification could not be completed.
                        Please try again with correct details or contact
                        support.
                      </Text>
                      <TouchableOpacity
                        onPress={handleStartVerification}
                        className="bg-[#FF6B00] rounded-xl py-4 px-8 items-center w-full"
                        activeOpacity={0.8}
                      >
                        <Text className="text-base font-bold text-white">
                          Retry Verification
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Info Section */}
              <View className="px-5 mt-6 mb-8">
                <Text className="text-base font-bold text-[#1A1A2E] mb-3">
                  Why is KYC required?
                </Text>
                <View className="bg-[#FFF3E0] rounded-2xl p-4">
                  <View className="flex-row items-start mb-3">
                    <Text className="text-sm mr-3">{"\uD83D\uDD12"}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-[#1A1A2E]">
                        Security
                      </Text>
                      <Text className="text-xs text-[#757575]">
                        Ensures all providers are verified individuals
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start mb-3">
                    <Text className="text-sm mr-3">{"\uD83E\uDD1D"}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-[#1A1A2E]">
                        Trust
                      </Text>
                      <Text className="text-xs text-[#757575]">
                        Customers prefer verified providers
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-sm mr-3">{"\uD83D\uDCB0"}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-[#1A1A2E]">
                        Payments
                      </Text>
                      <Text className="text-xs text-[#757575]">
                        Required for receiving payouts
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Verification Flow */}
              <View className="px-5 mt-4">
                {/* Step Indicator */}
                <View className="flex-row items-center justify-center mb-6">
                  {STEPS.map((step, index) => (
                    <React.Fragment key={index}>
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          index <= currentStep
                            ? "bg-[#FF6B00]"
                            : "bg-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            index <= currentStep
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      {index < STEPS.length - 1 && (
                        <View
                          className={`h-0.5 w-8 ${
                            index < currentStep
                              ? "bg-[#FF6B00]"
                              : "bg-gray-200"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {/* Step Title */}
                <Text className="text-lg font-bold text-[#1A1A2E] text-center mb-1">
                  {STEPS[currentStep].title}
                </Text>
                <Text className="text-sm text-[#757575] text-center mb-6">
                  {STEPS[currentStep].subtitle}
                </Text>

                {/* Step 1: Aadhaar Number */}
                {currentStep === 0 && (
                  <View>
                    <View className="bg-white border border-gray-200 rounded-2xl p-5">
                      <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                        Aadhaar Number
                      </Text>
                      <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E]"
                        placeholder="XXXX XXXX XXXX"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        maxLength={14}
                        value={aadhaarNumber}
                        onChangeText={handleAadhaarChange}
                        autoFocus
                      />
                      <Text className="text-xs text-[#757575] mt-2">
                        Your Aadhaar number is kept secure and encrypted
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleSubmitAadhaar}
                      disabled={!isValidAadhaar}
                      className={`mt-6 rounded-xl py-4 items-center ${
                        isValidAadhaar ? "bg-[#FF6B00]" : "bg-gray-300"
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text
                        className={`text-base font-bold ${
                          isValidAadhaar ? "text-white" : "text-gray-500"
                        }`}
                      >
                        Send OTP
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowFlow(false)}
                      className="mt-4 items-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm text-[#757575]">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 2: OTP Verification */}
                {currentStep === 1 && (
                  <View>
                    <View className="bg-white border border-gray-200 rounded-2xl p-5">
                      <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                        OTP
                      </Text>
                      <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E] text-center tracking-widest"
                        placeholder="------"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={handleOtpChange}
                        autoFocus
                      />
                      <Text className="text-xs text-[#757575] mt-2 text-center">
                        Enter the 6-digit OTP sent to your Aadhaar-linked
                        mobile number
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleSubmitOtp}
                      disabled={!isValidOtp}
                      className={`mt-6 rounded-xl py-4 items-center ${
                        isValidOtp ? "bg-[#FF6B00]" : "bg-gray-300"
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text
                        className={`text-base font-bold ${
                          isValidOtp ? "text-white" : "text-gray-500"
                        }`}
                      >
                        Verify OTP
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setCurrentStep(0)}
                      className="mt-4 items-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm text-[#757575]">
                        Go Back
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 3: Processing */}
                {currentStep === 2 && (
                  <View className="items-center py-12">
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text className="text-base font-semibold text-[#1A1A2E] mt-6 mb-2">
                      Verifying your identity
                    </Text>
                    <Text className="text-sm text-[#757575] text-center">
                      Please wait while we verify your Aadhaar details...
                    </Text>
                  </View>
                )}

                {/* Step 4: Result */}
                {currentStep === 3 && (
                  <View className="items-center py-8">
                    <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                      <Text style={{ fontSize: 36 }}>{"\u2705"}</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#1A1A2E] mb-2">
                      Verification Initiated
                    </Text>
                    <Text className="text-sm text-[#757575] text-center mb-8 leading-5 px-4">
                      Your Aadhaar e-KYC verification has been submitted
                      successfully. You will be notified when the
                      verification is complete (usually within 24-48 hours).
                    </Text>

                    <TouchableOpacity
                      onPress={handleFlowDone}
                      className="bg-[#FF6B00] rounded-xl py-4 px-8 items-center w-full"
                      activeOpacity={0.8}
                    >
                      <Text className="text-base font-bold text-white">
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
