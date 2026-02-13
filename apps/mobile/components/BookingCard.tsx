import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PROVIDER_ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-800",
  },
  CONFIRMED: {
    label: "Confirmed",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
  },
  PROVIDER_ASSIGNED: {
    label: "Provider Assigned",
    bgClass: "bg-indigo-100",
    textClass: "text-indigo-800",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bgClass: "bg-orange-100",
    textClass: "text-orange-800",
  },
  COMPLETED: {
    label: "Completed",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
  },
  REFUNDED: {
    label: "Refunded",
    bgClass: "bg-gray-100",
    textClass: "text-gray-700",
  },
};

interface BookingCardProps {
  booking: {
    id: string;
    service: { name: string };
    provider?: { name: string; avatarUrl?: string } | null;
    scheduledDate: string;
    scheduledHour: number;
    status: BookingStatus;
    amount: number;
  };
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      activeOpacity={0.7}
    >
      {/* Top row: service name + status badge */}
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-base font-bold text-secondary flex-1 mr-2"
          numberOfLines={1}
        >
          {booking.service.name}
        </Text>
        <View className={`px-2.5 py-1 rounded-full ${statusConfig.bgClass}`}>
          <Text className={`text-xs font-semibold ${statusConfig.textClass}`}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Date & time */}
      <View className="flex-row items-center mb-2">
        <Text className="text-sm text-gray-500">
          {formatDate(booking.scheduledDate)}
        </Text>
        <Text className="text-sm text-gray-400 mx-1.5">{"\u2022"}</Text>
        <Text className="text-sm text-gray-500">
          {formatTime(booking.scheduledHour)}
        </Text>
      </View>

      {/* Provider & amount */}
      <View className="flex-row items-center justify-between">
        {booking.provider ? (
          <View className="flex-row items-center flex-1">
            <View className="w-7 h-7 rounded-full bg-secondary-50 items-center justify-center mr-2">
              <Text className="text-xs font-bold text-secondary">
                {booking.provider.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {booking.provider.name}
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-gray-400 italic flex-1">
            Awaiting provider
          </Text>
        )}
        <Text className="text-base font-bold text-primary">
          {formatCurrency(booking.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
