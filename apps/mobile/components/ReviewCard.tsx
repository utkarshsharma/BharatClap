import "../global.css";
import React from "react";
import { View, Text } from "react-native";
import { StarRating } from "./StarRating";
import { formatDate } from "@/utils/format";

interface ReviewCardProps {
  review: {
    id: string;
    overallRating: number;
    punctualityRating: number;
    qualityRating: number;
    behaviorRating: number;
    valueRating: number;
    comment?: string | null;
    customerName: string;
    createdAt: string;
    photos?: string[];
  };
}

function MiniRating({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-xs text-gray-500">{label}</Text>
      <View className="flex-row items-center">
        <StarRating rating={value} size={10} maxStars={5} />
        <Text className="text-xs text-gray-600 ml-1 font-medium">
          {value.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      {/* Header: name + date */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View className="w-9 h-9 rounded-full bg-secondary-50 items-center justify-center mr-2.5">
            <Text className="text-sm font-bold text-secondary">
              {review.customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-secondary" numberOfLines={1}>
              {review.customerName}
            </Text>
            <Text className="text-xs text-gray-400">
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Overall rating */}
      <View className="flex-row items-center mb-3">
        <StarRating rating={review.overallRating} size={16} />
        <Text className="text-sm font-bold text-secondary ml-2">
          {review.overallRating.toFixed(1)}
        </Text>
      </View>

      {/* Comment */}
      {review.comment ? (
        <Text className="text-sm text-gray-700 leading-5 mb-3">
          {review.comment}
        </Text>
      ) : null}

      {/* Dimension ratings */}
      <View className="bg-gray-50 rounded-xl p-3">
        <MiniRating label="Punctuality" value={review.punctualityRating} />
        <MiniRating label="Quality" value={review.qualityRating} />
        <MiniRating label="Behavior" value={review.behaviorRating} />
        <MiniRating label="Value for Money" value={review.valueRating} />
      </View>

      {/* Photos */}
      {review.photos && review.photos.length > 0 ? (
        <View className="flex-row mt-3">
          {review.photos.slice(0, 4).map((photo, index) => (
            <View
              key={index}
              className="w-16 h-16 rounded-lg bg-gray-100 mr-2 items-center justify-center overflow-hidden"
            >
              <Text className="text-xs text-gray-400">
                {"\uD83D\uDDBC\uFE0F"}
              </Text>
            </View>
          ))}
          {review.photos.length > 4 ? (
            <View className="w-16 h-16 rounded-lg bg-gray-200 items-center justify-center">
              <Text className="text-sm font-semibold text-gray-600">
                +{review.photos.length - 4}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
