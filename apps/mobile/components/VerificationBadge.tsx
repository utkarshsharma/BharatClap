import "../global.css";
import React from "react";
import { View, Text } from "react-native";

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: "sm" | "md";
  showUnverified?: boolean;
}

export function VerificationBadge({
  isVerified,
  size = "md",
  showUnverified = false,
}: VerificationBadgeProps) {
  if (!isVerified && !showUnverified) {
    return null;
  }

  const isSm = size === "sm";

  if (isVerified) {
    return (
      <View className="flex-row items-center">
        <View
          className={`rounded-full bg-green-500 items-center justify-center ${
            isSm ? "w-4 h-4" : "w-5 h-5"
          }`}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: isSm ? 9 : 11, lineHeight: isSm ? 14 : 17 }}
          >
            {"\u2713"}
          </Text>
        </View>
        {!isSm && (
          <Text className="text-xs font-semibold text-green-600 ml-1">
            Verified
          </Text>
        )}
      </View>
    );
  }

  // Unverified state (only shown when showUnverified is true)
  return (
    <View className="flex-row items-center">
      <View
        className={`rounded-full bg-gray-300 items-center justify-center ${
          isSm ? "w-4 h-4" : "w-5 h-5"
        }`}
      >
        <Text
          className="text-white font-bold"
          style={{ fontSize: isSm ? 9 : 11, lineHeight: isSm ? 14 : 17 }}
        >
          {"?"}
        </Text>
      </View>
      {!isSm && (
        <Text className="text-xs font-medium text-gray-400 ml-1">
          Unverified
        </Text>
      )}
    </View>
  );
}
