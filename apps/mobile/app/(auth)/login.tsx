import "../../global.css";
import { View, Text } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-secondary">Login</Text>
      <Text className="text-base text-text-light mt-4">Enter your phone number to continue</Text>
    </View>
  );
}
