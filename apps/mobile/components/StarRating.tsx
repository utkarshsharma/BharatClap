import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const handlePress = (starValue: number) => {
    if (interactive && onRate) {
      onRate(starValue);
    }
  };

  return (
    <View className="flex-row items-center">
      {stars.map((starValue) => {
        const filled = starValue <= Math.round(rating);
        const halfFilled =
          !filled && starValue - 0.5 <= rating && rating > starValue - 1;

        const starChar = filled
          ? "\u2605"
          : halfFilled
            ? "\u2605"
            : "\u2606";

        const StarWrapper = interactive ? TouchableOpacity : View;
        const wrapperProps = interactive
          ? {
              onPress: () => handlePress(starValue),
              activeOpacity: 0.6,
              hitSlop: { top: 4, bottom: 4, left: 2, right: 2 },
            }
          : {};

        return (
          <StarWrapper key={starValue} {...(wrapperProps as any)}>
            <Text
              style={{
                fontSize: size,
                color: filled || halfFilled ? "#F59E0B" : "#D1D5DB",
                marginRight: 1,
              }}
            >
              {starChar}
            </Text>
          </StarWrapper>
        );
      })}
    </View>
  );
}
