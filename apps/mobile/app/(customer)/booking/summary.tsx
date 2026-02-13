import "../../../global.css";
import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { useBookingStore } from "@/store/bookingStore";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

export default function BookingSummaryScreen() {
  const router = useRouter();

  const selectedService = useBookingStore((s) => s.selectedService);
  const selectedProvider = useBookingStore((s) => s.selectedProvider);
  const selectedDate = useBookingStore((s) => s.selectedDate);
  const selectedHour = useBookingStore((s) => s.selectedHour);
  const selectedAddress = useBookingStore((s) => s.selectedAddress);
  const customerNotes = useBookingStore((s) => s.customerNotes);
  const emergencyContact = useBookingStore((s) => s.emergencyContact);
  const setCustomerNotes = useBookingStore((s) => s.setCustomerNotes);
  const setEmergencyContact = useBookingStore((s) => s.setEmergencyContact);

  const [localNotes, setLocalNotes] = useState(customerNotes);
  const [localEmergency, setLocalEmergency] = useState(emergencyContact);

  const totalAmount = (selectedProvider as any)?.customPrice ?? selectedService?.basePrice ?? 0;

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      // 1. Create the booking (status: PENDING_PAYMENT)
      const booking = await bookingService.createBooking({
        serviceId: selectedService!.id,
        providerId: selectedProvider!.id,
        addressId: selectedAddress!.id,
        scheduledDate: selectedDate!,
        scheduledHour: selectedHour!,
        customerNotes: localNotes || undefined,
        emergencyContactPhone: localEmergency || undefined,
      });

      // 2. Create a Razorpay payment order
      const order = await paymentService.createPaymentOrder(booking.id);

      return { booking, order };
    },
    onSuccess: ({ booking, order }) => {
      setCustomerNotes(localNotes);
      setEmergencyContact(localEmergency);
      router.push(
        `/(customer)/booking/payment?bookingId=${booking.id}&orderId=${order.orderId}&amount=${order.amount}` as any
      );
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Something went wrong. Please try again.";
      Alert.alert(
        "Booking Failed",
        Array.isArray(msg) ? msg.join('\n') : msg
      );
    },
  });

  const handlePay = () => {
    if (!selectedService || !selectedProvider || !selectedDate || selectedHour === null || !selectedAddress) {
      Alert.alert("Missing Info", "Please complete all booking steps before proceeding.");
      return;
    }
    createBookingMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Booking Summary</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Service Details */}
        <View className="mx-5 mt-5 p-4 bg-primary-50 rounded-2xl">
          <Text className="text-lg font-bold text-secondary mb-1">
            {selectedService?.name ?? "Service"}
          </Text>
          <Text className="text-sm text-gray-600">
            Provider: {selectedProvider?.name ?? "N/A"}
          </Text>
        </View>

        {/* Date & Time */}
        <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl">
          <Text className="text-sm font-semibold text-gray-500 mb-1">
            Date & Time
          </Text>
          <Text className="text-base font-bold text-secondary">
            {selectedDate ? formatDate(selectedDate) : "N/A"} at{" "}
            {selectedHour !== null ? formatTime(selectedHour) : "N/A"}
          </Text>
        </View>

        {/* Address */}
        <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl">
          <Text className="text-sm font-semibold text-gray-500 mb-1">
            Address
          </Text>
          {selectedAddress ? (
            <>
              <Text className="text-base font-bold text-secondary">
                {selectedAddress.line1}
              </Text>
              {selectedAddress.line2 && (
                <Text className="text-sm text-gray-600">{selectedAddress.line2}</Text>
              )}
              <Text className="text-sm text-gray-500">
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
            </>
          ) : (
            <Text className="text-base text-gray-400">No address selected</Text>
          )}
        </View>

        {/* Customer Notes */}
        <View className="mx-5 mt-4">
          <Text className="text-sm font-semibold text-gray-500 mb-2">
            Notes for provider (optional)
          </Text>
          <TextInput
            value={localNotes}
            onChangeText={setLocalNotes}
            placeholder="Any special instructions or requests..."
            placeholderTextColor="#9E9E9E"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-secondary"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </View>

        {/* Emergency Contact */}
        <View className="mx-5 mt-4 mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2">
            Emergency Contact (optional)
          </Text>
          <TextInput
            value={localEmergency}
            onChangeText={setLocalEmergency}
            placeholder="10-digit phone number"
            placeholderTextColor="#9E9E9E"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-secondary"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Price Breakdown */}
        <View className="mx-5 mb-6 p-4 bg-gray-50 rounded-2xl">
          <View className="flex-row justify-between items-center">
            <Text className="text-base text-gray-600">Service Charge</Text>
            <Text className="text-base font-bold text-secondary">
              {formatCurrency(totalAmount)}
            </Text>
          </View>
          <View className="border-t border-gray-200 my-3" />
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-secondary">Total</Text>
            <Text className="text-xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {/* Spacer for button */}
        <View className="h-24" />
      </ScrollView>

      {/* Pay Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <TouchableOpacity
          onPress={handlePay}
          disabled={createBookingMutation.isPending}
          className={`py-4 rounded-xl items-center ${
            createBookingMutation.isPending ? "bg-gray-300" : "bg-primary"
          }`}
          activeOpacity={0.8}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Pay {formatCurrency(totalAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
