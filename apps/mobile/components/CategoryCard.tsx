import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const CATEGORY_ICONS: Record<string, string> = {
  "salon-women": "\uD83D\uDC87\u200D\u2640\uFE0F",
  "salon-men": "\uD83D\uDC88",
  "ac-appliance": "\u2744\uFE0F",
  cleaning: "\uD83E\uDDF9",
  electrician: "\u26A1",
  plumber: "\uD83D\uDD27",
  painter: "\uD83C\uDFA8",
  "pest-control": "\uD83D\uDC1B",
};

interface CategoryCardProps {
  category: { id: string; name: string; slug: string; icon?: string };
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-1/2 p-1.5"
      activeOpacity={0.7}
    >
      <View className="bg-primary-50 rounded-2xl p-4 items-center">
        <Text style={{ fontSize: 32 }}>
          {CATEGORY_ICONS[category.slug] ?? "\uD83D\uDCCB"}
        </Text>
        <Text className="text-sm font-semibold text-secondary mt-2 text-center">
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
