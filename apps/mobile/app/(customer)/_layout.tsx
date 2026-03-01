import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="category/[slug]" />
      <Stack.Screen name="service/[slug]" />
      <Stack.Screen name="providers" />
      <Stack.Screen name="provider/[id]" />
      <Stack.Screen name="booking/index" />
      <Stack.Screen name="booking/payment" />
      <Stack.Screen name="booking/confirmation" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="booking/select-provider" />
      <Stack.Screen name="review/[bookingId]" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="help" />
      <Stack.Screen name="address-form" />
    </Stack>
  );
}
