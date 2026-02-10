import "../../../global.css";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProviderProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-secondary">Provider Profile</Text>
        <Text className="text-base text-text-light mt-4">Manage your profile and services</Text>
      </View>
    </SafeAreaView>
  );
}
