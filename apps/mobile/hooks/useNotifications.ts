import { useState, useEffect, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
  });

  const registerForPush = useCallback(async () => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      setExpoPushToken(token);

      // Register device token with backend
      try {
        await notificationService.registerDevice(token);
      } catch {}

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      return token;
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(
          responseListener.current
        );
      }
    };
  }, []);

  return { unreadCount, expoPushToken, registerForPush };
}
