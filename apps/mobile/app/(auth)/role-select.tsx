import "../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth";

type Role = "customer" | "provider";

interface RoleOption {
  id: Role;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
}

const roles: RoleOption[] = [
  {
    id: "customer",
    icon: "\uD83C\uDFE0",
    title: "Customer",
    subtitle: "I need services",
    description:
      "Browse services, book trusted professionals, and manage your home and lifestyle needs.",
  },
  {
    id: "provider",
    icon: "\uD83D\uDEE0\uFE0F",
    title: "Service Provider",
    subtitle: "I provide services",
    description:
      "List your services, receive bookings, manage your schedule, and grow your business.",
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole: setStoreRole } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      // Call auth service to set the role on the backend
      try {
        await authService.setRole(selectedRole);
      } catch {
        // If API is not available, continue with local-only (dev mode)
      }

      // Update the local store
      setStoreRole(selectedRole);

      // Navigate to the appropriate tab layout
      if (selectedRole === "customer") {
        router.replace("/(customer)/(tabs)");
      } else {
        router.replace("/(provider)/(tabs)/dashboard");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to set role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-secondary mb-2">
            How would you like to use BharatClap?
          </Text>
          <Text className="text-base text-gray-500 mt-1">
            Choose your role to get started. You can always switch later.
          </Text>
        </View>

        {/* Role Cards */}
        <View className="flex-1">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                onPress={() => handleSelectRole(role.id)}
                activeOpacity={0.7}
                className={`mb-4 p-5 rounded-2xl border-2 ${
                  isSelected
                    ? "border-primary bg-primary-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center mb-3">
                  {/* Icon */}
                  <View
                    className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${
                      isSelected ? "bg-primary" : "bg-gray-100"
                    }`}
                  >
                    <Text style={{ fontSize: 28 }}>{role.icon}</Text>
                  </View>

                  {/* Title and subtitle */}
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${
                        isSelected ? "text-primary" : "text-secondary"
                      }`}
                    >
                      {role.title}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {role.subtitle}
                    </Text>
                  </View>

                  {/* Selection indicator */}
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <Text className="text-white text-xs font-bold">
                        {"\u2713"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Description */}
                <Text className="text-sm text-gray-500 leading-5 ml-[72px]">
                  {role.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <View className="pb-6">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedRole || isLoading}
            className={`py-4 rounded-xl items-center ${
              selectedRole && !isLoading ? "bg-primary" : "bg-gray-300"
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white text-lg font-bold ml-2">
                  Setting up...
                </Text>
              </View>
            ) : (
              <Text
                className={`text-lg font-bold ${
                  selectedRole ? "text-white" : "text-gray-500"
                }`}
              >
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
