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
import { bookingService, type Booking } from "@/services/bookings";
import { formatDate, formatTime } from "@/utils/format";
import { CONFIG } from "@/constants/config";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "CONFIRMED", label: "Pending" },
  { key: "PROVIDER_ASSIGNED,IN_PROGRESS", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-gray-100", text: "text-gray-600", label: "Pending" },
  CONFIRMED: { bg: "bg-[#E3F2FD]", text: "text-[#2196F3]", label: "Confirmed" },
  PROVIDER_ASSIGNED: { bg: "bg-[#FFF3E0]", text: "text-[#FF6B00]", label: "Assigned" },
  IN_PROGRESS: { bg: "bg-[#FFFDE7]", text: "text-[#FF9800]", label: "In Progress" },
  COMPLETED: { bg: "bg-[#E8F5E9]", text: "text-[#4CAF50]", label: "Completed" },
  CANCELLED: { bg: "bg-[#FFEBEE]", text: "text-[#F44336]", label: "Cancelled" },
};

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const statusParam = activeFilter === "all" ? undefined : activeFilter;

  const {
    data,
    isLoading,
    refetch,
    isFetchingNextPage,
  } = useQuery({
    queryKey: ["provider-bookings", activeFilter, page],
    queryFn: () =>
      bookingService.getBookings({
        role: "provider",
        status: statusParam,
        page,
        limit: CONFIG.RESULTS_PER_PAGE,
      }),
  });

  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  React.useEffect(() => {
    if (data?.bookings) {
      if (page === 1) {
        setAllBookings(data.bookings);
      } else {
        setAllBookings((prev) => [...prev, ...data.bookings]);
      }
    }
  }, [data, page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onFilterChange = (key: string) => {
    setActiveFilter(key);
    setPage(1);
    setAllBookings([]);
  };

  const loadMore = () => {
    if (data && allBookings.length < data.total) {
      setPage((p) => p + 1);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const sc = getStatusConfig(item.status);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(provider)/booking/${item.id}` as any)}
        activeOpacity={0.7}
        className="bg-white border border-gray-200 rounded-2xl p-4 mx-5 mb-3"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-[#1A1A2E] flex-1 mr-2" numberOfLines={1}>
            {(item as any).service?.name ?? "Service"}
          </Text>
          <View className={`${sc.bg} px-2.5 py-0.5 rounded-full`}>
            <Text className={`text-xs font-semibold ${sc.text}`}>{sc.label}</Text>
          </View>
        </View>
        <Text className="text-sm text-[#757575] mb-1">
          Customer: {(item as any).customer?.name ?? "Customer"}
        </Text>
        <Text className="text-sm text-[#757575]">
          {formatDate(item.scheduledDate)} at {formatTime(item.scheduledHour)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    const filterLabel =
      FILTERS.find((f) => f.key === activeFilter)?.label ?? "matching";
    return (
      <View className="items-center justify-center py-16 px-8">
        <Text style={{ fontSize: 48 }}>📋</Text>
        <Text className="text-lg font-semibold text-[#1A1A2E] mt-4 text-center">
          No {filterLabel.toLowerCase()} bookings
        </Text>
        <Text className="text-sm text-[#757575] mt-2 text-center">
          {activeFilter === "all"
            ? "Your bookings will appear here once customers book your services."
            : `You don't have any ${filterLabel.toLowerCase()} bookings right now.`}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-[#1A1A2E]">My Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View className="px-5 pt-2 pb-3">
        <FlatList
          data={FILTERS as any}
          keyExtractor={(item: any) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              onPress={() => onFilterChange(item.key)}
              className={`mr-2 px-4 py-2 rounded-full ${
                activeFilter === item.key
                  ? "bg-[#FF6B00]"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeFilter === item.key
                    ? "text-white"
                    : "text-[#757575]"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Bookings List */}
      {isLoading && page === 1 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <FlatList
          data={allBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B00"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoading && page > 1 ? (
              <ActivityIndicator size="small" color="#FF6B00" className="py-4" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
