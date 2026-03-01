import "../../../global.css";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { paymentService } from "@/services/payments";
import { bookingService } from "@/services/bookings";

const POLL_INTERVAL_MS = 3000;

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    amount: string;
  }>();

  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resolved, setResolved] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initPayment();
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback(() => {
    if (pollRef.current || resolved) return;

    pollRef.current = setInterval(async () => {
      try {
        const result = await paymentService.checkPaymentStatus(params.bookingId);
        if (result.captured) {
          stopPolling();
          setResolved(true);
          router.replace(
            `/(customer)/booking/confirmation?bookingId=${params.bookingId}` as any
          );
        } else if (result.status === "FAILED") {
          stopPolling();
          setResolved(true);
          Alert.alert("Payment Failed", "Your payment was not successful.", [
            { text: "Go Back", onPress: () => router.back() },
          ]);
        }
      } catch {
        // Polling error — ignore and retry next interval
      }
    }, POLL_INTERVAL_MS);
  }, [params.bookingId, resolved]);

  const initPayment = async () => {
    // In dev/test mode, use dev-confirm to skip PayU entirely
    try {
      const config = await paymentService.getPaymentConfig();
      if (config.gateway === "payu_test_auto") {
        // Dev mode: instant confirmation without PayU
        await bookingService.devConfirmBooking(params.bookingId);
        setResolved(true);
        setLoading(false);
        router.replace(
          `/(customer)/booking/confirmation?bookingId=${params.bookingId}` as any
        );
        return;
      }
    } catch {
      // Config fetch failed — continue with normal flow
    }

    // Production: show PayU WebView checkout
    try {
      const result = await paymentService.createPaymentOrder(params.bookingId);
      setCheckoutHtml(result.html);
      startPolling();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ?? error?.message ?? "Failed to initiate payment.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join("\n") : msg);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    if (resolved) return;
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "payu_response") {
        const data = message.data;
        stopPolling();

        if (data.status === "success") {
          setVerifying(true);
          try {
            await paymentService.verifyPayment(params.bookingId, {
              mihpayid: data.mihpayid,
              txnid: data.txnid,
              status: data.status,
              hash: data.hash,
              amount: data.amount,
              productinfo: data.productinfo,
              firstname: data.firstname,
              email: data.email,
              error_Message: data.error_Message,
              udf1: data.udf1,
            });
            setResolved(true);
            router.replace(
              `/(customer)/booking/confirmation?bookingId=${params.bookingId}` as any
            );
          } catch {
            Alert.alert("Verification Failed", "Please contact support.", [
              {
                text: "OK",
                onPress: () => {
                  setResolved(true);
                  router.replace(
                    `/(customer)/booking/confirmation?bookingId=${params.bookingId}` as any
                  );
                },
              },
            ]);
          } finally {
            setVerifying(false);
          }
        } else {
          setResolved(true);
          Alert.alert(
            "Payment Failed",
            data.error_Message || "Payment was not successful.",
            [
              { text: "Go Back", style: "cancel", onPress: () => router.back() },
              {
                text: "Retry",
                onPress: () => {
                  setResolved(false);
                  initPayment();
                },
              },
            ]
          );
        }
      }
    } catch {
      // Ignore non-JSON messages
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">Preparing payment...</Text>
      </SafeAreaView>
    );
  }

  if (verifying) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-base font-semibold text-secondary mt-4">
          Verifying payment...
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Please do not close this screen
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => { stopPolling(); router.back(); }} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Payment</Text>
      </View>

      {checkoutHtml ? (
        <WebView
          ref={webViewRef}
          source={{ html: checkoutHtml }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#FF6B00" />
            </View>
          )}
          style={{ flex: 1 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-lg font-semibold text-secondary mb-2">
            Payment Unavailable
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Unable to load payment gateway. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-xl bg-primary"
          >
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
