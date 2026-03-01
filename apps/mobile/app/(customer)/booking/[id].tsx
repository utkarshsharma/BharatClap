import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, type Booking } from "@/services/bookings";
import { reviewService } from "@/services/reviews";
import { formatDate, formatTime, formatCurrency } from "@/utils/format";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_PAYMENT: { bg: "bg-orange-100", text: "text-orange-700" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700" },
  PROVIDER_ASSIGNED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  IN_PROGRESS: { bg: "bg-yellow-100", text: "text-yellow-700" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
  REFUNDED: { bg: "bg-gray-100", text: "text-gray-700" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED: "Confirmed",
  PROVIDER_ASSIGNED: "Provider Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_TIMELINE_ORDER = [
  "CONFIRMED",
  "PROVIDER_ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
];

export default function BookingDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const {
    data: booking,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingService.getBookingById(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingService.cancelBooking(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      Alert.alert("Cancelled", "Your booking has been cancelled.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message ?? "Failed to cancel booking.");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewService.createReview(id!, {
        rating: reviewRating,
        comment: reviewComment || undefined,
      }),
    onSuccess: () => {
      setShowReviewForm(false);
      Alert.alert("Thank you!", "Your review has been submitted.");
      refetch();
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message ?? "Failed to submit review.");
    },
  });

  const handleCancel = () => {
    Alert.prompt
      ? Alert.prompt(
          "Cancel Booking",
          "Please provide a reason for cancellation:",
          [
            { text: "Back", style: "cancel" },
            {
              text: "Cancel Booking",
              style: "destructive",
              onPress: (reason) => {
                cancelMutation.mutate(reason ?? "Customer requested cancellation");
              },
            },
          ],
          "plain-text"
        )
      : Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: () =>
              cancelMutation.mutate("Customer requested cancellation"),
          },
        ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg text-gray-500">Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

  const currentStatusIndex = STATUS_TIMELINE_ORDER.indexOf(booking.status);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary flex-1">
          Booking Details
        </Text>
        <View className={`px-3 py-1 rounded-full ${statusColor.bg}`}>
          <Text className={`text-xs font-semibold ${statusColor.text}`}>
            {STATUS_LABELS[booking.status] ?? booking.status}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Booking ID */}
        <View className="mx-5 mt-5 flex-row items-center">
          <Text className="text-sm text-gray-400">Booking ID: </Text>
          <Text className="text-sm font-semibold text-secondary">
            #{booking.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        {/* Service Info */}
        <View className="mx-5 mt-4 p-4 bg-primary-50 rounded-2xl">
          <Text className="text-lg font-bold text-secondary mb-1">
            {(booking as any).serviceName ?? "Service"}
          </Text>
          <Text className="text-sm text-gray-600">
            Provider: {(booking as any).providerName ?? "Assigned Provider"}
          </Text>
        </View>

        {/* Date & Time */}
        <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl">
          <Text className="text-sm font-semibold text-gray-500 mb-1">
            Date & Time
          </Text>
          <Text className="text-base font-bold text-secondary">
            {formatDate(booking.scheduledDate)} at{" "}
            {formatTime(booking.scheduledHour)}
          </Text>
        </View>

        {/* Address */}
        {booking.address && (
          <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl">
            <Text className="text-sm font-semibold text-gray-500 mb-1">
              Address
            </Text>
            <Text className="text-base font-bold text-secondary">
              {booking.address.line1}
            </Text>
            {booking.address.line2 && (
              <Text className="text-sm text-gray-600">{booking.address.line2}</Text>
            )}
            <Text className="text-sm text-gray-500">
              {booking.address.city}, {booking.address.state} - {booking.address.pincode}
            </Text>
          </View>
        )}

        {/* OTP Display */}
        {booking.status === "PROVIDER_ASSIGNED" && booking.verificationOtp && (
          <View className="mx-5 mt-4 p-5 bg-yellow-50 rounded-2xl items-center border border-yellow-200">
            <Text className="text-sm font-semibold text-yellow-700 mb-2">
              Share this OTP with provider
            </Text>
            <View className="flex-row">
              {booking.verificationOtp.split("").map((digit, index) => (
                <View
                  key={index}
                  className="w-12 h-14 bg-white rounded-xl items-center justify-center mx-1 border border-yellow-300"
                >
                  <Text className="text-2xl font-bold text-secondary">
                    {digit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Final Price */}
        {booking.finalPrice && (
          <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl flex-row justify-between items-center">
            <Text className="text-base text-gray-600">Total Paid</Text>
            <Text className="text-xl font-bold text-primary">
              {formatCurrency(booking.finalPrice)}
            </Text>
          </View>
        )}

        {/* Notes */}
        {booking.customerNotes && (
          <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl">
            <Text className="text-sm font-semibold text-gray-500 mb-1">
              Your Notes
            </Text>
            <Text className="text-base text-secondary">{booking.customerNotes}</Text>
          </View>
        )}

        {/* Cancellation Reason */}
        {booking.status === "CANCELLED" && booking.cancellationReason && (
          <View className="mx-5 mt-4 p-4 bg-red-50 rounded-2xl">
            <Text className="text-sm font-semibold text-red-600 mb-1">
              Cancellation Reason
            </Text>
            <Text className="text-base text-red-700">{booking.cancellationReason}</Text>
          </View>
        )}

        {/* Status Timeline */}
        {booking.status !== "CANCELLED" && (
          <View className="mx-5 mt-6 mb-4">
            <Text className="text-lg font-bold text-secondary mb-4">
              Status Timeline
            </Text>
            {STATUS_TIMELINE_ORDER.map((status, index) => {
              const isReached = index <= currentStatusIndex;
              const isCurrent = status === booking.status;
              return (
                <View key={status} className="flex-row items-start mb-0">
                  <View className="items-center mr-3" style={{ width: 24 }}>
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isReached ? "bg-green-500" : "bg-gray-200"
                      }`}
                    >
                      {isReached && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </View>
                    {index < STATUS_TIMELINE_ORDER.length - 1 && (
                      <View
                        className={`w-0.5 h-8 ${
                          isReached && index < currentStatusIndex
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </View>
                  <View className="flex-1 pb-4">
                    <Text
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? "text-green-600"
                          : isReached
                          ? "text-secondary"
                          : "text-gray-400"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View className="mx-5 mb-8">
          {(booking.status === "PENDING_PAYMENT" || booking.status === "CONFIRMED") && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              className="py-4 rounded-xl border border-red-200 items-center"
              activeOpacity={0.7}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text className="text-base font-semibold text-red-500">
                  Cancel Booking
                </Text>
              )}
            </TouchableOpacity>
          )}

          {booking.status === "COMPLETED" && !showReviewForm && (
            <TouchableOpacity
              onPress={() => setShowReviewForm(true)}
              className="py-4 rounded-xl bg-primary items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-bold">Write Review</Text>
            </TouchableOpacity>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <View className="mt-4 p-4 bg-gray-50 rounded-2xl">
              <Text className="text-lg font-bold text-secondary mb-3">
                Write a Review
              </Text>

              {/* Star Rating */}
              <View className="flex-row mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    className="mr-2"
                  >
                    <Text
                      style={{ fontSize: 28 }}
                      className={
                        star <= reviewRating ? "text-yellow-400" : "text-gray-300"
                      }
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience..."
                placeholderTextColor="#9E9E9E"
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-secondary mb-3"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ minHeight: 80 }}
              />

              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setShowReviewForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 items-center mr-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-semibold text-gray-600">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary items-center ml-2"
                  activeOpacity={0.8}
                >
                  {reviewMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-sm font-bold text-white">
                      Submit Review
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
