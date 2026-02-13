import "../../../global.css";
import React, { useState, useRef, useEffect } from "react";
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
import { useAuthStore } from "@/store/authStore";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    orderId: string;
    amount: string;
  }>();

  const phone = useAuthStore((s) => s.user?.phone) ?? "";
  const [keyId, setKeyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await paymentService.getPaymentConfig();
      setKeyId(config.keyId);
    } catch {
      Alert.alert("Error", "Failed to load payment configuration.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "payment_success") {
        setVerifying(true);
        try {
          await paymentService.verifyPayment(params.bookingId, {
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
          });
          router.replace(
            `/(customer)/booking/confirmation?bookingId=${params.bookingId}` as any
          );
        } catch {
          Alert.alert(
            "Verification Failed",
            "Payment was received but verification failed. Please contact support.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace(
                    `/(customer)/booking/confirmation?bookingId=${params.bookingId}` as any
                  ),
              },
            ]
          );
        } finally {
          setVerifying(false);
        }
      } else if (data.type === "payment_dismissed") {
        Alert.alert("Payment Cancelled", "Would you like to retry payment?", [
          { text: "Go Back", style: "cancel", onPress: () => router.back() },
          { text: "Retry", onPress: () => webViewRef.current?.reload() },
        ]);
      }
    } catch {
      // Ignore non-JSON messages
    }
  };

  const amountInPaise = Number(params.amount) || 0;
  const amountDisplay = (amountInPaise / 100).toFixed(2);

  const checkoutHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .loading {
      text-align: center;
      color: #666;
      font-size: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #eee;
      border-top-color: #FF6B00;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Opening Razorpay checkout...</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key: '${keyId}',
      amount: ${amountInPaise},
      currency: 'INR',
      name: 'BharatClap',
      description: 'Service Booking Payment',
      order_id: '${params.orderId}',
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'payment_success',
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_dismissed',
          }));
        },
        escape: false,
      },
      prefill: {
        contact: '${phone}',
      },
      theme: {
        color: '#FF6B00',
      },
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'payment_dismissed',
        error: response.error.description,
      }));
    });
    rzp.open();
  </script>
</body>
</html>
  `;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">
          Preparing payment...
        </Text>
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
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Payment</Text>
      </View>

      {keyId ? (
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
            Unable to load payment configuration. Please try again.
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
