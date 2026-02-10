import "../../../global.css";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBookingStore } from "@/store/bookingStore";
import { TIME_SLOTS } from "@/constants/timeSlots";
import { CONFIG } from "@/constants/config";

function generateDates(count: number) {
  const dates: { key: string; dateStr: string; dayLabel: string; dayNum: number; monthLabel: string; isToday: boolean }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    dates.push({
      key: iso,
      dateStr: iso,
      dayLabel: dayNames[d.getDay()],
      dayNum: d.getDate(),
      monthLabel: monthNames[d.getMonth()],
      isToday: i === 0,
    });
  }
  return dates;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const selectedDate = useBookingStore((s) => s.selectedDate);
  const selectedHour = useBookingStore((s) => s.selectedHour);
  const setSelectedDate = useBookingStore((s) => s.setSelectedDate);
  const setSelectedHour = useBookingStore((s) => s.setSelectedHour);

  const dates = useMemo(
    () => generateDates(CONFIG.MAX_BOOKING_ADVANCE_DAYS),
    []
  );

  const [localDate, setLocalDate] = useState(selectedDate ?? dates[0].dateStr);
  const [localHour, setLocalHour] = useState<number | null>(selectedHour);

  const canContinue = localDate && localHour !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    setSelectedDate(localDate);
    setSelectedHour(localHour!);
    router.push("/(customer)/booking/address" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Select Date & Time</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Date Picker */}
        <View className="pt-5 pb-3">
          <Text className="text-lg font-bold text-secondary px-5 mb-3">
            Select Date
          </Text>
          <FlatList
            data={dates}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => {
              const isSelected = item.dateStr === localDate;
              return (
                <TouchableOpacity
                  onPress={() => setLocalDate(item.dateStr)}
                  className={`mr-3 items-center px-3 py-3 rounded-2xl border ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                  style={{ minWidth: 64 }}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-xs font-medium mb-1 ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {item.isToday ? "Today" : item.dayLabel}
                  </Text>
                  <Text
                    className={`text-xl font-bold ${
                      isSelected ? "text-white" : "text-secondary"
                    }`}
                  >
                    {item.dayNum}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {item.monthLabel}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Time Slots */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-lg font-bold text-secondary mb-3">
            Select Time
          </Text>
          <View className="flex-row flex-wrap">
            {TIME_SLOTS.map((slot) => {
              const isSelected = slot.hour === localHour;
              return (
                <TouchableOpacity
                  key={slot.hour}
                  onPress={() => setLocalHour(slot.hour)}
                  className={`mr-2 mb-2 px-4 py-2.5 rounded-xl border ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? "text-white" : "text-secondary"
                    }`}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="px-5 py-4 pb-8 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          className={`py-4 rounded-xl items-center ${
            canContinue ? "bg-primary" : "bg-gray-300"
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
