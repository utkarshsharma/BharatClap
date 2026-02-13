import "../../global.css";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingService, type Booking } from "@/services/bookings";
import { formatCurrency } from "@/utils/format";

type Period = "week" | "month" | "all";

const formatDateDisplay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

export default function ProviderEarningsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("week");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch completed bookings (paid earnings)
  const { data: earningsData, isLoading: earningsLoading, refetch: refetchEarnings } = useQuery({
    queryKey: ['provider-earnings'],
    queryFn: () => bookingService.getBookings({ role: 'provider', status: 'COMPLETED' }),
  });

  // Fetch confirmed bookings (pending earnings)
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['provider-pending-earnings'],
    queryFn: () => bookingService.getBookings({ role: 'provider', status: 'CONFIRMED' }),
  });

  const isLoading = earningsLoading || pendingLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchEarnings(), refetchPending()]);
    setRefreshing(false);
  }, [refetchEarnings, refetchPending]);

  // Map completed bookings to paid earnings
  const allEarnings = (earningsData?.bookings ?? []).map((b: Booking) => ({
    id: b.id,
    date: b.scheduledDate,
    serviceName: (b as any).service?.name ?? 'Service',
    amount: b.finalPrice ?? 0,
    status: 'paid' as const,
  }));

  // Map confirmed bookings to pending earnings
  const pendingEarnings = (pendingData?.bookings ?? []).map((b: Booking) => ({
    id: b.id,
    date: b.scheduledDate,
    serviceName: (b as any).service?.name ?? 'Service',
    amount: b.finalPrice ?? 0,
    status: 'pending' as const,
  }));

  const ALL_EARNINGS = [...allEarnings, ...pendingEarnings];

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredEarnings = ALL_EARNINGS.filter((e) => {
    if (period === "all") return true;
    const d = new Date(e.date);
    if (period === "week") return d >= oneWeekAgo;
    return d >= oneMonthAgo;
  });

  const totalEarned = ALL_EARNINGS.filter((e) => e.status === "paid").reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const pendingBalance = ALL_EARNINGS.filter((e) => e.status === "pending").reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const filteredTotal = filteredEarnings.reduce((sum, e) => sum + e.amount, 0);

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
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#1A1A2E]">Earnings</Text>
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color="#FF6B00" className="py-8" />
        )}

        {/* Summary Cards */}
        <View className="px-5 mt-4">
          <View className="flex-row -mx-1.5">
            {/* Total Earned */}
            <View className="flex-1 px-1.5">
              <View className="bg-[#E8F5E9] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">Total Earned</Text>
                <Text className="text-lg font-bold text-[#4CAF50]">
                  {formatCurrency(totalEarned)}
                </Text>
              </View>
            </View>
            {/* Pending Balance */}
            <View className="flex-1 px-1.5">
              <View className="bg-[#FFF3E0] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">Pending</Text>
                <Text className="text-lg font-bold text-[#FF9800]">
                  {formatCurrency(pendingBalance)}
                </Text>
              </View>
            </View>
            {/* Last Payout */}
            <View className="flex-1 px-1.5">
              <View className="bg-[#E3F2FD] rounded-2xl p-4">
                <Text className="text-xs text-[#757575] mb-1">Last Payout</Text>
                <Text className="text-lg font-bold text-[#2196F3]">
                  {formatCurrency(250000)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Period Filter */}
        <View className="flex-row px-5 mt-6 mb-4">
          {(
            [
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "all", label: "All Time" },
            ] as const
          ).map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className={`mr-2 px-4 py-2 rounded-full ${
                period === p.key ? "bg-[#FF6B00]" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  period === p.key ? "text-white" : "text-[#757575]"
                }`}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Total */}
        <View className="px-5 mb-3">
          <Text className="text-sm text-[#757575]">
            Period Total:{" "}
            <Text className="font-bold text-[#1A1A2E]">
              {formatCurrency(filteredTotal)}
            </Text>
          </Text>
        </View>

        {/* Earnings List */}
        <View className="px-5 mb-4">
          {filteredEarnings.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center">
              <Text className="text-[#757575] text-sm">
                No earnings for this period.
              </Text>
            </View>
          ) : (
            filteredEarnings.map((item) => (
              <View
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-[#1A1A2E] flex-1 mr-2">
                    {item.serviceName}
                  </Text>
                  <Text
                    className={`text-base font-bold ${
                      item.status === "paid" ? "text-[#4CAF50]" : "text-[#FF9800]"
                    }`}
                  >
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-[#757575]">
                    {formatDateDisplay(item.date)}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      item.status === "paid" ? "bg-[#E8F5E9]" : "bg-[#FFF3E0]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        item.status === "paid"
                          ? "text-[#4CAF50]"
                          : "text-[#FF9800]"
                      }`}
                    >
                      {item.status === "paid" ? "Paid" : "Pending"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Withdraw Button */}
        <View className="px-5 mt-2 mb-8">
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Withdraw",
                "Withdraw feature coming soon! Minimum withdrawal amount is Rs. 500."
              )
            }
            className="bg-[#FF6B00] rounded-xl py-4 items-center"
          >
            <Text className="text-base font-bold text-white">
              Withdraw {formatCurrency(pendingBalance)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
