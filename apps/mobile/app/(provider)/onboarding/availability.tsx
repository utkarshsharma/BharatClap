import "../../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import api from "@/services/api";

// dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday (matches backend)
const DAYS = [
  { dayOfWeek: 1, label: "Monday", short: "Mon" },
  { dayOfWeek: 2, label: "Tuesday", short: "Tue" },
  { dayOfWeek: 3, label: "Wednesday", short: "Wed" },
  { dayOfWeek: 4, label: "Thursday", short: "Thu" },
  { dayOfWeek: 5, label: "Friday", short: "Fri" },
  { dayOfWeek: 6, label: "Saturday", short: "Sat" },
  { dayOfWeek: 0, label: "Sunday", short: "Sun" },
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

type Schedule = Record<number, DaySchedule>;

const defaultSchedule: Schedule = {
  1: { enabled: true, startHour: 9, endHour: 18 },
  2: { enabled: true, startHour: 9, endHour: 18 },
  3: { enabled: true, startHour: 9, endHour: 18 },
  4: { enabled: true, startHour: 9, endHour: 18 },
  5: { enabled: true, startHour: 9, endHour: 18 },
  6: { enabled: true, startHour: 10, endHour: 16 },
  0: { enabled: false, startHour: 10, endHour: 16 },
};

export default function ProviderAvailabilityScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await api.get('/provider/availability');
      const slots = response.data;
      if (Array.isArray(slots) && slots.length > 0) {
        const loaded: Schedule = { ...defaultSchedule };
        for (const slot of slots) {
          loaded[slot.dayOfWeek] = {
            enabled: slot.isActive,
            startHour: slot.startHour,
            endHour: slot.endHour,
          };
        }
        setSchedule(loaded);
      }
    } catch {
      // Fall back to default schedule on error (e.g. 404 for new providers)
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        enabled: !prev[dayOfWeek].enabled,
      },
    }));
  };

  const setStartHour = (dayOfWeek: number, hour: number) => {
    setSchedule((prev) => {
      const end = prev[dayOfWeek].endHour;
      if (hour >= end) {
        Alert.alert("Invalid Time", "Start time must be before end time.");
        return prev;
      }
      return {
        ...prev,
        [dayOfWeek]: { ...prev[dayOfWeek], startHour: hour },
      };
    });
  };

  const setEndHour = (dayOfWeek: number, hour: number) => {
    setSchedule((prev) => {
      const start = prev[dayOfWeek].startHour;
      if (hour <= start) {
        Alert.alert("Invalid Time", "End time must be after start time.");
        return prev;
      }
      return {
        ...prev,
        [dayOfWeek]: { ...prev[dayOfWeek], endHour: hour },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slots = Object.entries(schedule).map(([dayStr, ds]) => ({
        dayOfWeek: Number(dayStr),
        startHour: ds.startHour,
        endHour: ds.endHour,
        isActive: ds.enabled,
      }));
      await api.patch('/provider/availability', { slots });
      Alert.alert("Saved", "Availability saved successfully!");
    } catch {
      Alert.alert("Error", "Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">Loading availability...</Text>
      </SafeAreaView>
    );
  }

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
            const ds = schedule[day.dayOfWeek];
            const isExpanded = expandedDay === day.dayOfWeek;

            return (
              <View
                key={day.dayOfWeek}
                className="bg-white border border-gray-200 rounded-2xl mb-3 overflow-hidden"
              >
                {/* Day Header */}
                <TouchableOpacity
                  onPress={() =>
                    setExpandedDay(isExpanded ? null : day.dayOfWeek)
                  }
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-4"
                >
                  <View className="flex-row items-center flex-1">
                    <Switch
                      value={ds.enabled}
                      onValueChange={() => toggleDay(day.dayOfWeek)}
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
                          onPress={() => setStartHour(day.dayOfWeek, hour)}
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
                          onPress={() => setEndHour(day.dayOfWeek, hour)}
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
              const ds = schedule[day.dayOfWeek];
              return (
                <View
                  key={day.dayOfWeek}
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
            disabled={saving}
            className={`rounded-xl py-4 items-center ${saving ? "bg-[#FFB074]" : "bg-[#FF6B00]"}`}
          >
            <Text className="text-base font-bold text-white">
              {saving ? "Saving..." : "Save Availability"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
