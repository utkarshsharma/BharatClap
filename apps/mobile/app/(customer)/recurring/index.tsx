import "../../../global.css";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { formatTime } from "@/utils/format";

// ---------- Types ----------
interface RecurringBooking {
  id: string;
  serviceName: string;
  providerName: string;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  scheduledHour: number;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  nextDate: string;
  createdAt: string;
}

// ---------- Constants ----------
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "bg-[#E8F5E9]", text: "text-[#4CAF50]", label: "Active" },
  PAUSED: { bg: "bg-[#FFF3E0]", text: "text-[#FF9800]", label: "Paused" },
  CANCELLED: { bg: "bg-[#FFEBEE]", text: "text-[#F44336]", label: "Cancelled" },
};

// ---------- Mock data for development ----------
const MOCK_RECURRING: RecurringBooking[] = [
  {
    id: "rec-1",
    serviceName: "Home Deep Cleaning",
    providerName: "Ramesh K.",
    frequency: "WEEKLY",
    dayOfWeek: 6, // Saturday
    scheduledHour: 10,
    status: "ACTIVE",
    nextDate: "2026-02-14",
    createdAt: "2026-01-10",
  },
  {
    id: "rec-2",
    serviceName: "AC Service & Repair",
    providerName: "Suresh M.",
    frequency: "MONTHLY",
    dayOfWeek: 1, // Monday
    scheduledHour: 14,
    status: "ACTIVE",
    nextDate: "2026-03-02",
    createdAt: "2026-01-15",
  },
  {
    id: "rec-3",
    serviceName: "Women's Haircut",
    providerName: "Priya S.",
    frequency: "BIWEEKLY",
    dayOfWeek: 3, // Wednesday
    scheduledHour: 11,
    status: "PAUSED",
    nextDate: "2026-02-19",
    createdAt: "2026-01-20",
  },
];

// ---------- Fetch function (mock for now) ----------
const fetchRecurringBookings = async (): Promise<RecurringBooking[]> => {
  // TODO: Replace with actual API call:
  // const response = await api.get('/bookings/recurring');
  // return response.data;
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_RECURRING), 600));
};

// ---------- Screen ----------
export default function RecurringBookingsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: bookings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["recurring-bookings"],
    queryFn: fetchRecurringBookings,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  };

  const renderBookingCard = ({ item }: { item: RecurringBooking }) => {
    const sc = getStatusConfig(item.status);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="bg-white border border-gray-200 rounded-2xl p-4 mx-5 mb-3"
        onPress={() => {
          // Navigate to detail / edit screen in the future
        }}
      >
        {/* Top row: service name + status */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-[#1A1A2E] flex-1 mr-2" numberOfLines={1}>
            {item.serviceName}
          </Text>
          <View className={`${sc.bg} px-2.5 py-0.5 rounded-full`}>
            <Text className={`text-xs font-semibold ${sc.text}`}>{sc.label}</Text>
          </View>
        </View>

        {/* Provider */}
        <View className="flex-row items-center mb-2">
          <Text style={{ fontSize: 14 }}>{"👤"}</Text>
          <Text className="text-sm text-[#757575] ml-1.5">{item.providerName}</Text>
        </View>

        {/* Frequency + Day + Time */}
        <View className="flex-row items-center flex-wrap">
          <View className="bg-[#FF6B00]/10 px-2.5 py-1 rounded-full mr-2 mb-1">
            <Text className="text-xs font-semibold text-[#FF6B00]">
              {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
            </Text>
          </View>
          <View className="bg-gray-100 px-2.5 py-1 rounded-full mr-2 mb-1">
            <Text className="text-xs font-semibold text-[#1A1A2E]">
              {DAYS[item.dayOfWeek]}
            </Text>
          </View>
          <View className="bg-gray-100 px-2.5 py-1 rounded-full mb-1">
            <Text className="text-xs font-semibold text-[#1A1A2E]">
              {formatTime(item.scheduledHour)}
            </Text>
          </View>
        </View>

        {/* Next booking date */}
        {item.status === "ACTIVE" && (
          <Text className="text-xs text-[#757575] mt-2">
            Next booking: {new Date(item.nextDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="items-center justify-center py-20 px-8">
        <Text style={{ fontSize: 48 }}>{"🔄"}</Text>
        <Text className="text-lg font-semibold text-[#1A1A2E] mt-4 text-center">
          No recurring bookings
        </Text>
        <Text className="text-sm text-[#757575] mt-2 text-center">
          Set up a recurring booking and never worry about scheduling again.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(customer)/recurring/create" as any)}
          className="mt-6 bg-[#FF6B00] px-6 py-3 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Create Your First</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-[#1A1A2E]">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1A1A2E]">Recurring Bookings</Text>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-sm text-gray-500 mt-3">Loading recurring bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
          }
        />
      )}

      {/* FAB - Create New */}
      {(bookings ?? []).length > 0 && (
        <TouchableOpacity
          onPress={() => router.push("/(customer)/recurring/create" as any)}
          activeOpacity={0.85}
          className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-[#FF6B00] items-center justify-center"
          style={{
            shadowColor: "#FF6B00",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-white text-3xl font-light" style={{ marginTop: -2 }}>
            +
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
