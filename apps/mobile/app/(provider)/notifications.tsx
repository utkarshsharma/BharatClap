import "../../global.css";
import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notificationService,
  type Notification,
} from "@/services/notifications";

function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function ProviderNotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
  });

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
      className={`mx-5 mb-3 p-4 rounded-2xl border ${
        item.isRead
          ? "bg-white border-gray-100"
          : "bg-orange-50 border-orange-100"
      }`}
    >
      <View className="flex-row items-start">
        {/* Unread indicator */}
        <View className="mt-1.5 mr-3">
          {!item.isRead ? (
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          ) : (
            <View className="w-2.5 h-2.5 rounded-full bg-transparent" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className={`text-base flex-1 mr-2 ${
                item.isRead
                  ? "font-medium text-gray-700"
                  : "font-bold text-secondary"
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-xs text-gray-400">
              {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text
            className={`text-sm ${
              item.isRead ? "text-gray-400" : "text-gray-600"
            }`}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-secondary">
            Notifications
          </Text>
        </View>

        {hasUnread && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text className="text-sm font-semibold text-primary">
              {markAllAsReadMutation.isPending ? "Marking..." : "Mark All Read"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B00"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
              <Text className="text-lg font-semibold text-gray-400">
                No notifications yet
              </Text>
              <Text className="text-sm text-gray-300 mt-2">
                We'll notify you when something happens
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
