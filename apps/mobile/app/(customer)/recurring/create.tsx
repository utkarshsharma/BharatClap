import "../../../global.css";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogService, type Service } from "@/services/catalog";
import { addressService, type Address } from "@/services/addresses";
import { formatTime, formatCurrency } from "@/utils/format";

// ---------- Types ----------
type Frequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface CreateRecurringData {
  serviceId: string;
  providerId: string;
  frequency: Frequency;
  dayOfWeek: number;
  scheduledHour: number;
  addressId: string;
}

// ---------- Constants ----------
const FREQUENCIES: { key: Frequency; label: string }[] = [
  { key: "WEEKLY", label: "Weekly" },
  { key: "BIWEEKLY", label: "Biweekly" },
  { key: "MONTHLY", label: "Monthly" },
];

const DAYS_OF_WEEK = [
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
  { key: 0, label: "Sun" },
];

// Available time slots (8 AM to 8 PM)
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => 8 + i);

// Mock providers for now
interface ProviderOption {
  id: string;
  name: string;
  rating: number;
}

const MOCK_PROVIDERS: ProviderOption[] = [
  { id: "prov-1", name: "Ramesh K.", rating: 4.8 },
  { id: "prov-2", name: "Suresh M.", rating: 4.6 },
  { id: "prov-3", name: "Priya S.", rating: 4.9 },
  { id: "prov-4", name: "Anil R.", rating: 4.5 },
];

// ---------- Screen ----------
export default function CreateRecurringBookingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>("WEEKLY");
  const [dayOfWeek, setDayOfWeek] = useState<number>(6); // Saturday default
  const [scheduledHour, setScheduledHour] = useState<number>(10); // 10 AM default
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["all-services-for-recurring"],
    queryFn: () => catalogService.getServices({ limit: 50 }),
  });
  const services = servicesData?.services ?? [];

  // Fetch addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses-for-recurring"],
    queryFn: addressService.getAll,
  });

  // Selected service details
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  // Selected provider details
  const selectedProvider = useMemo(
    () => MOCK_PROVIDERS.find((p) => p.id === selectedProviderId) ?? null,
    [selectedProviderId]
  );

  // Form valid?
  const isFormValid =
    selectedServiceId &&
    selectedProviderId &&
    frequency &&
    dayOfWeek !== null &&
    scheduledHour !== null &&
    selectedAddressId;

  // Submit handler
  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Incomplete", "Please fill in all fields to create a recurring booking.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual API call:
      // await api.post('/bookings/recurring', { ... });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      queryClient.invalidateQueries({ queryKey: ["recurring-bookings"] });
      Alert.alert("Success", "Recurring booking created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to create recurring booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-[#1A1A2E]">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1A1A2E]">Create Recurring Booking</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ---- Section: Select Service ---- */}
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">Select Service</Text>
          {servicesLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-4" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {services.map((service) => {
                const isSelected = service.id === selectedServiceId;
                return (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setSelectedServiceId(service.id)}
                    activeOpacity={0.7}
                    className={`mr-2 px-4 py-3 rounded-xl border ${
                      isSelected
                        ? "border-[#FF6B00] bg-[#FF6B00]/5"
                        : "border-gray-200 bg-white"
                    }`}
                    style={{ minWidth: 140 }}
                  >
                    <Text
                      className={`text-sm font-semibold mb-1 ${
                        isSelected ? "text-[#FF6B00]" : "text-[#1A1A2E]"
                      }`}
                      numberOfLines={2}
                    >
                      {service.name}
                    </Text>
                    <Text className="text-xs text-[#757575]">
                      {formatCurrency(service.basePrice)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ---- Section: Select Provider ---- */}
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">Select Provider</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {MOCK_PROVIDERS.map((provider) => {
              const isSelected = provider.id === selectedProviderId;
              return (
                <TouchableOpacity
                  key={provider.id}
                  onPress={() => setSelectedProviderId(provider.id)}
                  activeOpacity={0.7}
                  className={`mr-2 px-4 py-3 rounded-xl border items-center ${
                    isSelected
                      ? "border-[#FF6B00] bg-[#FF6B00]/5"
                      : "border-gray-200 bg-white"
                  }`}
                  style={{ minWidth: 110 }}
                >
                  <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mb-2">
                    <Text style={{ fontSize: 18 }}>{"👤"}</Text>
                  </View>
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? "text-[#FF6B00]" : "text-[#1A1A2E]"
                    }`}
                    numberOfLines={1}
                  >
                    {provider.name}
                  </Text>
                  <Text className="text-xs text-[#757575] mt-0.5">
                    {"★"} {provider.rating}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ---- Section: Frequency ---- */}
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">Frequency</Text>
          <View className="flex-row mb-5">
            {FREQUENCIES.map((f) => {
              const isSelected = f.key === frequency;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFrequency(f.key)}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 rounded-xl mr-2 items-center border ${
                    isSelected
                      ? "bg-[#FF6B00] border-[#FF6B00]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? "text-white" : "text-[#1A1A2E]"
                    }`}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ---- Section: Day of Week ---- */}
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">Day of Week</Text>
          <View className="flex-row flex-wrap mb-5">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = day.key === dayOfWeek;
              return (
                <TouchableOpacity
                  key={day.key}
                  onPress={() => setDayOfWeek(day.key)}
                  activeOpacity={0.7}
                  className={`w-12 h-12 rounded-full items-center justify-center mr-2 mb-2 ${
                    isSelected ? "bg-[#FF6B00]" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? "text-white" : "text-[#1A1A2E]"
                    }`}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ---- Section: Time Slot ---- */}
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">Time Slot</Text>
          <View className="flex-row flex-wrap mb-5">
            {TIME_SLOTS.map((hour) => {
              const isSelected = hour === scheduledHour;
              return (
                <TouchableOpacity
                  key={hour}
                  onPress={() => setScheduledHour(hour)}
                  activeOpacity={0.7}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${
                    isSelected
                      ? "bg-[#FF6B00] border-[#FF6B00]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-[#1A1A2E]"
                    }`}
                  >
                    {formatTime(hour)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ---- Section: Select Address ---- */}
          <Text className="text-base font-bold text-[#1A1A2E] mb-3">Address</Text>
          {addressesLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-4" />
          ) : (addresses ?? []).length === 0 ? (
            <View className="bg-gray-50 rounded-xl p-4 mb-5 items-center">
              <Text className="text-sm text-[#757575] mb-2">No saved addresses</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Coming Soon", "Add New Address will be available in a future update.")
                }
              >
                <Text className="text-sm font-semibold text-[#FF6B00]">+ Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mb-5">
              {(addresses ?? []).map((addr: Address) => {
                const isSelected = addr.id === selectedAddressId;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => setSelectedAddressId(addr.id)}
                    activeOpacity={0.7}
                    className={`mb-2 p-3 rounded-xl border ${
                      isSelected
                        ? "border-[#FF6B00] bg-[#FF6B00]/5"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <View className="flex-row items-center">
                      {/* Radio */}
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                          isSelected ? "border-[#FF6B00]" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <View className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-[#1A1A2E]">
                          {addr.label || "Address"}
                          {addr.isDefault && (
                            <Text className="text-xs text-[#FF6B00]"> (Default)</Text>
                          )}
                        </Text>
                        <Text className="text-xs text-[#757575] mt-0.5" numberOfLines={1}>
                          {addr.line1}, {addr.city} - {addr.pincode}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ---- Summary ---- */}
          {selectedService && (
            <View className="bg-gray-50 rounded-2xl p-4 mb-5">
              <Text className="text-sm font-bold text-[#1A1A2E] mb-2">Summary</Text>
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-[#757575]">Service</Text>
                <Text className="text-sm font-medium text-[#1A1A2E]">{selectedService.name}</Text>
              </View>
              {selectedProvider && (
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-[#757575]">Provider</Text>
                  <Text className="text-sm font-medium text-[#1A1A2E]">{selectedProvider.name}</Text>
                </View>
              )}
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-[#757575]">Schedule</Text>
                <Text className="text-sm font-medium text-[#1A1A2E]">
                  {FREQUENCIES.find((f) => f.key === frequency)?.label},{" "}
                  {DAYS_OF_WEEK.find((d) => d.key === dayOfWeek)?.label} at{" "}
                  {formatTime(scheduledHour)}
                </Text>
              </View>
              <View className="flex-row justify-between mt-1 pt-2 border-t border-gray-200">
                <Text className="text-sm font-semibold text-[#1A1A2E]">Est. per visit</Text>
                <Text className="text-sm font-bold text-[#FF6B00]">
                  {formatCurrency(selectedService.basePrice)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View className="px-5 py-4 pb-8 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || submitting}
            activeOpacity={0.8}
            className={`py-4 rounded-xl items-center ${
              isFormValid && !submitting ? "bg-[#FF6B00]" : "bg-gray-300"
            }`}
          >
            {submitting ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white text-lg font-bold ml-2">Creating...</Text>
              </View>
            ) : (
              <Text
                className={`text-lg font-bold ${
                  isFormValid ? "text-white" : "text-gray-500"
                }`}
              >
                Create Recurring Booking
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
