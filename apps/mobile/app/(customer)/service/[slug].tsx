import "../../../global.css";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import { reviewService, type Review } from "@/services/reviews";
import { formatCurrency, formatDuration, formatRating, formatDate } from "@/utils/format";

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => catalogService.getServiceBySlug(slug!),
    enabled: !!slug,
  });

  // We don't have a direct serviceId-to-providerId mapping for reviews here,
  // but we'll show reviews if the service has provider reviews available.
  // For now we skip reviews if no providerId is available on the service.
  const { data: reviewsData } = useQuery({
    queryKey: ["service-reviews", service?.id],
    queryFn: () =>
      reviewService.getProviderReviews(service!.id, { limit: 3 }),
    enabled: false, // Reviews are provider-based; enable when provider context is available
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg text-gray-500">Service not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse inclusions / exclusions from description if available
  // The API may provide these as separate fields; for now use the service description
  const inclusions = (service as any).inclusions as string[] | undefined;
  const exclusions = (service as any).exclusions as string[] | undefined;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary flex-1" numberOfLines={1}>
          Service Details
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-5 pt-5 pb-4 bg-primary-50">
          <Text className="text-2xl font-bold text-secondary mb-2">
            {service.name}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-primary mr-4">
              {formatCurrency(service.basePrice)}
            </Text>
            {service.estimatedDuration > 0 && (
              <View className="bg-white px-3 py-1 rounded-full">
                <Text className="text-sm text-gray-600">
                  ~{formatDuration(service.estimatedDuration)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {service.description && (
          <View className="px-5 pt-5 pb-4">
            <Text className="text-lg font-bold text-secondary mb-2">
              Description
            </Text>
            <Text className="text-base text-gray-600 leading-6">
              {service.description}
            </Text>
          </View>
        )}

        {/* Inclusions */}
        {inclusions && inclusions.length > 0 && (
          <View className="px-5 pb-4">
            <Text className="text-lg font-bold text-secondary mb-2">
              What's Included
            </Text>
            {inclusions.map((item, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-green-500 mr-2 mt-0.5">✓</Text>
                <Text className="text-base text-gray-600 flex-1">{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exclusions */}
        {exclusions && exclusions.length > 0 && (
          <View className="px-5 pb-4">
            <Text className="text-lg font-bold text-secondary mb-2">
              What's Not Included
            </Text>
            {exclusions.map((item, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-red-400 mr-2 mt-0.5">✕</Text>
                <Text className="text-base text-gray-600 flex-1">{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reviews Placeholder */}
        {reviewsData && reviewsData.reviews.length > 0 && (
          <View className="px-5 pb-4">
            <Text className="text-lg font-bold text-secondary mb-3">
              Recent Reviews
            </Text>
            {reviewsData.reviews.map((review: Review) => (
              <View
                key={review.id}
                className="mb-3 bg-gray-50 rounded-xl p-4"
              >
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm font-bold text-primary mr-2">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {formatDate(review.createdAt)}
                  </Text>
                </View>
                {review.comment && (
                  <Text className="text-sm text-gray-600">{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Spacer for button */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/(customer)/providers?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceSlug=${service.slug}&servicePrice=${service.basePrice}` as any
            )
          }
          className="bg-primary py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">
            View Available Providers
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
