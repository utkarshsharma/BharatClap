import "../../../global.css";
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useBookingStore } from "@/store/bookingStore";
import { useAuthStore } from "@/store/authStore";
import { addressService, type Address } from "@/services/addresses";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { TIME_SLOTS } from "@/constants/timeSlots";
import { CONFIG } from "@/constants/config";
import { formatCurrency, formatRating } from "@/utils/format";
import AddressBottomSheet from "@/components/AddressBottomSheet";

/* ---------- Helpers ---------- */

function generateDates(count: number) {
  const dates: {
    key: string;
    dateStr: string;
    dayLabel: string;
    dayNum: number;
    monthLabel: string;
    isToday: boolean;
  }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
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

function isServiceable(addressCity: string, providerCity: string): boolean {
  if (!addressCity || !providerCity) return true;
  const a = addressCity.toLowerCase().trim();
  const p = providerCity.toLowerCase().trim();
  return a === p || a.includes(p) || p.includes(a);
}

/* ---------- Screen ---------- */

export default function BookingScreen() {
  const router = useRouter();

  // Booking store
  const selectedService = useBookingStore((s) => s.selectedService);
  const selectedProvider = useBookingStore((s) => s.selectedProvider);
  const setSelectedDate = useBookingStore((s) => s.setSelectedDate);
  const setSelectedHour = useBookingStore((s) => s.setSelectedHour);
  const setSelectedAddress = useBookingStore((s) => s.setSelectedAddress);
  const setCustomerNotes = useBookingStore((s) => s.setCustomerNotes);
  const setEmergencyContact = useBookingStore((s) => s.setEmergencyContact);

  // Auth store — pre-selected address
  const storedAddress = useAuthStore((s) => s.selectedAddress);

  // Local state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);

  const [localDate, setLocalDate] = useState<string>("");
  const [localHour, setLocalHour] = useState<number | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState("");
  const [emergencyExpanded, setEmergencyExpanded] = useState(false);
  const [localEmergency, setLocalEmergency] = useState("");

  const dates = useMemo(
    () => generateDates(CONFIG.MAX_BOOKING_ADVANCE_DAYS),
    []
  );

  const totalAmount =
    selectedProvider?.customPrice ?? selectedService?.basePrice ?? 0;

  const hasNoAddresses = !addressLoading && addresses.length === 0;
  const canPay =
    selectedAddr !== null && localDate !== "" && localHour !== null;

  // Pre-select tomorrow
  useEffect(() => {
    if (dates.length > 1) {
      setLocalDate(dates[1].dateStr);
    }
  }, []);

  // Load addresses and auto-select from authStore or default
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);
      const list = await addressService.getAll();
      setAddresses(list);

      const provCity = selectedProvider?.city ?? "";

      // Try to pre-select from authStore's selectedAddress
      if (storedAddress) {
        const match = list.find((a) => a.id === storedAddress.id);
        if (match && isServiceable(match.city, provCity)) {
          setSelectedAddr(match);
          return;
        }
      }

      // Fallback: default address first, then first serviceable
      const defaultAddr = list.find((a) => a.isDefault);
      const firstServiceable = list.find(
        (a) => isServiceable(a.city, provCity)
      );

      if (
        defaultAddr &&
        isServiceable(defaultAddr.city, provCity)
      ) {
        setSelectedAddr(defaultAddr);
      } else if (firstServiceable) {
        setSelectedAddr(firstServiceable);
      }
    } catch {
      // Non-critical — user can pick manually
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddr(addr);
    setShowAddressSheet(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressSheet(false);
    router.push("/(customer)/address-form" as any);
  };

  // Booking + payment creation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const booking = await bookingService.createBooking({
        serviceId: selectedService!.id,
        providerId: selectedProvider!.id,
        addressId: selectedAddr!.id,
        scheduledDate: localDate,
        scheduledHour: localHour!,
        customerNotes: localNotes || undefined,
        emergencyContactPhone: localEmergency || undefined,
      });
      const order = await paymentService.createPaymentOrder(booking.id);
      return { booking, order };
    },
    onSuccess: ({ booking, order }) => {
      // Commit to store
      setSelectedDate(localDate);
      setSelectedHour(localHour!);
      setSelectedAddress({
        id: selectedAddr!.id,
        line1: selectedAddr!.line1,
        line2: selectedAddr!.line2,
        city: selectedAddr!.city,
        state: selectedAddr!.state,
        pincode: selectedAddr!.pincode,
        lat: selectedAddr!.lat,
        lng: selectedAddr!.lng,
      });
      setCustomerNotes(localNotes);
      setEmergencyContact(localEmergency);

      router.push(
        `/(customer)/booking/payment?bookingId=${booking.id}&orderId=${order.orderId}&amount=${order.amount}` as any
      );
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Something went wrong. Please try again.";
      Alert.alert(
        "Booking Failed",
        Array.isArray(msg) ? msg.join("\n") : msg
      );
    },
  });

  const handlePay = () => {
    if (!canPay) return;
    if (!selectedService || !selectedProvider) {
      Alert.alert("Missing Info", "Service or provider not selected.");
      return;
    }
    createBookingMutation.mutate();
  };

  /* ---------- Render ---------- */
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Book Service</Text>
      </View>

      {/* Address bar (sticky-ish, right below header) */}
      <TouchableOpacity
        onPress={() => setShowAddressSheet(true)}
        className="flex-row items-center px-5 py-3 bg-orange-50 border-b border-orange-100"
        activeOpacity={0.7}
      >
        <Text className="text-base mr-2">{"\uD83D\uDCCD"}</Text>
        {addressLoading ? (
          <Text className="text-sm text-gray-400 flex-1">
            Loading addresses...
          </Text>
        ) : selectedAddr ? (
          <Text
            className="text-sm font-semibold text-secondary flex-1"
            numberOfLines={1}
          >
            {selectedAddr.label || "Address"} — {selectedAddr.city},{" "}
            {selectedAddr.pincode}
          </Text>
        ) : (
          <Text className="text-sm text-gray-400 flex-1">
            Select an address
          </Text>
        )}
        <Text className="text-xs text-primary font-semibold">Change</Text>
      </TouchableOpacity>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* No addresses prompt */}
        {hasNoAddresses && (
          <View className="mx-5 mt-4 p-5 bg-red-50 rounded-2xl items-center">
            <Text className="text-base font-bold text-secondary mb-2">
              Add an address to continue
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-4">
              You need a delivery address before you can book this service.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(customer)/address-form" as any)}
              className="px-6 py-3 rounded-xl bg-primary"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Add Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Service + Provider card */}
        <View className="mx-5 mt-4 p-4 bg-gray-50 rounded-2xl flex-row items-center">
          {/* Avatar */}
          <View className="w-11 h-11 rounded-full bg-primary items-center justify-center mr-3">
            <Text className="text-lg font-bold text-white">
              {(selectedProvider?.name ?? "P").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-secondary"
              numberOfLines={1}
            >
              {selectedService?.name ?? "Service"}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="text-sm text-gray-500" numberOfLines={1}>
                {selectedProvider?.name ?? "Provider"}
              </Text>
              {selectedProvider?.rating != null &&
                selectedProvider.rating > 0 && (
                  <Text className="text-sm text-gray-400 ml-2">
                    {"\u2605"} {formatRating(selectedProvider.rating)}
                  </Text>
                )}
            </View>
          </View>
          <Text className="text-lg font-bold text-primary">
            {formatCurrency(totalAmount)}
          </Text>
        </View>

        {/* Date Picker */}
        <View className="pt-5 pb-2">
          <Text className="text-base font-bold text-secondary px-5 mb-3">
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
        <View className="px-5 pt-4 pb-3">
          <Text className="text-base font-bold text-secondary mb-3">
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

        {/* Collapsible Notes */}
        <View className="px-5 pt-2">
          <TouchableOpacity
            onPress={() => setNotesExpanded(!notesExpanded)}
            className="flex-row items-center py-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold text-primary">
              {notesExpanded ? "- " : "+ "}Add notes for provider
            </Text>
          </TouchableOpacity>
          {notesExpanded && (
            <TextInput
              value={localNotes}
              onChangeText={setLocalNotes}
              placeholder="Any special instructions or requests..."
              placeholderTextColor="#9E9E9E"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-secondary mt-1"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 70 }}
            />
          )}
        </View>

        {/* Collapsible Emergency Contact */}
        <View className="px-5 pt-1 pb-4">
          <TouchableOpacity
            onPress={() => setEmergencyExpanded(!emergencyExpanded)}
            className="flex-row items-center py-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold text-primary">
              {emergencyExpanded ? "- " : "+ "}Add emergency contact
            </Text>
          </TouchableOpacity>
          {emergencyExpanded && (
            <TextInput
              value={localEmergency}
              onChangeText={setLocalEmergency}
              placeholder="10-digit phone number"
              placeholderTextColor="#9E9E9E"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-secondary mt-1"
              keyboardType="phone-pad"
              maxLength={10}
            />
          )}
        </View>

        {/* Price Breakdown */}
        <View className="mx-5 mb-6 p-4 bg-gray-50 rounded-2xl">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Service Charge</Text>
            <Text className="text-sm font-bold text-secondary">
              {formatCurrency(totalAmount)}
            </Text>
          </View>
          <View className="border-t border-gray-200 my-3" />
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-secondary">Total</Text>
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {/* Spacer for sticky button */}
        <View className="h-24" />
      </ScrollView>

      {/* Sticky Pay Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <TouchableOpacity
          onPress={handlePay}
          disabled={!canPay || createBookingMutation.isPending}
          className={`py-4 rounded-xl items-center ${
            canPay && !createBookingMutation.isPending
              ? "bg-primary"
              : "bg-gray-300"
          }`}
          activeOpacity={0.8}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Pay {formatCurrency(totalAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Bottom Sheet — booking mode, filters by provider city */}
      <AddressBottomSheet
        visible={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        addresses={addresses}
        selectedId={selectedAddr?.id ?? null}
        mode="booking"
        providerCity={selectedProvider?.city}
        onSelect={handleSelectAddress}
        onAddNew={handleAddNewAddress}
      />
    </SafeAreaView>
  );
}
