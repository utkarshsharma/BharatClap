import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { formatCurrency, formatDistance, formatRating } from "@/utils/format";
import { VerificationBadge } from "./VerificationBadge";
import { StarRating } from "./StarRating";

interface ProviderCardProps {
  provider: {
    id: string;
    user: { name: string; avatarUrl?: string | null };
    avgRating: number;
    totalJobs: number;
    isVerified: boolean;
    distance?: number | null;
    providerServices?: { basePrice: number }[];
  };
  onPress: () => void;
}

export function ProviderCard({ provider, onPress }: ProviderCardProps) {
  const initial = provider.user.name.charAt(0).toUpperCase();
  const firstServicePrice = provider.providerServices?.[0]?.basePrice;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="w-14 h-14 rounded-full bg-primary-50 items-center justify-center mr-3">
          <Text className="text-xl font-bold text-primary">{initial}</Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          {/* Name + verification */}
          <View className="flex-row items-center mb-1">
            <Text
              className="text-base font-bold text-secondary mr-1.5"
              numberOfLines={1}
            >
              {provider.user.name}
            </Text>
            <VerificationBadge isVerified={provider.isVerified} size="sm" />
          </View>

          {/* Rating + jobs */}
          <View className="flex-row items-center mb-1.5">
            <StarRating rating={provider.avgRating} size={14} />
            <Text className="text-sm text-gray-500 ml-1.5">
              {formatRating(provider.avgRating)}
            </Text>
            <Text className="text-gray-300 mx-1.5">{"\u2022"}</Text>
            <Text className="text-sm text-gray-500">
              {provider.totalJobs} jobs
            </Text>
          </View>

          {/* Price + distance */}
          <View className="flex-row items-center">
            {firstServicePrice != null ? (
              <Text className="text-sm font-semibold text-primary">
                From {formatCurrency(firstServicePrice)}
              </Text>
            ) : null}
            {provider.distance != null ? (
              <>
                {firstServicePrice != null && (
                  <Text className="text-gray-300 mx-1.5">{"\u2022"}</Text>
                )}
                <Text className="text-sm text-gray-500">
                  {formatDistance(provider.distance)}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
