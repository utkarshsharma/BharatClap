import "../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How do I book a service?",
    answer:
      "To book a service, browse categories on the home screen, select the service you need, choose a provider, pick a date and time slot, select your address, and confirm the booking. You can also search for specific services using the search bar.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "BharatClap supports multiple payment methods including UPI (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, and Razorpay wallet. All payments are processed securely through Razorpay payment gateway.",
  },
  {
    question: "What is the cancellation policy?",
    answer:
      'You can cancel a confirmed booking before the provider has been assigned at no charge. Once a provider is assigned, cancellation may incur a fee depending on how close to the scheduled time the cancellation is made. To cancel, go to your booking details and tap "Cancel Booking".',
  },
  {
    question: "How are providers verified?",
    answer:
      "All providers on BharatClap go through a thorough verification process. This includes Aadhaar ID verification, background checks, and skill assessment. Verified providers display a green checkmark badge on their profile. We continuously monitor provider quality through customer reviews and ratings.",
  },
  {
    question: "Is BharatClap safe to use?",
    answer:
      "Your safety is our top priority. All providers are verified with government-issued ID. Each booking comes with an OTP verification system - the provider must enter the OTP shared with you to start the service. You also receive an emergency contact option during booking. Our support team is available to help with any safety concerns.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can reach our support team via email at support@bharatclap.com or call us at 1800-XXX-XXXX (toll-free). Support hours are Monday to Saturday, 8 AM to 10 PM IST. For urgent issues related to an ongoing service, use the emergency contact feature in your booking details.",
  },
  {
    question: "How do ratings and reviews work?",
    answer:
      "After a service is completed, you can rate your provider on four dimensions: Punctuality, Quality, Behavior, and Value for Money. Each is rated on a 1-5 star scale. Your overall rating is the average of these four scores. Reviews help other customers make informed choices and help us maintain service quality.",
  },
  {
    question: "Can I rebook a previous service?",
    answer:
      'Yes! You can easily rebook any previous service from your booking history. Go to "My Bookings" tab, find the completed booking you want to repeat, and tap "Rebook". This will pre-fill the service and provider details for quick rebooking.',
  },
  {
    question: "What if I have a dispute with a provider?",
    answer:
      'If you are unsatisfied with a service, you can raise a dispute from your booking details page. Tap "Report Issue" and describe your concern. Our team will review the dispute and work towards a fair resolution within 48-72 hours. You can track the status of your dispute in the booking details.',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-2">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className={`flex-row items-center justify-between p-4 rounded-2xl ${
          expanded ? "bg-primary-50" : "bg-gray-50"
        }`}
        activeOpacity={0.7}
      >
        <Text
          className={`text-base font-semibold flex-1 mr-3 ${
            expanded ? "text-primary" : "text-secondary"
          }`}
        >
          {item.question}
        </Text>
        <Text
          className={`text-lg ${expanded ? "text-primary" : "text-gray-400"}`}
        >
          {expanded ? "\u2212" : "+"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View className="px-4 py-3 bg-white">
          <Text className="text-sm text-gray-600 leading-5">
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL("mailto:support@bharatclap.com").catch(() => {
      Alert.alert("Error", "Could not open email app. Please email us at support@bharatclap.com");
    });
  };

  const handleCall = () => {
    Linking.openURL("tel:1800XXXXXXX").catch(() => {
      Alert.alert("Error", "Could not open phone app. Please call 1800-XXX-XXXX");
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Help Center</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="px-5 pt-6 pb-4 items-center">
          <Text style={{ fontSize: 48 }}>{"\uD83D\uDCA1"}</Text>
          <Text className="text-2xl font-bold text-secondary mt-3">
            How can we help?
          </Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">
            Find answers to frequently asked questions below
          </Text>
        </View>

        {/* FAQ Section */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-bold text-secondary mb-4">
            Frequently Asked Questions
          </Text>
          {FAQ_DATA.map((item, index) => (
            <FAQAccordion key={index} item={item} />
          ))}
        </View>

        {/* Divider */}
        <View className="h-2 bg-gray-50" />

        {/* Contact Support Section */}
        <View className="px-5 py-6">
          <Text className="text-lg font-bold text-secondary mb-2">
            Still need help?
          </Text>
          <Text className="text-sm text-gray-500 mb-5">
            Our support team is here to assist you
          </Text>

          {/* Email */}
          <TouchableOpacity
            onPress={handleEmail}
            className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
              <Text style={{ fontSize: 20 }}>{"\u2709\uFE0F"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-secondary">
                Email Support
              </Text>
              <Text className="text-sm text-gray-400">
                support@bharatclap.com
              </Text>
            </View>
            <Text className="text-gray-400">{"\u203A"}</Text>
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            onPress={handleCall}
            className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
              <Text style={{ fontSize: 20 }}>{"\u260E\uFE0F"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-secondary">
                Call Us (Toll Free)
              </Text>
              <Text className="text-sm text-gray-400">
                1800-XXX-XXXX
              </Text>
            </View>
            <Text className="text-gray-400">{"\u203A"}</Text>
          </TouchableOpacity>

          {/* Support Hours */}
          <View className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
            <View className="flex-row items-center mb-1">
              <Text style={{ fontSize: 16 }} className="mr-2">{"\u23F0"}</Text>
              <Text className="text-sm font-semibold text-secondary">
                Support Hours
              </Text>
            </View>
            <Text className="text-sm text-gray-600 ml-6">
              Monday - Saturday, 8:00 AM - 10:00 PM IST
            </Text>
          </View>
        </View>

        {/* App Version */}
        <View className="items-center py-6">
          <Text className="text-xs text-gray-300">BharatClap v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
