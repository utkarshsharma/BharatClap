import "../../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";

interface Dispute {
  id: string;
  bookingId: string;
  status: string;
  customerEvidenceText: string;
  aiRuling?: string | null;
  resolution?: string | null;
  reason?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  open: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Open" },
  under_review: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Under Review",
  },
  resolved: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Resolved",
  },
  closed: { bg: "bg-red-100", text: "text-red-700", label: "Escalated" },
};

export default function DisputeScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [description, setDescription] = useState("");
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch existing dispute for this booking
  useEffect(() => {
    if (!bookingId) return;

    const fetchDispute = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/disputes`, {
          params: { bookingId },
          headers,
        });
        const disputes = Array.isArray(res.data) ? res.data : res.data?.data;
        if (disputes && disputes.length > 0) {
          setDispute(disputes[0]);
        }
      } catch {
        // No existing dispute or fetch failed — allow filing a new one
      } finally {
        setLoading(false);
      }
    };

    fetchDispute();
  }, [bookingId]);

  const handleSubmitDispute = () => {
    if (!description.trim()) {
      Alert.alert("Validation", "Please describe your issue in detail.");
      return;
    }

    if (description.trim().length < 20) {
      Alert.alert(
        "Validation",
        "Please provide a more detailed description (at least 20 characters)."
      );
      return;
    }

    Alert.alert(
      "Confirm Dispute",
      "Are you sure you want to file a dispute for this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: submitDispute,
        },
      ]
    );
  };

  const submitDispute = async () => {
    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/disputes`,
        {
          bookingId,
          customerEvidenceText: description.trim(),
        },
        { headers }
      );

      Alert.alert(
        "Dispute Filed",
        "Your dispute has been submitted successfully. We will review it shortly.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ??
          "Failed to submit dispute. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
    return (
      <View className={`px-3 py-1.5 rounded-full ${config.bg}`}>
        <Text className={`text-sm font-semibold ${config.text}`}>
          {config.label}
        </Text>
      </View>
    );
  };

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
            Dispute
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="text-gray-500 mt-3">Loading dispute info...</Text>
          </View>
        ) : dispute ? (
          /* Existing Dispute View */
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Dispute Status Card */}
            <View className="bg-gray-50 rounded-2xl p-5 mb-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-secondary">
                  Dispute Status
                </Text>
                {getStatusBadge(dispute.status)}
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Booking ID</Text>
                <Text className="text-sm text-secondary font-medium">
                  {dispute.bookingId}
                </Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Filed On</Text>
                <Text className="text-sm text-secondary">
                  {new Date(dispute.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              {dispute.reason && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Reason</Text>
                  <Text className="text-sm text-secondary">
                    {dispute.reason}
                  </Text>
                </View>
              )}
            </View>

            {/* Customer Evidence */}
            <View className="bg-white rounded-2xl p-5 mb-5 border border-gray-100">
              <Text className="text-base font-bold text-secondary mb-3">
                Your Description
              </Text>
              <Text className="text-sm text-gray-600 leading-5">
                {dispute.customerEvidenceText}
              </Text>
            </View>

            {/* AI Ruling */}
            {dispute.aiRuling && (
              <View className="bg-purple-50 rounded-2xl p-5 mb-5 border border-purple-200">
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg mr-2">{"\uD83E\uDD16"}</Text>
                  <Text className="text-base font-bold text-purple-800">
                    AI Ruling
                  </Text>
                </View>
                <Text className="text-sm text-purple-700 leading-5">
                  {dispute.aiRuling}
                </Text>
              </View>
            )}

            {/* Resolution */}
            {dispute.resolution && (
              <View className="bg-green-50 rounded-2xl p-5 mb-5 border border-green-200">
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg mr-2">{"\u2696\uFE0F"}</Text>
                  <Text className="text-base font-bold text-green-800">
                    Resolution
                  </Text>
                </View>
                <Text className="text-sm text-green-700 leading-5">
                  {dispute.resolution}
                </Text>
              </View>
            )}

            {/* Timeline Hint */}
            <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <Text className="text-sm text-blue-800 font-semibold mb-2">
                What happens next?
              </Text>
              <Text className="text-sm text-blue-700 leading-5">
                {dispute.status === "open"
                  ? "Our team will review your dispute within 24-48 hours. You will be notified once a decision is made."
                  : dispute.status === "under_review"
                  ? "Your dispute is currently being reviewed by our team. We may reach out for additional details."
                  : dispute.status === "resolved"
                  ? "This dispute has been resolved. If you are not satisfied, you can contact support."
                  : "This dispute has been escalated to senior management for review."}
              </Text>
            </View>
          </ScrollView>
        ) : (
          /* File New Dispute Form */
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Banner */}
            <View className="bg-orange-50 rounded-2xl p-5 mb-6 border border-orange-200">
              <View className="flex-row items-center mb-2">
                <Text className="text-lg mr-2">{"\u26A0\uFE0F"}</Text>
                <Text className="text-base font-bold text-orange-800">
                  File a Dispute
                </Text>
              </View>
              <Text className="text-sm text-orange-700 leading-5">
                If you faced any issues with your booking, please describe the
                problem in detail. Our team will review and resolve it within
                24-48 hours.
              </Text>
            </View>

            {/* Booking Reference */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-secondary mb-1">
                Booking Reference
              </Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Text className="text-sm text-gray-600 font-mono">
                  {bookingId}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-secondary mb-2">
                Describe the issue *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3.5 text-base text-secondary"
                placeholder="Please describe the issue in detail. Include any relevant information that may help us resolve this quickly..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 150 }}
              />
              <Text className="text-xs text-gray-400 mt-1">
                {description.length}/500 characters (minimum 20)
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitDispute}
              disabled={submitting}
              className={`py-4 rounded-xl items-center ${
                submitting ? "bg-gray-300" : "bg-primary"
              }`}
              activeOpacity={0.8}
            >
              {submitting ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-lg font-bold text-white ml-2">
                    Submitting...
                  </Text>
                </View>
              ) : (
                <Text className="text-lg font-bold text-white">
                  Submit Dispute
                </Text>
              )}
            </TouchableOpacity>

            {/* Disclaimer */}
            <Text className="text-xs text-gray-400 text-center mt-4 leading-4">
              By submitting a dispute, you agree to provide accurate information.
              False disputes may result in account restrictions.
            </Text>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
