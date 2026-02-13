import "../../../global.css";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";

// ---------- Types ----------
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "provider";
  text: string;
  timestamp: string;
}

// ---------- Mock data ----------
const generateMockMessages = (customerId: string): ChatMessage[] => [
  {
    id: "msg-1",
    senderId: "prov-1",
    senderName: "Ramesh K.",
    senderRole: "provider",
    text: "Hello! I have accepted your booking. I will be at your location by the scheduled time.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "msg-2",
    senderId: customerId,
    senderName: "You",
    senderRole: "customer",
    text: "Great, thank you! Please ring the doorbell when you arrive.",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: "msg-3",
    senderId: "prov-1",
    senderName: "Ramesh K.",
    senderRole: "provider",
    text: "Sure, will do. Do you have all the necessary items or should I bring anything specific?",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "msg-4",
    senderId: customerId,
    senderName: "You",
    senderRole: "customer",
    text: "No, I have everything. Just bring your tools.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "msg-5",
    senderId: "prov-1",
    senderName: "Ramesh K.",
    senderRole: "provider",
    text: "Perfect. I am on my way now. ETA 15 minutes.",
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
];

// ---------- Helper ----------
const formatChatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;

  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
};

// ---------- Screen ----------
export default function CustomerChatScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? "customer-1";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      // TODO: Replace with actual API call:
      // const res = await api.get(`/bookings/${bookingId}/messages`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessages(generateMockMessages(currentUserId));
      setLoading(false);
    };
    loadMessages();
  }, [bookingId, currentUserId]);

  // Simple polling for new messages (mock)
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: Replace with WebSocket or real polling:
      // const newMessages = await api.get(`/bookings/${bookingId}/messages?after=${lastMsgId}`);
    }, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: user?.name ?? "You",
      senderRole: "customer",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // TODO: Send to API:
    // api.post(`/bookings/${bookingId}/messages`, { text: trimmed });
  }, [inputText, currentUserId, user?.name]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isSent = item.senderId === currentUserId;

    return (
      <View className={`px-4 mb-3 ${isSent ? "items-end" : "items-start"}`}>
        {/* Sender name for received messages */}
        {!isSent && (
          <Text className="text-xs text-[#757575] mb-1 ml-1">{item.senderName}</Text>
        )}

        <View
          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
            isSent
              ? "bg-[#FF6B00] rounded-br-sm"
              : "bg-gray-100 rounded-bl-sm"
          }`}
        >
          <Text
            className={`text-sm leading-5 ${
              isSent ? "text-white" : "text-[#1A1A2E]"
            }`}
          >
            {item.text}
          </Text>
        </View>

        {/* Timestamp */}
        <Text className={`text-[10px] text-[#9E9E9E] mt-1 ${isSent ? "mr-1" : "ml-1"}`}>
          {formatChatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-[#1A1A2E]">{"\u2190"}</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-[#1A1A2E]">Chat with Provider</Text>
          {bookingId && (
            <Text className="text-xs text-[#757575]">
              Booking #{bookingId.slice(0, 8)}...
            </Text>
          )}
        </View>
        <View className="w-2 h-2 rounded-full bg-[#4CAF50] mr-2" />
        <Text className="text-xs text-[#4CAF50] font-medium">Online</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="text-sm text-gray-500 mt-3">Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text style={{ fontSize: 48 }}>{"💬"}</Text>
                <Text className="text-base font-semibold text-[#1A1A2E] mt-4">
                  No messages yet
                </Text>
                <Text className="text-sm text-[#757575] mt-1 text-center px-8">
                  Send a message to your provider about the booking.
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
          <View className="flex-1 flex-row items-end bg-gray-100 rounded-2xl px-4 py-2 mr-3 min-h-[44px]">
            <TextInput
              className="flex-1 text-sm text-[#1A1A2E] max-h-24"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="center"
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              inputText.trim() ? "bg-[#FF6B00]" : "bg-gray-300"
            }`}
          >
            <Text className="text-white text-lg" style={{ marginTop: -1 }}>
              {"➤"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
