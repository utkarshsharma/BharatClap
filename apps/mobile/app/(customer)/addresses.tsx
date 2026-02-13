import "../../global.css";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService, type Address } from "@/services/addresses";

export default function AddressesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: addresses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message ?? "Failed to delete address.");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message ?? "Failed to set default address.");
    },
  });

  const handleDelete = (address: Address) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete "${address.label || address.line1}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(address.id),
        },
      ]
    );
  };

  const handleSetDefault = (address: Address) => {
    if (address.isDefault) return;
    setDefaultMutation.mutate(address.id);
  };

  const handleEdit = (address: Address) => {
    router.push({
      pathname: "/(customer)/address-form" as any,
      params: { address: JSON.stringify(address) },
    });
  };

  const handleAdd = () => {
    router.push("/(customer)/address-form" as any);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderAddressCard = ({ item }: { item: Address }) => (
    <View className="mx-5 mb-3 bg-white rounded-2xl border border-gray-100 p-4">
      {/* Top row: label + default badge */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-9 h-9 rounded-full bg-orange-50 items-center justify-center mr-3">
            <Text style={{ fontSize: 18 }}>
              {item.label?.toLowerCase() === "office"
                ? "\uD83C\uDFE2"
                : item.label?.toLowerCase() === "other"
                ? "\uD83D\uDCCD"
                : "\uD83C\uDFE0"}
            </Text>
          </View>
          <Text className="text-base font-bold text-secondary" numberOfLines={1}>
            {item.label || "Address"}
          </Text>
        </View>
        {item.isDefault && (
          <View className="bg-green-100 px-2.5 py-1 rounded-full">
            <Text className="text-xs text-green-700 font-semibold">Default</Text>
          </View>
        )}
      </View>

      {/* Address details */}
      <View className="ml-12 mb-3">
        <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
          {item.line1}
        </Text>
        <Text className="text-sm text-gray-400 mt-0.5">
          {item.city}{item.pincode ? ` - ${item.pincode}` : ""}
        </Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row items-center ml-12">
        {!item.isDefault && (
          <TouchableOpacity
            onPress={() => handleSetDefault(item)}
            disabled={setDefaultMutation.isPending}
            className="mr-4 py-1.5 px-3 rounded-lg bg-blue-50"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-semibold text-blue-600">
              {setDefaultMutation.isPending ? "Setting..." : "Set as Default"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="mr-4 py-1.5 px-3 rounded-lg bg-gray-50"
          activeOpacity={0.7}
        >
          <Text className="text-xs font-semibold text-gray-600">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          disabled={deleteMutation.isPending}
          className="py-1.5 px-3 rounded-lg bg-red-50"
          activeOpacity={0.7}
        >
          <Text className="text-xs font-semibold text-red-500">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">Loading addresses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">My Addresses</Text>
      </View>

      <FlatList
        data={addresses ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderAddressCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text style={{ fontSize: 48 }}>{"\uD83D\uDCCD"}</Text>
            <Text className="text-lg font-semibold text-secondary mt-4">
              No addresses saved
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center px-10">
              Add your home, office, or other addresses for quick booking
            </Text>
            <TouchableOpacity
              onPress={handleAdd}
              className="mt-6 px-6 py-3 rounded-xl bg-primary"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Add Address</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Add Address Button */}
      {(addresses ?? []).length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleAdd}
            className="py-4 rounded-2xl bg-primary items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">+ Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
