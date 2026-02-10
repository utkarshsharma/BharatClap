import "../../../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useBookingStore } from "@/store/bookingStore";
import { formatDate, formatTime } from "@/utils/format";

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const selectedService = useBookingStore((s) => s.selectedService);
  const selectedProvider = useBookingStore((s) => s.selectedProvider);
  const selectedDate = useBookingStore((s) => s.selectedDate);
  const selectedHour = useBookingStore((s) => s.selectedHour);
  const reset = useBookingStore((s) => s.reset);

  const handleViewBooking = () => {
    reset();
    router.replace(`/(customer)/booking/${bookingId}` as any);
  };

  const handleGoHome = () => {
    reset();
    router.replace("/(customer)/(tabs)" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        {/* Success Icon */}
        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6">
          <Text style={{ fontSize: 48 }}>✓</Text>
        </View>

        <Text className="text-2xl font-bold text-secondary mb-2 text-center">
          Booking Confirmed!
        </Text>
        <Text className="text-base text-gray-500 text-center mb-8">
          Provider will confirm shortly
        </Text>

        {/* Booking Details Card */}
        <View className="w-full bg-gray-50 rounded-2xl p-5 mb-8">
          {bookingId && (
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm text-gray-500">Booking ID</Text>
              <Text className="text-sm font-semibold text-secondary">
                #{bookingId.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-500">Service</Text>
            <Text className="text-sm font-semibold text-secondary">
              {selectedService?.name ?? "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-500">Provider</Text>
            <Text className="text-sm font-semibold text-secondary">
              {selectedProvider?.name ?? "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-500">Date</Text>
            <Text className="text-sm font-semibold text-secondary">
              {selectedDate ? formatDate(selectedDate) : "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Time</Text>
            <Text className="text-sm font-semibold text-secondary">
              {selectedHour !== null ? formatTime(selectedHour) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={handleViewBooking}
          className="w-full bg-primary py-4 rounded-xl items-center mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">View Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoHome}
          className="w-full bg-white border border-gray-200 py-4 rounded-xl items-center"
          activeOpacity={0.7}
        >
          <Text className="text-base font-bold text-secondary">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
