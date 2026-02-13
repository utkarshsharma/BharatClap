import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const city = useAuthStore((s) => s.city);

  const isLoggedIn = isAuthenticated && !!user && !!accessToken;
  const isCustomer = role === "customer";
  const isProvider = role === "provider";

  return {
    user,
    role,
    city,
    isLoggedIn,
    isCustomer,
    isProvider,
    isAuthenticated,
    isHydrated,
  };
}

export function useRequireAuth() {
  const router = useRouter();
  const { isLoggedIn, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isLoggedIn) {
      router.replace("/(auth)/login" as any);
    }
  }, [isHydrated, isLoggedIn, router]);

  return { isLoggedIn, isHydrated };
}
