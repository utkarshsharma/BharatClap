import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const DAYS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
] as const;

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

const formatHour = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
};

interface DaySchedule {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

type Schedule = Record<string, DaySchedule>;

const defaultSchedule: Schedule = {
  mon: { enabled: true, startHour: 9, endHour: 18 },
  tue: { enabled: true, startHour: 9, endHour: 18 },
  wed: { enabled: true, startHour: 9, endHour: 18 },
  thu: { enabled: true, startHour: 9, endHour: 18 },
  fri: { enabled: true, startHour: 9, endHour: 18 },
  sat: { enabled: true, startHour: 10, endHour: 16 },
  sun: { enabled: false, startHour: 10, endHour: 16 },
};

export default function ProviderAvailabilityScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const toggleDay = (dayKey: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
      },
    }));
  };

  const setStartHour = (dayKey: string, hour: number) => {
    setSchedule((prev) => {
      const end = prev[dayKey].endHour;
      if (hour >= end) {
        Alert.alert("Invalid Time", "Start time must be before end time.");
        return prev;
      }
      return {
        ...prev,
        [dayKey]: { ...prev[dayKey], startHour: hour },
      };
    });
  };

  const setEndHour = (dayKey: string, hour: number) => {
    setSchedule((prev) => {
      const start = prev[dayKey].startHour;
      if (hour <= start) {
        Alert.alert("Invalid Time", "End time must be after start time.");
        return prev;
      }
      return {
        ...prev,
        [dayKey]: { ...prev[dayKey], endHour: hour },
      };
    });
  };

  const handleSave = () => {
    Alert.alert("Saved", "Availability saved successfully!");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#1A1A2E]">Set Availability</Text>
        </View>

        <Text className="px-5 text-sm text-[#757575] mt-2 mb-4">
          Configure your working hours for each day of the week.
        </Text>

        {/* Day Rows */}
        <View className="px-5">
          {DAYS.map((day) => {
            const ds = schedule[day.key];
            const isExpanded = expandedDay === day.key;

            return (
              <View
                key={day.key}
                className="bg-white border border-gray-200 rounded-2xl mb-3 overflow-hidden"
              >
                {/* Day Header */}
                <TouchableOpacity
                  onPress={() =>
                    setExpandedDay(isExpanded ? null : day.key)
                  }
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-4"
                >
                  <View className="flex-row items-center flex-1">
                    <Switch
                      value={ds.enabled}
                      onValueChange={() => toggleDay(day.key)}
                      trackColor={{ false: "#E0E0E0", true: "#FFCC80" }}
                      thumbColor={ds.enabled ? "#FF6B00" : "#BDBDBD"}
                    />
                    <Text
                      className={`text-base font-semibold ml-3 ${
                        ds.enabled ? "text-[#1A1A2E]" : "text-[#757575]"
                      }`}
                    >
                      {day.label}
                    </Text>
                  </View>
                  {ds.enabled && (
                    <Text className="text-sm text-[#FF6B00]">
                      {formatHour(ds.startHour)} - {formatHour(ds.endHour)}
                    </Text>
                  )}
                  {!ds.enabled && (
                    <Text className="text-sm text-[#757575]">Off</Text>
                  )}
                </TouchableOpacity>

                {/* Expanded Time Picker */}
                {isExpanded && ds.enabled && (
                  <View className="px-4 pb-4 border-t border-gray-100">
                    {/* Start Time */}
                    <Text className="text-sm font-semibold text-[#1A1A2E] mt-3 mb-2">
                      Start Time
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mb-3"
                    >
                      {HOURS.filter((h) => h < ds.endHour).map((hour) => (
                        <TouchableOpacity
                          key={`start-${hour}`}
                          onPress={() => setStartHour(day.key, hour)}
                          className={`mr-2 px-3 py-2 rounded-lg ${
                            ds.startHour === hour
                              ? "bg-[#FF6B00]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              ds.startHour === hour
                                ? "text-white"
                                : "text-[#757575]"
                            }`}
                          >
                            {formatHour(hour)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* End Time */}
                    <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                      End Time
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {HOURS.filter((h) => h > ds.startHour).map((hour) => (
                        <TouchableOpacity
                          key={`end-${hour}`}
                          onPress={() => setEndHour(day.key, hour)}
                          className={`mr-2 px-3 py-2 rounded-lg ${
                            ds.endHour === hour
                              ? "bg-[#FF6B00]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              ds.endHour === hour
                                ? "text-white"
                                : "text-[#757575]"
                            }`}
                          >
                            {formatHour(hour)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Weekly Summary */}
        <View className="px-5 mt-4 mb-4">
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">
            Weekly Summary
          </Text>
          <View className="bg-[#FFF3E0] rounded-2xl p-4">
            {DAYS.map((day) => {
              const ds = schedule[day.key];
              return (
                <View
                  key={day.key}
                  className="flex-row items-center justify-between py-1.5"
                >
                  <Text className="text-sm font-semibold text-[#1A1A2E] w-12">
                    {day.short}
                  </Text>
                  {ds.enabled ? (
                    <View className="flex-row items-center flex-1">
                      <View className="h-2 bg-[#FF6B00] rounded-full flex-1 mx-2 opacity-70" />
                      <Text className="text-xs text-[#757575] w-28 text-right">
                        {formatHour(ds.startHour)} - {formatHour(ds.endHour)}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-[#757575] flex-1 text-right">
                      Unavailable
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <View className="px-5 mt-2 mb-8">
          <TouchableOpacity
            onPress={handleSave}
            className="bg-[#FF6B00] rounded-xl py-4 items-center"
          >
            <Text className="text-base font-bold text-white">Save Availability</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
