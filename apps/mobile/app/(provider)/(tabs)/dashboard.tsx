import "../../../global.css";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProviderDashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-3xl font-bold text-secondary mb-2">Provider Dashboard</Text>
          <Text className="text-base text-text-light">Manage your services and bookings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
