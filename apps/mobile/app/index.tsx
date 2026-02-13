import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role === "customer") {
    return <Redirect href="/(customer)/(tabs)" />;
  }

  if (role === "provider") {
    return <Redirect href="/(provider)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/role-select" />;
}
