import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/welcome");
    } else if (role === "customer") {
      router.replace("/(customer)/(tabs)");
    } else if (role === "provider") {
      router.replace("/(provider)/(tabs)/dashboard");
    } else {
      router.replace("/(auth)/role-select");
    }
  }, [isAuthenticated, role]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#FF6B00" />
    </View>
  );
}
