import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, type Booking } from "@/services/bookings";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-gray-100", text: "text-gray-600", label: "Pending" },
  CONFIRMED: { bg: "bg-[#E3F2FD]", text: "text-[#2196F3]", label: "Confirmed" },
  PROVIDER_ASSIGNED: { bg: "bg-[#FFF3E0]", text: "text-[#FF6B00]", label: "Assigned" },
  IN_PROGRESS: { bg: "bg-[#FFFDE7]", text: "text-[#FF9800]", label: "In Progress" },
  COMPLETED: { bg: "bg-[#E8F5E9]", text: "text-[#4CAF50]", label: "Completed" },
  CANCELLED: { bg: "bg-[#FFEBEE]", text: "text-[#F44336]", label: "Cancelled" },
};

const TIMELINE_STEPS = [
  { key: "CONFIRMED", label: "Booking Confirmed" },
  { key: "PROVIDER_ASSIGNED", label: "Provider Assigned" },
  { key: "IN_PROGRESS", label: "Service Started" },
  { key: "COMPLETED", label: "Service Completed" },
];

const STATUS_ORDER = ["CONFIRMED", "PROVIDER_ASSIGNED", "IN_PROGRESS", "COMPLETED"];

export default function ProviderBookingDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [otp, setOtp] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const {
    data: booking,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingService.getBookingById(id!),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: () => bookingService.acceptBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["provider-pending-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-today-bookings"] });
      Alert.alert("Success", "Booking accepted!");
    },
    onError: () => Alert.alert("Error", "Failed to accept booking."),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => bookingService.rejectBooking(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["provider-pending-bookings"] });
      setShowRejectInput(false);
      setRejectReason("");
      Alert.alert("Done", "Booking rejected.");
    },
    onError: () => Alert.alert("Error", "Failed to reject booking."),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => bookingService.verifyOtp(id!, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      setOtp("");
      Alert.alert("Success", "OTP verified! Service has started.");
    },
    onError: () => Alert.alert("Error", "Invalid OTP. Please try again."),
  });

  const completeMutation = useMutation({
    mutationFn: () => bookingService.completeBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      Alert.alert("Success", "Service marked as complete!");
    },
    onError: () => Alert.alert("Error", "Failed to complete booking."),
  });

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  };

  const getStatusIndex = (status: string) => {
    return STATUS_ORDER.indexOf(status);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#1A1A2E]">Booking Details</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg font-semibold text-[#F44336] text-center">
            Failed to load booking details
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-[#FF6B00] rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sc = getStatusConfig(booking.status);
  const currentStatusIndex = getStatusIndex(booking.status);
  const isCancelled = booking.status === "CANCELLED";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#1A1A2E] flex-1">
            Booking Details
          </Text>
        </View>

        {/* Status Badge */}
        <View className="px-5 mt-3">
          <View className={`${sc.bg} self-start px-4 py-2 rounded-full`}>
            <Text className={`text-sm font-bold ${sc.text}`}>{sc.label}</Text>
          </View>
        </View>

        {/* Service Info */}
        <View className="px-5 mt-4">
          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-lg font-bold text-[#1A1A2E] mb-2">
              {(booking as any).service?.name ?? "Service"}
            </Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-[#757575] flex-1">Date</Text>
              <Text className="text-sm font-semibold text-[#1A1A2E]">
                {formatDate(booking.scheduledDate)}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-[#757575] flex-1">Time</Text>
              <Text className="text-sm font-semibold text-[#1A1A2E]">
                {formatTime(booking.scheduledHour)}
              </Text>
            </View>
            {booking.finalPrice != null && (
              <View className="flex-row items-center mb-2">
                <Text className="text-sm text-[#757575] flex-1">Price</Text>
                <Text className="text-sm font-bold text-[#4CAF50]">
                  {formatCurrency(booking.finalPrice)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <View className="px-5 mt-4">
          <Text className="text-base font-bold text-[#1A1A2E] mb-2">
            Customer Details
          </Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-sm text-[#1A1A2E] font-semibold mb-1">
              {(booking as any).customer?.name ?? "Customer"}
            </Text>
            {(booking.status === "PROVIDER_ASSIGNED" ||
              booking.status === "IN_PROGRESS" ||
              booking.status === "COMPLETED") && (
              <Text className="text-sm text-[#757575] mb-1">
                Phone: {(booking as any).customer?.phone ?? "N/A"}
              </Text>
            )}
            {booking.customerNotes && (
              <Text className="text-sm text-[#757575] mt-1">
                Notes: {booking.customerNotes}
              </Text>
            )}
          </View>
        </View>

        {/* Address */}
        <View className="px-5 mt-4">
          <Text className="text-base font-bold text-[#1A1A2E] mb-2">Address</Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-sm text-[#1A1A2E]">
              {booking.address?.line1 ?? "Not provided"}
            </Text>
            {booking.address?.line2 && (
              <Text className="text-sm text-[#757575]">{booking.address.line2}</Text>
            )}
            {booking.address?.city && (
              <Text className="text-sm text-[#757575]">
                {booking.address.city}
                {booking.address.pincode ? ` - ${booking.address.pincode}` : ""}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons based on status */}
        <View className="px-5 mt-6">
          {/* CONFIRMED: Accept / Reject */}
          {booking.status === "CONFIRMED" && (
            <View>
              {showRejectInput ? (
                <View>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm mb-3"
                    placeholder="Reason for rejection..."
                    placeholderTextColor="#9E9E9E"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                  />
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => {
                        setShowRejectInput(false);
                        setRejectReason("");
                      }}
                      className="flex-1 bg-gray-100 rounded-xl py-3.5 mr-2 items-center"
                    >
                      <Text className="text-base font-semibold text-[#757575]">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (!rejectReason.trim()) {
                          Alert.alert("Error", "Please provide a reason.");
                          return;
                        }
                        rejectMutation.mutate(rejectReason);
                      }}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-[#F44336] rounded-xl py-3.5 items-center"
                    >
                      <Text className="text-base font-semibold text-white">
                        {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setShowRejectInput(true)}
                    className="flex-1 bg-gray-100 rounded-xl py-3.5 mr-2 items-center"
                  >
                    <Text className="text-base font-semibold text-[#F44336]">Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                    className="flex-1 bg-[#FF6B00] rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-base font-semibold text-white">
                      {acceptMutation.isPending ? "Accepting..." : "Accept"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* PROVIDER_ASSIGNED: OTP Entry */}
          {booking.status === "PROVIDER_ASSIGNED" && (
            <View className="bg-[#FFF3E0] rounded-2xl p-4">
              <Text className="text-base font-bold text-[#1A1A2E] mb-2">
                Enter Customer's OTP
              </Text>
              <Text className="text-sm text-[#757575] mb-3">
                Ask the customer for the 4-digit OTP to start the service.
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg text-center font-bold tracking-widest mb-3"
                placeholder="----"
                placeholderTextColor="#9E9E9E"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
              <TouchableOpacity
                onPress={() => {
                  if (otp.length < 4) {
                    Alert.alert("Error", "Please enter a 4-digit OTP.");
                    return;
                  }
                  verifyOtpMutation.mutate();
                }}
                disabled={verifyOtpMutation.isPending}
                className="bg-[#FF6B00] rounded-xl py-3.5 items-center"
              >
                <Text className="text-base font-semibold text-white">
                  {verifyOtpMutation.isPending ? "Verifying..." : "Start Service"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* IN_PROGRESS: Mark Complete */}
          {booking.status === "IN_PROGRESS" && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Complete Service",
                  "Are you sure you want to mark this service as complete?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Mark Complete",
                      onPress: () => completeMutation.mutate(),
                    },
                  ]
                );
              }}
              disabled={completeMutation.isPending}
              className="bg-[#4CAF50] rounded-xl py-3.5 items-center"
            >
              <Text className="text-base font-semibold text-white">
                {completeMutation.isPending ? "Completing..." : "Mark Complete"}
              </Text>
            </TouchableOpacity>
          )}

          {/* COMPLETED: Earnings Info */}
          {booking.status === "COMPLETED" && (
            <View className="bg-[#E8F5E9] rounded-2xl p-4">
              <Text className="text-base font-bold text-[#4CAF50] mb-2">
                Service Completed
              </Text>
              {booking.finalPrice != null && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-[#757575]">Earnings</Text>
                  <Text className="text-lg font-bold text-[#4CAF50]">
                    {formatCurrency(booking.finalPrice)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* CANCELLED: Show reason */}
          {booking.status === "CANCELLED" && (
            <View className="bg-[#FFEBEE] rounded-2xl p-4">
              <Text className="text-base font-bold text-[#F44336] mb-2">
                Booking Cancelled
              </Text>
              {(booking.cancellationReason || booking.rejectionReason) && (
                <Text className="text-sm text-[#757575]">
                  Reason: {booking.cancellationReason ?? booking.rejectionReason}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View className="px-5 mt-6 mb-8">
            <Text className="text-base font-bold text-[#1A1A2E] mb-4">
              Booking Timeline
            </Text>
            {TIMELINE_STEPS.map((step, index) => {
              const stepIndex = STATUS_ORDER.indexOf(step.key);
              const isActive = stepIndex <= currentStatusIndex;
              const isCurrent = stepIndex === currentStatusIndex;
              const isLast = index === TIMELINE_STEPS.length - 1;

              return (
                <View key={step.key} className="flex-row">
                  {/* Circle and Line */}
                  <View className="items-center mr-3">
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isCurrent
                          ? "bg-[#FF6B00]"
                          : isActive
                          ? "bg-[#4CAF50]"
                          : "bg-gray-200"
                      }`}
                    >
                      {isActive && (
                        <Text className="text-white text-xs font-bold">
                          {isCurrent ? ">" : "✓"}
                        </Text>
                      )}
                    </View>
                    {!isLast && (
                      <View
                        className={`w-0.5 h-8 ${
                          isActive && stepIndex < currentStatusIndex
                            ? "bg-[#4CAF50]"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </View>
                  {/* Label */}
                  <View className="pb-8">
                    <Text
                      className={`text-sm font-semibold ${
                        isActive ? "text-[#1A1A2E]" : "text-[#757575]"
                      }`}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
