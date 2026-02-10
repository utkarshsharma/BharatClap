import "../../global.css";
import { View, Text } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-primary">Welcome to BharatClap</Text>
      <Text className="text-base text-text-light mt-4">Your trusted service marketplace</Text>
    </View>
  );
}
