import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="category/[slug]" />
      <Stack.Screen name="service/[slug]" />
      <Stack.Screen name="providers" />
      <Stack.Screen name="booking/schedule" />
      <Stack.Screen name="booking/address" />
      <Stack.Screen name="booking/summary" />
      <Stack.Screen name="booking/confirmation" />
      <Stack.Screen name="booking/[id]" />
    </Stack>
  );
}
