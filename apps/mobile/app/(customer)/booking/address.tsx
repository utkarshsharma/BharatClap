import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBookingStore } from "@/store/bookingStore";

// Mock saved addresses (will be replaced with API data)
const MOCK_ADDRESSES = [
  {
    id: "addr-1",
    label: "Home",
    line1: "42, Green Valley Apartments",
    line2: "Koramangala 5th Block",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560095",
  },
  {
    id: "addr-2",
    label: "Office",
    line1: "WeWork Galaxy, #43",
    line2: "Residency Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560025",
  },
];

export default function AddressSelectionScreen() {
  const router = useRouter();
  const selectedAddress = useBookingStore((s) => s.selectedAddress);
  const setSelectedAddress = useBookingStore((s) => s.setSelectedAddress);

  const [selectedId, setSelectedId] = useState<string | null>(
    selectedAddress?.id ?? null
  );

  const handleSelect = (addr: (typeof MOCK_ADDRESSES)[0]) => {
    setSelectedId(addr.id);
  };

  const handleContinue = () => {
    const selected = MOCK_ADDRESSES.find((a) => a.id === selectedId);
    if (!selected) {
      Alert.alert("Select Address", "Please select an address to continue.");
      return;
    }
    setSelectedAddress({
      id: selected.id,
      line1: selected.line1,
      line2: selected.line2,
      city: selected.city,
      state: selected.state,
      pincode: selected.pincode,
    });
    router.push("/(customer)/booking/summary" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Select Address</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {MOCK_ADDRESSES.map((addr) => {
          const isSelected = addr.id === selectedId;
          return (
            <TouchableOpacity
              key={addr.id}
              onPress={() => handleSelect(addr)}
              className={`mb-3 rounded-2xl border p-4 ${
                isSelected ? "border-primary bg-primary-50" : "border-gray-200 bg-white"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-2">
                {/* Radio */}
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    isSelected ? "border-primary" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
                <Text className="text-base font-bold text-secondary">
                  {addr.label}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 ml-8">{addr.line1}</Text>
              {addr.line2 && (
                <Text className="text-sm text-gray-600 ml-8">{addr.line2}</Text>
              )}
              <Text className="text-sm text-gray-500 ml-8">
                {addr.city}, {addr.state} - {addr.pincode}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add New Address */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Add New Address will be available in a future update."
            )
          }
          className="mb-6 py-4 rounded-2xl border border-dashed border-gray-300 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-base font-semibold text-primary">
            + Add New Address
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue Button */}
      <View className="px-5 py-4 pb-8 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedId}
          className={`py-4 rounded-xl items-center ${
            selectedId ? "bg-primary" : "bg-gray-300"
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
