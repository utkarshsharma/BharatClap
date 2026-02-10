import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="onboarding/services" />
      <Stack.Screen name="onboarding/availability" />
      <Stack.Screen name="onboarding/bank" />
      <Stack.Screen name="earnings" />
    </Stack>
  );
}
