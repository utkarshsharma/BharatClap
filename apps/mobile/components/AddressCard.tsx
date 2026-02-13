import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface AddressCardProps {
  address: {
    id: string;
    label: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  };
  isSelected?: boolean;
  onPress: () => void;
  onDelete?: () => void;
}

const LABEL_ICONS: Record<string, string> = {
  Home: "\uD83C\uDFE0",
  Work: "\uD83C\uDFE2",
  Other: "\uD83D\uDCCD",
};

export function AddressCard({
  address,
  isSelected = false,
  onPress,
  onDelete,
}: AddressCardProps) {
  const labelIcon = LABEL_ICONS[address.label] ?? LABEL_ICONS.Other;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-2xl border p-4 mb-3 ${
        isSelected ? "border-primary bg-primary-50" : "border-gray-200 bg-white"
      }`}
      activeOpacity={0.7}
    >
      {/* Top row: label + default badge + delete */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Text style={{ fontSize: 18 }}>{labelIcon}</Text>
          <Text className="text-base font-bold text-secondary ml-2">
            {address.label}
          </Text>
          {address.isDefault && (
            <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded">
              <Text className="text-xs text-primary font-semibold">
                {"\u2B50"} Default
              </Text>
            </View>
          )}
        </View>
        {onDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            className="p-1.5"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-red-400 text-sm font-medium">Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Address text */}
      <Text className="text-sm text-gray-600 leading-5">
        {address.addressLine}
      </Text>
      <Text className="text-sm text-gray-500 mt-0.5">
        {address.city}, {address.state} - {address.pincode}
      </Text>
    </TouchableOpacity>
  );
}
