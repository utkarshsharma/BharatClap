import "../../global.css";
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SlideData {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const slides: SlideData[] = [
  {
    id: "1",
    icon: "\uD83D\uDDC2\uFE0F",
    title: "Browse 100+ services",
    description:
      "From home cleaning to AC repair, find trusted professionals for every need in your city.",
  },
  {
    id: "2",
    icon: "\u2705",
    title: "Book with confidence",
    description:
      "Every service provider is verified, rated, and reviewed by real customers like you.",
  },
  {
    id: "3",
    icon: "\uD83D\uDD12",
    title: "Pay securely",
    description:
      "Multiple payment options with secure transactions. Pay only after the job is done.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleSkip = () => {
    router.replace("/(auth)/login");
  };

  const handleGetStarted = () => {
    router.replace("/(auth)/login");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-8"
    >
      <View className="w-32 h-32 rounded-full bg-primary-50 items-center justify-center mb-8">
        <Text style={{ fontSize: 56 }}>{item.icon}</Text>
      </View>
      <Text className="text-2xl font-bold text-secondary text-center mb-4">
        {item.title}
      </Text>
      <Text className="text-base text-gray-500 text-center leading-6 px-4">
        {item.description}
      </Text>
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Skip button */}
      {!isLastSlide && (
        <View className="flex-row justify-end px-6 pt-2">
          <TouchableOpacity onPress={handleSkip} className="py-2 px-4">
            <Text className="text-base text-gray-500 font-medium">Skip</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLastSlide && <View className="h-12" />}

      {/* Slides */}
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      {/* Dot indicators */}
      <View className="flex-row justify-center items-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`mx-1 rounded-full ${
              index === currentIndex
                ? "w-8 h-2 bg-primary"
                : "w-2 h-2 bg-gray-300"
            }`}
          />
        ))}
      </View>

      {/* Bottom button */}
      <View className="px-6 pb-6">
        {isLastSlide ? (
          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-primary py-4 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary py-4 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
