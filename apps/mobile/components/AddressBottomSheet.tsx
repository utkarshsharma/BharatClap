import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import type { Address } from "@/services/addresses";

interface Props {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedId: string | null;
  /** When mode="booking", filters non-serviceable addresses. When mode="global", shows all. Default: "booking" */
  mode?: "booking" | "global";
  providerCity?: string;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
}

function isServiceable(addressCity: string, providerCity: string): boolean {
  if (!addressCity || !providerCity) return true;
  const a = addressCity.toLowerCase().trim();
  const p = providerCity.toLowerCase().trim();
  return a === p || a.includes(p) || p.includes(a);
}

export default function AddressBottomSheet({
  visible,
  onClose,
  addresses,
  selectedId,
  mode = "booking",
  providerCity,
  onSelect,
  onAddNew,
}: Props) {
  const isGlobal = mode === "global";

  // Sort: serviceable first (only relevant in booking mode), then default first
  const sorted = [...addresses].sort((a, b) => {
    if (!isGlobal && providerCity) {
      const aOk = isServiceable(a.city, providerCity);
      const bOk = isServiceable(b.city, providerCity);
      if (aOk && !bOk) return -1;
      if (!aOk && bOk) return 1;
    }
    // Default addresses first within each group
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const renderAddress = ({ item }: { item: Address }) => {
    const serviceable = isGlobal || !providerCity || isServiceable(item.city, providerCity);
    const isSelected = item.id === selectedId;

    return (
      <TouchableOpacity
        onPress={() => serviceable && onSelect(item)}
        disabled={!serviceable}
        className={`mx-4 mb-3 p-4 rounded-2xl border ${
          isSelected
            ? "border-primary bg-orange-50"
            : serviceable
            ? "border-gray-200 bg-white"
            : "border-gray-100 bg-gray-50"
        }`}
        activeOpacity={serviceable ? 0.7 : 1}
      >
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            {/* Radio indicator */}
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                isSelected ? "border-primary" : "border-gray-300"
              }`}
            >
              {isSelected && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </View>

            <Text
              className={`text-base font-bold ${
                serviceable ? "text-secondary" : "text-gray-400"
              }`}
            >
              {item.label || "Address"}
            </Text>

            {item.isDefault && (
              <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-blue-600 font-semibold">
                  Default
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text
          className={`text-sm ml-8 ${
            serviceable ? "text-gray-600" : "text-gray-400"
          }`}
          numberOfLines={2}
        >
          {item.line1}
          {item.line2 ? `, ${item.line2}` : ""}
        </Text>
        <Text
          className={`text-xs ml-8 mt-0.5 ${
            serviceable ? "text-gray-400" : "text-gray-300"
          }`}
        >
          {item.city}, {item.pincode}
        </Text>

        {!serviceable && (
          <View className="ml-8 mt-2 flex-row items-center">
            <Text className="text-xs text-red-400">
              Not in service area
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      />
      <View className="bg-white rounded-t-3xl pb-8" style={{ maxHeight: "70%" }}>
        {/* Handle bar */}
        <View className="items-center pt-3 pb-2">
          <View className="w-10 h-1 rounded-full bg-gray-300" />
        </View>

        {/* Title */}
        <View className="flex-row items-center justify-between px-5 pb-3">
          <Text className="text-lg font-bold text-secondary">
            Select Address
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base text-gray-400">Cancel</Text>
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-gray-400 text-sm mb-4">
              No saved addresses
            </Text>
            <TouchableOpacity
              onPress={onAddNew}
              className="px-6 py-3 rounded-xl bg-primary"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={sorted}
              keyExtractor={(item) => item.id}
              renderItem={renderAddress}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
            />

            {/* Add new address button */}
            <TouchableOpacity
              onPress={onAddNew}
              className="mx-4 py-3 rounded-xl border border-dashed border-gray-300 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-semibold text-primary">
                + Add New Address
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}
