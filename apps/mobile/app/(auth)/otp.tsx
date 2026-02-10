import "../../global.css";
import { View, Text } from "react-native";

export default function OtpScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-secondary">Verify OTP</Text>
      <Text className="text-base text-text-light mt-4">Enter the 6-digit code sent to your phone</Text>
    </View>
  );
}
