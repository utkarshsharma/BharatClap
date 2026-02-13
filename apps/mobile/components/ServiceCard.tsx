import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { formatCurrency, formatDuration } from "@/utils/format";

interface ServiceCardProps {
  service: {
    id?: string;
    name: string;
    basePrice: number;
    duration: number;
    description?: string;
    slug?: string;
    image?: string;
  };
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="text-base font-bold text-secondary mb-1"
            numberOfLines={2}
          >
            {service.name}
          </Text>
          {service.description ? (
            <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>
              {service.description}
            </Text>
          ) : null}
          <View className="flex-row items-center">
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(service.basePrice)}
            </Text>
            <View className="ml-3 bg-secondary-50 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-secondary-700 font-medium">
                {formatDuration(service.duration)}
              </Text>
            </View>
          </View>
        </View>
        {service.image ? (
          <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
            <Text className="text-3xl">{"\uD83D\uDEE0\uFE0F"}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
