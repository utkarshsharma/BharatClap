import "../../global.css";
import { View, Text } from "react-native";

export default function RoleSelectScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-secondary">Select Your Role</Text>
      <Text className="text-base text-text-light mt-4">Are you a customer or service provider?</Text>
    </View>
  );
}
