import "../../../global.css";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";
import { StarRating } from "@/components/StarRating";

interface RatingDimension {
  key: "punctuality" | "quality" | "behavior" | "value";
  label: string;
  icon: string;
}

const RATING_DIMENSIONS: RatingDimension[] = [
  { key: "punctuality", label: "Punctuality", icon: "\u23F0" },
  { key: "quality", label: "Quality", icon: "\u2B50" },
  { key: "behavior", label: "Behavior", icon: "\uD83D\uDE4F" },
  { key: "value", label: "Value for Money", icon: "\uD83D\uDCB0" },
];

export default function WriteReviewScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [ratings, setRatings] = useState<Record<string, number>>({
    punctuality: 0,
    quality: 0,
    behavior: 0,
    value: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRate = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const overallRating = useMemo(() => {
    const values = Object.values(ratings);
    const filled = values.filter((r) => r > 0);
    if (filled.length === 0) return 0;
    return filled.reduce((sum, r) => sum + r, 0) / filled.length;
  }, [ratings]);

  const allRated =
    ratings.punctuality > 0 &&
    ratings.quality > 0 &&
    ratings.behavior > 0 &&
    ratings.value > 0;

  const handleSubmit = async () => {
    if (!allRated) {
      Alert.alert(
        "Rate All Categories",
        "Please rate all four categories before submitting."
      );
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/bookings/${bookingId}/review`,
        {
          ratingPunctuality: ratings.punctuality,
          ratingQuality: ratings.quality,
          ratingBehavior: ratings.behavior,
          ratingValue: ratings.value,
          comment: comment.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      Alert.alert(
        "Review Submitted",
        "Thank you for your feedback! Your review helps other customers.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ??
          err?.message ??
          "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Write Review</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Overall Rating Display */}
        <View className="mx-5 mt-6 mb-2 items-center">
          <Text className="text-sm text-gray-500 mb-2">Overall Rating</Text>
          <StarRating
            rating={Math.round(overallRating)}
            size={32}
            interactive={false}
          />
          <Text className="text-2xl font-bold text-secondary mt-1">
            {overallRating > 0 ? overallRating.toFixed(1) : "--"}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 mx-5 my-4" />

        {/* Rating Dimensions */}
        <View className="mx-5 mb-4">
          <Text className="text-lg font-bold text-secondary mb-4">
            Rate Your Experience
          </Text>

          {RATING_DIMENSIONS.map((dimension) => (
            <View
              key={dimension.key}
              className="flex-row items-center justify-between mb-5 bg-gray-50 rounded-2xl p-4"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <Text style={{ fontSize: 22 }} className="mr-2">
                  {dimension.icon}
                </Text>
                <Text className="text-base font-semibold text-secondary">
                  {dimension.label}
                </Text>
              </View>
              <StarRating
                rating={ratings[dimension.key]}
                size={24}
                interactive
                onRate={(value) => handleRate(dimension.key, value)}
              />
            </View>
          ))}
        </View>

        {/* Comment Input */}
        <View className="mx-5 mb-6">
          <Text className="text-lg font-bold text-secondary mb-3">
            Comments (Optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share more about your experience..."
            placeholderTextColor="#9E9E9E"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-secondary"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            maxLength={500}
          />
          <Text className="text-xs text-gray-400 text-right mt-1">
            {comment.length}/500
          </Text>
        </View>

        {/* Bottom spacer */}
        <View className="h-8" />
      </ScrollView>

      {/* Submit Button */}
      <View className="px-5 py-4 pb-8 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!allRated || submitting}
          className={`py-4 rounded-xl items-center ${
            allRated ? "bg-primary" : "bg-gray-300"
          }`}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg font-bold">Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
