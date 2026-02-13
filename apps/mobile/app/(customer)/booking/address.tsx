import "../../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBookingStore } from "@/store/bookingStore";
import { addressService, Address } from "@/services/addresses";

export default function AddressSelectionScreen() {
  const router = useRouter();
  const selectedAddress = useBookingStore((s) => s.selectedAddress);
  const setSelectedAddress = useBookingStore((s) => s.setSelectedAddress);
  const selectedProvider = useBookingStore((s) => s.selectedProvider);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedAddress?.id ?? null
  );

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAll();
      setAddresses(data);
      // Auto-select default address if none selected
      if (!selectedId && data.length > 0) {
        const defaultAddr = data.find((a) => a.isDefault) ?? data[0];
        setSelectedId(defaultAddr.id);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load addresses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isCityMismatch = (addr: Address): boolean => {
    if (!selectedProvider?.city || !addr.city) return false;
    const provCity = selectedProvider.city.toLowerCase().trim();
    const addrCity = addr.city.toLowerCase().trim();
    return (
      addrCity !== provCity &&
      !addrCity.includes(provCity) &&
      !provCity.includes(addrCity)
    );
  };

  const handleSelect = (addr: Address) => {
    setSelectedId(addr.id);
  };

  const handleContinue = () => {
    const selected = addresses.find((a) => a.id === selectedId);
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
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Select Address</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-sm text-gray-500 mt-3">Loading addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-lg font-semibold text-secondary mb-2">
            No Saved Addresses
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Add an address to continue with your booking.
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Add New Address will be available in a future update."
              )
            }
            className="px-6 py-3 rounded-xl bg-primary"
          >
            <Text className="text-white font-bold">+ Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
            {addresses.map((addr) => {
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
                      {addr.label || "Address"}
                    </Text>
                    {addr.isDefault && (
                      <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded">
                        <Text className="text-xs text-primary font-semibold">Default</Text>
                      </View>
                    )}
                  </View>
                  {isCityMismatch(addr) && (
                    <View className="ml-8 mb-1 bg-red-50 px-3 py-1.5 rounded-lg">
                      <Text className="text-xs text-red-600 font-medium">
                        Provider is in {selectedProvider?.city} — this address may not be serviceable
                      </Text>
                    </View>
                  )}
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
        </>
      )}
    </SafeAreaView>
  );
}
