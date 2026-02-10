import "../../../global.css";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { bookingService, type Booking } from "@/services/bookings";
import { formatDate, formatTime } from "@/utils/format";

type Tab = "upcoming" | "past";

const UPCOMING_STATUSES = "CONFIRMED,PROVIDER_ASSIGNED,IN_PROGRESS";
const PAST_STATUSES = "COMPLETED,CANCELLED";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700" },
  PROVIDER_ASSIGNED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  IN_PROGRESS: { bg: "bg-yellow-100", text: "text-yellow-700" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PROVIDER_ASSIGNED: "Provider Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function CustomerBookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ["bookings", "upcoming"],
    queryFn: () =>
      bookingService.getBookings({ status: UPCOMING_STATUSES, role: "customer" }),
  });

  const {
    data: pastData,
    isLoading: pastLoading,
    refetch: refetchPast,
  } = useQuery({
    queryKey: ["bookings", "past"],
    queryFn: () =>
      bookingService.getBookings({ status: PAST_STATUSES, role: "customer" }),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUpcoming(), refetchPast()]);
    setRefreshing(false);
  }, [refetchUpcoming, refetchPast]);

  const isLoading = activeTab === "upcoming" ? upcomingLoading : pastLoading;
  const bookings =
    activeTab === "upcoming"
      ? upcomingData?.bookings ?? []
      : pastData?.bookings ?? [];

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const statusColor = STATUS_COLORS[item.status] ?? {
      bg: "bg-gray-100",
      text: "text-gray-700",
    };
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(customer)/booking/${item.id}` as any)}
        className="mx-5 mb-3 bg-white rounded-2xl border border-gray-100 p-4"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-base font-bold text-secondary flex-1 mr-2" numberOfLines={1}>
            {(item as any).serviceName ?? `Booking`}
          </Text>
          <View className={`px-3 py-1 rounded-full ${statusColor.bg}`}>
            <Text className={`text-xs font-semibold ${statusColor.text}`}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
        </View>
        {(item as any).providerName && (
          <Text className="text-sm text-gray-500 mb-1">
            Provider: {(item as any).providerName}
          </Text>
        )}
        <Text className="text-sm text-gray-500">
          {formatDate(item.scheduledDate)} at {formatTime(item.scheduledHour)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-secondary">My Bookings</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-5 mt-2 mb-4 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          onPress={() => setActiveTab("upcoming")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            activeTab === "upcoming" ? "bg-white" : ""
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${
              activeTab === "upcoming" ? "text-primary" : "text-gray-500"
            }`}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("past")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            activeTab === "past" ? "bg-white" : ""
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${
              activeTab === "past" ? "text-primary" : "text-gray-500"
            }`}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B00" className="mt-12" />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
          }
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>
                {activeTab === "upcoming" ? "📅" : "📋"}
              </Text>
              <Text className="text-lg font-semibold text-secondary mt-4">
                No {activeTab} bookings
              </Text>
              <Text className="text-sm text-gray-400 mt-1 text-center px-10">
                {activeTab === "upcoming"
                  ? "Book a service to see your upcoming bookings here"
                  : "Your completed and cancelled bookings will appear here"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
