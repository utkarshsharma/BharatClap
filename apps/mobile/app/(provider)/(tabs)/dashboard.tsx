import "../../../global.css";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, type Booking } from "@/services/bookings";
import { providerService } from "@/services/providers";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: providerService.getOwnProfile,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: notificationService.getUnreadCount,
  });

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ["provider-pending-bookings"],
    queryFn: () =>
      bookingService.getBookings({ role: "provider", status: "CONFIRMED" }),
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    data: todayData,
    isLoading: todayLoading,
    refetch: refetchToday,
  } = useQuery({
    queryKey: ["provider-today-bookings"],
    queryFn: () =>
      bookingService.getBookings({ role: "provider", status: "PROVIDER_ASSIGNED" }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => bookingService.acceptBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-pending-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-today-bookings"] });
      Alert.alert("Success", "Booking accepted!");
    },
    onError: () => Alert.alert("Error", "Failed to accept booking."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingService.rejectBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-pending-bookings"] });
      setRejectingId(null);
      setRejectReason("");
      Alert.alert("Done", "Booking rejected.");
    },
    onError: () => Alert.alert("Error", "Failed to reject booking."),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPending(), refetchToday()]);
    setRefreshing(false);
  }, [refetchPending, refetchToday]);

  const pendingBookings = pendingData?.bookings ?? [];
  const todayBookings = (todayData?.bookings ?? [])
    .filter((b: Booking) => b.scheduledDate?.startsWith(todayStr))
    .sort((a: Booking, b: Booking) => a.scheduledHour - b.scheduledHour);

  const todayEarnings = todayBookings.reduce(
    (sum: number, b: Booking) => sum + (b.finalPrice ?? 0),
    0
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View>
            <Text className="text-2xl font-bold text-[#1A1A2E]">Dashboard</Text>
            <Text className="text-sm text-[#757575] mt-1">
              Hello, {user?.name ?? "Provider"}!
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert("Notifications", "Notifications coming soon!")}
            className="relative p-2"
          >
            <Text style={{ fontSize: 24 }}>🔔</Text>
            {(unreadCount ?? 0) > 0 && (
              <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {unreadCount! > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="px-5 mt-4">
          <View className="flex-row flex-wrap -mx-1.5">
            {/* Today's Earnings */}
            <View className="w-1/2 px-1.5 mb-3">
              <View className="bg-[#E8F5E9] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">Today's Earnings</Text>
                <Text className="text-xl font-bold text-[#4CAF50]">
                  {formatCurrency(todayEarnings)}
                </Text>
              </View>
            </View>
            {/* This Week */}
            <View className="w-1/2 px-1.5 mb-3">
              <View className="bg-[#FFF3E0] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">This Week</Text>
                <Text className="text-xl font-bold text-[#FF6B00]">
                  {formatCurrency(0)}
                </Text>
              </View>
            </View>
            {/* Total Jobs */}
            <View className="w-1/2 px-1.5 mb-3">
              <View className="bg-[#E3F2FD] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">Total Jobs</Text>
                <Text className="text-xl font-bold text-[#1A1A2E]">
                  {profile?.completedBookings ?? 0}
                </Text>
              </View>
            </View>
            {/* Rating */}
            <View className="w-1/2 px-1.5 mb-3">
              <View className="bg-[#FFFDE7] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">Rating</Text>
                <Text className="text-xl font-bold text-[#1A1A2E]">
                  {profile?.rating?.toFixed(1) ?? "0.0"} ★
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incoming Requests */}
        <View className="px-5 mt-4">
          <Text className="text-lg font-bold text-[#1A1A2E] mb-3">
            Incoming Requests
          </Text>
          {pendingLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-8" />
          ) : pendingBookings.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center mb-4">
              <Text className="text-[#757575] text-sm">No pending requests</Text>
            </View>
          ) : (
            pendingBookings.map((booking: Booking) => (
              <View
                key={booking.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
              >
                <View className="flex-row justify-between mb-2">
                  <Text className="text-base font-bold text-[#1A1A2E]" numberOfLines={1}>
                    {(booking as any).service?.name ?? "Service"}
                  </Text>
                  <View className="bg-[#E3F2FD] px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-[#2196F3] font-semibold">New</Text>
                  </View>
                </View>
                <Text className="text-sm text-[#757575] mb-1">
                  Customer: {(booking as any).customer?.name ?? "Customer"}
                </Text>
                <Text className="text-sm text-[#757575] mb-1">
                  {formatDate(booking.scheduledDate)} at{" "}
                  {formatTime(booking.scheduledHour)}
                </Text>
                <Text className="text-sm text-[#757575] mb-3" numberOfLines={1}>
                  {booking.address?.line1 ?? "Address not provided"}
                </Text>

                {rejectingId === booking.id ? (
                  <View>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2"
                      placeholder="Reason for rejection..."
                      placeholderTextColor="#9E9E9E"
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      multiline
                    />
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="flex-1 bg-gray-100 rounded-xl py-2.5 mr-2 items-center"
                      >
                        <Text className="text-sm font-semibold text-[#757575]">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          if (!rejectReason.trim()) {
                            Alert.alert("Error", "Please provide a reason.");
                            return;
                          }
                          rejectMutation.mutate({
                            id: booking.id,
                            reason: rejectReason,
                          });
                        }}
                        disabled={rejectMutation.isPending}
                        className="flex-1 bg-[#F44336] rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-sm font-semibold text-white">
                          {rejectMutation.isPending ? "..." : "Confirm Reject"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => setRejectingId(booking.id)}
                      className="flex-1 bg-gray-100 rounded-xl py-2.5 mr-2 items-center"
                    >
                      <Text className="text-sm font-semibold text-[#F44336]">
                        Reject
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => acceptMutation.mutate(booking.id)}
                      disabled={acceptMutation.isPending}
                      className="flex-1 bg-[#FF6B00] rounded-xl py-2.5 items-center"
                    >
                      <Text className="text-sm font-semibold text-white">
                        {acceptMutation.isPending ? "..." : "Accept"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Today's Schedule */}
        <View className="px-5 mt-4 mb-8">
          <Text className="text-lg font-bold text-[#1A1A2E] mb-3">
            Today's Schedule
          </Text>
          {todayLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-8" />
          ) : todayBookings.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center">
              <Text className="text-[#757575] text-sm">
                No bookings scheduled for today
              </Text>
            </View>
          ) : (
            todayBookings.map((booking: Booking) => (
              <TouchableOpacity
                key={booking.id}
                onPress={() =>
                  router.push(`/(provider)/booking/${booking.id}` as any)
                }
                activeOpacity={0.7}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-[#1A1A2E]">
                    {formatTime(booking.scheduledHour)}
                  </Text>
                  <View className="bg-[#FFF3E0] px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-[#FF6B00] font-semibold">
                      Assigned
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-[#1A1A2E] font-semibold">
                  {(booking as any).service?.name ?? "Service"}
                </Text>
                <Text className="text-sm text-[#757575]">
                  {(booking as any).customer?.name ?? "Customer"}
                </Text>
                <Text className="text-xs text-[#757575] mt-1" numberOfLines={1}>
                  {booking.address?.line1 ?? ""}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
