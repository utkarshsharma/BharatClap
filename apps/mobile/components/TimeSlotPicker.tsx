import "../global.css";
import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { formatTime } from "@/utils/format";

interface TimeSlotPickerProps {
  availableHours: number[];
  selectedHour: number | null;
  onSelect: (hour: number) => void;
  disabledHours?: number[];
}

export function TimeSlotPicker({
  availableHours,
  selectedHour,
  onSelect,
  disabledHours = [],
}: TimeSlotPickerProps) {
  const isDisabled = (hour: number) => disabledHours.includes(hour);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {availableHours.map((hour) => {
          const disabled = isDisabled(hour);
          const selected = selectedHour === hour;

          let containerClass =
            "mr-2 px-4 py-3 rounded-xl border items-center justify-center min-w-[80px]";
          let textClass = "text-sm font-semibold";

          if (disabled) {
            containerClass += " border-gray-100 bg-gray-50";
            textClass += " text-gray-300";
          } else if (selected) {
            containerClass += " border-primary bg-primary";
            textClass += " text-white";
          } else {
            containerClass += " border-gray-200 bg-white";
            textClass += " text-secondary";
          }

          return (
            <TouchableOpacity
              key={hour}
              onPress={() => !disabled && onSelect(hour)}
              className={containerClass}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <Text className={textClass}>{formatTime(hour)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {availableHours.length === 0 && (
        <View className="py-6 items-center">
          <Text className="text-sm text-gray-400">
            No time slots available for this date
          </Text>
        </View>
      )}
    </View>
  );
}
