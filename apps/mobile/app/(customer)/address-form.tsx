import "../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService, CreateAddressData } from "@/services/addresses";

const LABEL_OPTIONS = ["Home", "Office", "Other"] as const;

const KNOWN_CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
];

interface AddressParam {
  id?: string;
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

export default function AddressFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ address?: string }>();
  const queryClient = useQueryClient();

  // Parse existing address from route params (edit mode)
  const existingAddress: AddressParam | null = (() => {
    try {
      if (params.address) {
        return JSON.parse(params.address);
      }
    } catch {
      // ignore parse errors
    }
    return null;
  })();

  const isEditing = !!existingAddress?.id;

  // Form state
  const [label, setLabel] = useState<string>(existingAddress?.label || "Home");
  const [addressLine, setAddressLine] = useState(existingAddress?.line1 || "");
  const [landmark, setLandmark] = useState(existingAddress?.line2 || "");
  const [city, setCity] = useState(existingAddress?.city || "");
  const [pincode, setPincode] = useState(existingAddress?.pincode || "");
  const [latitude, setLatitude] = useState<number | null>(
    existingAddress?.lat ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    existingAddress?.lng ?? null
  );
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAddressData) => addressService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      Alert.alert("Success", "Address added successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to add address. Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateAddressData>) =>
      addressService.update(existingAddress!.id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      Alert.alert("Success", "Address updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to update address. Please try again.");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Use current location
  const handleUseCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to auto-fill coordinates. Please enable it in your device settings."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(parseFloat(location.coords.latitude.toFixed(6)));
      setLongitude(parseFloat(location.coords.longitude.toFixed(6)));
    } catch {
      Alert.alert(
        "Location Error",
        "Could not fetch your current location. Please try again or enter coordinates manually."
      );
    } finally {
      setFetchingLocation(false);
    }
  };

  // Validation
  const validate = (): boolean => {
    if (!addressLine.trim()) {
      Alert.alert("Validation", "Address line is required.");
      return false;
    }
    if (!city) {
      Alert.alert("Validation", "Please select a city.");
      return false;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      Alert.alert("Validation", "Please enter a valid 6-digit pincode.");
      return false;
    }
    return true;
  };

  // Save handler
  const handleSave = () => {
    if (!validate()) return;

    const data: CreateAddressData = {
      label,
      line1: addressLine.trim(),
      line2: landmark.trim() || undefined,
      city,
      pincode: pincode.trim(),
      lat: latitude ?? undefined,
      lng: longitude ?? undefined,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 mr-2"
          disabled={isSaving}
        >
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">
          {isEditing ? "Edit Address" : "Add Address"}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Label Picker */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-secondary mb-2">
              Label
            </Text>
            <TouchableOpacity
              onPress={() => setShowLabelPicker(!showLabelPicker)}
              className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Text className="text-base text-secondary">{label}</Text>
              <Text className="text-gray-400">
                {showLabelPicker ? "\u25B2" : "\u25BC"}
              </Text>
            </TouchableOpacity>
            {showLabelPicker && (
              <View className="border border-gray-200 rounded-xl mt-1 overflow-hidden">
                {LABEL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      setLabel(option);
                      setShowLabelPicker(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-100 ${
                      label === option ? "bg-primary/10" : "bg-white"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base ${
                        label === option
                          ? "text-primary font-semibold"
                          : "text-secondary"
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Address Line (multi-line) */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-secondary mb-2">
              Address <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={addressLine}
              onChangeText={setAddressLine}
              placeholder="House/Flat no., Street, Area"
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base text-secondary min-h-[80px]"
            />
          </View>

          {/* Landmark (optional) */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-secondary mb-2">
              Landmark{" "}
              <Text className="text-gray-400 font-normal">(Optional)</Text>
            </Text>
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Near temple, opposite park, etc."
              placeholderTextColor="#9E9E9E"
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-secondary"
            />
          </View>

          {/* City Picker */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-secondary mb-2">
              City <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCityPicker(!showCityPicker)}
              className={`flex-row items-center justify-between border rounded-xl px-4 py-3.5 ${
                city ? "border-gray-200" : "border-gray-200"
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-base ${
                  city ? "text-secondary" : "text-gray-400"
                }`}
              >
                {city || "Select city"}
              </Text>
              <Text className="text-gray-400">
                {showCityPicker ? "\u25B2" : "\u25BC"}
              </Text>
            </TouchableOpacity>
            {showCityPicker && (
              <View className="border border-gray-200 rounded-xl mt-1 overflow-hidden max-h-[250px]">
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  {KNOWN_CITIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        setCity(c);
                        setShowCityPicker(false);
                      }}
                      className={`px-4 py-3 border-b border-gray-100 ${
                        city === c ? "bg-primary/10" : "bg-white"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-base ${
                          city === c
                            ? "text-primary font-semibold"
                            : "text-secondary"
                        }`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Pincode */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-secondary mb-2">
              Pincode <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={pincode}
              onChangeText={(text) => {
                // Allow only digits, max 6
                const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
                setPincode(cleaned);
              }}
              placeholder="6-digit pincode"
              placeholderTextColor="#9E9E9E"
              keyboardType="number-pad"
              maxLength={6}
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-secondary"
            />
          </View>

          {/* Use Current Location Button */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={fetchingLocation}
            className={`flex-row items-center justify-center py-3.5 rounded-xl mb-5 border ${
              fetchingLocation
                ? "border-gray-200 bg-gray-50"
                : "border-primary bg-primary/5"
            }`}
            activeOpacity={0.7}
          >
            {fetchingLocation ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <Text style={{ fontSize: 16 }} className="mr-2">
                {"\uD83D\uDCCD"}
              </Text>
            )}
            <Text
              className={`text-base font-semibold ml-1 ${
                fetchingLocation ? "text-gray-400" : "text-primary"
              }`}
            >
              {fetchingLocation
                ? "Fetching location..."
                : "Use Current Location"}
            </Text>
          </TouchableOpacity>

          {/* Latitude & Longitude (read-only) */}
          <View className="flex-row mb-5">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-semibold text-secondary mb-2">
                Latitude
              </Text>
              <View className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50">
                <Text
                  className={`text-base ${
                    latitude !== null ? "text-secondary" : "text-gray-400"
                  }`}
                >
                  {latitude !== null ? String(latitude) : "Auto-filled"}
                </Text>
              </View>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-sm font-semibold text-secondary mb-2">
                Longitude
              </Text>
              <View className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50">
                <Text
                  className={`text-base ${
                    longitude !== null ? "text-secondary" : "text-gray-400"
                  }`}
                >
                  {longitude !== null ? String(longitude) : "Auto-filled"}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom spacer */}
          <View className="h-8" />
        </ScrollView>

        {/* Save Button */}
        <View className="px-5 py-4 pb-8 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`py-4 rounded-xl items-center ${
              isSaving ? "bg-gray-300" : "bg-primary"
            }`}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {isEditing ? "Update Address" : "Save Address"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
