import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type TabType = "bank" | "upi";

export default function ProviderBankScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("bank");

  // Bank Account form state
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  // UPI form state
  const [upiId, setUpiId] = useState("");

  const validateBank = (): boolean => {
    if (!accountNumber.trim()) {
      Alert.alert("Error", "Please enter account number.");
      return false;
    }
    if (accountNumber.length < 9 || accountNumber.length > 18) {
      Alert.alert("Error", "Account number must be between 9 and 18 digits.");
      return false;
    }
    if (accountNumber !== confirmAccountNumber) {
      Alert.alert("Error", "Account numbers do not match.");
      return false;
    }
    if (!ifscCode.trim()) {
      Alert.alert("Error", "Please enter IFSC code.");
      return false;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      Alert.alert("Error", "Please enter a valid IFSC code (e.g., SBIN0001234).");
      return false;
    }
    if (!accountHolderName.trim()) {
      Alert.alert("Error", "Please enter account holder name.");
      return false;
    }
    return true;
  };

  const validateUpi = (): boolean => {
    if (!upiId.trim()) {
      Alert.alert("Error", "Please enter UPI ID.");
      return false;
    }
    if (!/^[\w.-]+@[\w]+$/.test(upiId)) {
      Alert.alert("Error", "Please enter a valid UPI ID (e.g., name@upi).");
      return false;
    }
    return true;
  };

  const handleSaveBank = () => {
    if (validateBank()) {
      Alert.alert("Success", "Bank account details saved!");
    }
  };

  const handleSaveUpi = () => {
    if (validateUpi()) {
      Alert.alert("Success", "UPI details saved!");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center px-5 pt-4 pb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-[#1A1A2E]">Payment Details</Text>
          </View>

          <Text className="px-5 text-sm text-[#757575] mt-2 mb-4">
            Add your payment details to receive earnings from completed services.
          </Text>

          {/* Tabs */}
          <View className="flex-row mx-5 mb-6 bg-gray-100 rounded-xl p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("bank")}
              className={`flex-1 py-3 rounded-lg items-center ${
                activeTab === "bank" ? "bg-white" : ""
              }`}
              style={
                activeTab === "bank"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "bank" ? "text-[#FF6B00]" : "text-[#757575]"
                }`}
              >
                Bank Account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("upi")}
              className={`flex-1 py-3 rounded-lg items-center ${
                activeTab === "upi" ? "bg-white" : ""
              }`}
              style={
                activeTab === "upi"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "upi" ? "text-[#FF6B00]" : "text-[#757575]"
                }`}
              >
                UPI
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bank Account Form */}
          {activeTab === "bank" && (
            <View className="px-5">
              <View className="mb-4">
                <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                  Account Number
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E]"
                  placeholder="Enter account number"
                  placeholderTextColor="#9E9E9E"
                  value={accountNumber}
                  onChangeText={(text) =>
                    setAccountNumber(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={18}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                  Confirm Account Number
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E]"
                  placeholder="Re-enter account number"
                  placeholderTextColor="#9E9E9E"
                  value={confirmAccountNumber}
                  onChangeText={(text) =>
                    setConfirmAccountNumber(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={18}
                />
                {confirmAccountNumber.length > 0 &&
                  accountNumber !== confirmAccountNumber && (
                    <Text className="text-xs text-[#F44336] mt-1">
                      Account numbers do not match
                    </Text>
                  )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                  IFSC Code
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E]"
                  placeholder="e.g., SBIN0001234"
                  placeholderTextColor="#9E9E9E"
                  value={ifscCode}
                  onChangeText={(text) =>
                    setIfscCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                  Account Holder Name
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E]"
                  placeholder="Full name as per bank records"
                  placeholderTextColor="#9E9E9E"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  autoCapitalize="words"
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveBank}
                className="bg-[#FF6B00] rounded-xl py-4 items-center mb-8"
              >
                <Text className="text-base font-bold text-white">
                  Save Bank Details
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* UPI Form */}
          {activeTab === "upi" && (
            <View className="px-5">
              <View className="mb-6">
                <Text className="text-sm font-semibold text-[#1A1A2E] mb-2">
                  UPI ID
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-[#1A1A2E]"
                  placeholder="e.g., yourname@upi"
                  placeholderTextColor="#9E9E9E"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text className="text-xs text-[#757575] mt-2">
                  Enter your UPI ID linked to your bank account. Payments will be
                  transferred to this UPI ID.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSaveUpi}
                className="bg-[#FF6B00] rounded-xl py-4 items-center mb-8"
              >
                <Text className="text-base font-bold text-white">Save UPI Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
