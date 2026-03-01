import "../../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { providerService } from "@/services/providers";
import { formatRating, formatCurrency } from "@/utils/format";

/* ---------- Types matching GET /providers/:id response ---------- */
interface ProviderUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

interface ProviderServiceItem {
  id: string;
  customPrice: number | null;
  service: {
    id: string;
    name: string;
    basePrice: number;
    category?: { id: string; name: string };
  };
}

interface PortfolioItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  sortOrder: number;
}

interface ProviderDetail {
  id: string;
  bio: string | null;
  avgRating: number;
  totalJobs: number;
  aadhaarVerified: boolean;
  kycStatus: string;
  city?: string;
  user: ProviderUser;
  providerServices: ProviderServiceItem[];
  portfolioItems?: PortfolioItem[];
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customer?: { name: string };
}

/* ---------- Helpers ---------- */

const AVATAR_COLORS = [
  "#FF6B00",
  "#1A1A2E",
  "#2563EB",
  "#059669",
  "#7C3AED",
  "#DC2626",
  "#D97706",
  "#0891B2",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={{ fontSize: size }}
          className={
            star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
          }
        >
          {"\u2605"}
        </Text>
      ))}
    </View>
  );
}

/* ---------- Screen ---------- */

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSelectedProvider = useBookingStore((s) => s.setSelectedProvider);

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  const REVIEWS_PER_PAGE = 5;

  /* Fetch provider profile + favorite status */
  useEffect(() => {
    if (!id) return;

    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
        const res = await axios.get(`${API_URL}/providers/${id}`, { headers });
        setProvider(res.data);

        // Check if this provider is in the user's favorites
        if (accessToken) {
          try {
            const favRes = await providerService.getFavorites();
            const isFav = favRes.some((fav) => fav.id === id);
            setIsFavorite(isFav);
          } catch {
            // Non-critical — default to unfavorited
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load provider");
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id, accessToken]);

  /* Fetch reviews (paginated) */
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
        const res = await axios.get(`${API_URL}/providers/${id}/reviews`, {
          headers,
          params: { page: reviewPage, limit: REVIEWS_PER_PAGE },
        });
        setReviews(res.data.reviews ?? []);
        setReviewTotal(res.data.total ?? 0);
      } catch {
        // Reviews are non-critical; silently ignore
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id, reviewPage, accessToken]);

  /* Navigate to booking flow */
  const handleBookNow = () => {
    if (!provider) return;
    const selectedSvc = useBookingStore.getState().selectedService;
    const matchedSvc = provider.providerServices?.find(
      (ps) => ps.service.id === selectedSvc?.id
    );
    setSelectedProvider({
      id: provider.id,
      name: provider.user.name,
      city: provider.city,
      rating: provider.avgRating,
      reviewCount: reviewTotal,
      customPrice: matchedSvc?.customPrice ?? undefined,
    });
    router.push("/(customer)/booking" as any);
  };

  const toggleFavorite = async () => {
    if (!provider || togglingFav) return;
    setTogglingFav(true);
    try {
      if (isFavorite) {
        await providerService.removeFavorite(provider.id);
        setIsFavorite(false);
      } else {
        await providerService.addFavorite(provider.id);
        setIsFavorite(true);
      }
    } catch {
      Alert.alert("Error", "Failed to update favorite status.");
    } finally {
      setTogglingFav(false);
    }
  };

  const totalPages = Math.ceil(reviewTotal / REVIEWS_PER_PAGE);

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  /* ---------- Error / not found ---------- */
  if (error || !provider) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text style={{ fontSize: 48 }}>{"\uD83D\uDE1E"}</Text>
        <Text className="text-lg font-semibold text-secondary mt-4">
          {error ?? "Provider not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 rounded-xl bg-primary"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const providerName = provider.user.name;
  const avatarColor = getAvatarColor(providerName);

  /* ---------- Render ---------- */
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text
          className="text-xl font-bold text-secondary flex-1"
          numberOfLines={1}
        >
          Provider Profile
        </Text>
        <TouchableOpacity
          onPress={toggleFavorite}
          disabled={togglingFav}
          className="p-2"
        >
          <Text style={{ fontSize: 24 }}>
            {isFavorite ? "\u2764\uFE0F" : "\uD83E\uDD0D"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ---- Profile Header ---- */}
        <View className="px-5 pt-6 pb-4 items-center">
          {/* Avatar */}
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: avatarColor }}
          >
            <Text className="text-3xl font-bold text-white">
              {providerName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Name + Aadhaar Verified badge */}
          <View className="flex-row items-center mb-1">
            <Text className="text-xl font-bold text-secondary mr-2">
              {providerName}
            </Text>
            {provider.aadhaarVerified && (
              <View className="bg-green-100 px-2.5 py-0.5 rounded-full flex-row items-center">
                <Text className="text-green-700 text-xs font-bold mr-0.5">
                  {"\u2713"}
                </Text>
                <Text className="text-green-700 text-xs font-semibold">
                  Aadhaar Verified
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {provider.bio ? (
            <Text className="text-sm text-gray-500 text-center mt-1 px-4">
              {provider.bio}
            </Text>
          ) : null}

          {/* City */}
          {provider.city ? (
            <Text className="text-sm text-gray-400 mt-1">{provider.city}</Text>
          ) : null}
        </View>

        {/* ---- Stats Row ---- */}
        <View className="flex-row mx-5 mb-5 bg-gray-50 rounded-2xl p-4">
          {/* Rating */}
          <View className="flex-1 items-center border-r border-gray-200">
            <View className="flex-row items-center mb-1">
              <Text
                className="text-yellow-500 mr-1"
                style={{ fontSize: 18 }}
              >
                {"\u2605"}
              </Text>
              <Text className="text-xl font-bold text-secondary">
                {formatRating(provider.avgRating ?? 0)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {reviewTotal} review{reviewTotal !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Total Jobs */}
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-secondary mb-1">
              {provider.totalJobs ?? 0}
            </Text>
            <Text className="text-xs text-gray-400">Jobs Done</Text>
          </View>
        </View>

        {/* ---- Rating Stars ---- */}
        <View className="mx-5 mb-5">
          <Text className="text-lg font-bold text-secondary mb-3">Rating</Text>
          <View className="flex-row items-center">
            <StarRating rating={provider.avgRating ?? 0} size={22} />
            <Text className="text-base font-semibold text-secondary ml-2">
              {formatRating(provider.avgRating ?? 0)}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">
              ({reviewTotal})
            </Text>
          </View>
        </View>

        {/* ---- Services Offered ---- */}
        {provider.providerServices && provider.providerServices.length > 0 && (
          <View className="mx-5 mb-5">
            <Text className="text-lg font-bold text-secondary mb-3">
              Services Offered
            </Text>
            {provider.providerServices.map((ps) => {
              const price = ps.customPrice ?? ps.service.basePrice;
              return (
                <View
                  key={ps.id}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-secondary">
                      {ps.service.name}
                    </Text>
                    {ps.service.category?.name ? (
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {ps.service.category.name}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-base font-bold text-primary">
                    {formatCurrency(price)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ---- Portfolio Gallery ---- */}
        {provider.portfolioItems && provider.portfolioItems.length > 0 && (
          <View className="mx-5 mb-5">
            <Text className="text-lg font-bold text-secondary mb-3">
              Portfolio
            </Text>
            <View className="flex-row flex-wrap">
              {provider.portfolioItems.map((item, index) => (
                <View key={item.id} className="w-1/3 p-1">
                  <View className="bg-gray-100 rounded-xl aspect-square items-center justify-center">
                    <Text className="text-gray-400 text-xs text-center px-1">
                      {item.caption ?? `Work ${index + 1}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ---- Reviews Section ---- */}
        <View className="mx-5 mb-6">
          <Text className="text-lg font-bold text-secondary mb-3">
            Reviews ({reviewTotal})
          </Text>

          {reviewsLoading ? (
            <ActivityIndicator
              size="small"
              color="#FF6B00"
              className="py-4"
            />
          ) : reviews.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-gray-400 text-sm">No reviews yet</Text>
            </View>
          ) : (
            <>
              {reviews.map((review) => (
                <View
                  key={review.id}
                  className="mb-3 p-4 bg-gray-50 rounded-2xl"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <StarRating rating={review.rating} size={14} />
                    <Text className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  {review.comment ? (
                    <Text className="text-sm text-gray-600">
                      {review.comment}
                    </Text>
                  ) : null}
                  {review.customer?.name ? (
                    <Text className="text-xs text-gray-400 mt-1">
                      - {review.customer.name}
                    </Text>
                  ) : null}
                </View>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <View className="flex-row items-center justify-center mt-2">
                  <TouchableOpacity
                    onPress={() =>
                      setReviewPage((p) => Math.max(1, p - 1))
                    }
                    disabled={reviewPage <= 1}
                    className={`px-4 py-2 rounded-lg mr-2 ${
                      reviewPage <= 1 ? "bg-gray-100" : "bg-orange-50"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        reviewPage <= 1 ? "text-gray-400" : "text-primary"
                      }`}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-sm text-gray-500 mx-2">
                    {reviewPage} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setReviewPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={reviewPage >= totalPages}
                    className={`px-4 py-2 rounded-lg ml-2 ${
                      reviewPage >= totalPages ? "bg-gray-100" : "bg-orange-50"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        reviewPage >= totalPages
                          ? "text-gray-400"
                          : "text-primary"
                      }`}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Bottom spacer so content is not hidden behind Book Now button */}
        <View className="h-24" />
      </ScrollView>

      {/* ---- Sticky Book Now Button ---- */}
      <View className="absolute bottom-0 left-0 right-0 px-5 py-4 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleBookNow}
          className="py-4 rounded-xl bg-primary items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
