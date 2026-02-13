import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { providerService, type PortfolioItem } from "@/services/providers";

const MAX_PORTFOLIO_ITEMS = 20;
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 20;
const GRID_GAP = 10;
const COLUMNS = 3;
const ITEM_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

// Color palette for placeholder thumbnails
const PLACEHOLDER_COLORS = [
  "#FF6B00",
  "#1A1A2E",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  "#FF9800",
];

function getPlaceholderColor(index: number): string {
  return PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
}

export default function PortfolioUploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [captionInput, setCaptionInput] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: providerService.getOwnProfile,
  });

  const portfolioItems: PortfolioItem[] =
    (profile as any)?.portfolio ?? [];

  const addItemMutation = useMutation({
    mutationFn: ({
      mediaUrl,
      mediaType,
      caption,
    }: {
      mediaUrl: string;
      mediaType: string;
      caption?: string;
    }) => providerService.addPortfolioItem(mediaUrl, mediaType, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
      Alert.alert("Success", "Photo added to portfolio!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to add photo. Please try again.");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => providerService.removePortfolioItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to remove photo. Please try again.");
    },
  });

  const handleAddPhoto = async () => {
    if (portfolioItems.length >= MAX_PORTFOLIO_ITEMS) {
      Alert.alert(
        "Limit Reached",
        `You can add up to ${MAX_PORTFOLIO_ITEMS} portfolio items.`
      );
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please grant photo library access to add portfolio items."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      Alert.prompt
        ? Alert.prompt(
            "Add Caption",
            "Optional: Enter a caption for this photo",
            [
              { text: "Skip", onPress: () => submitPhoto(asset.uri, "") },
              {
                text: "Add",
                onPress: (caption) => submitPhoto(asset.uri, caption ?? ""),
              },
            ],
            "plain-text"
          )
        : // Fallback for Android (no Alert.prompt)
          submitPhoto(asset.uri, "");
    }
  };

  const submitPhoto = (uri: string, caption: string) => {
    addItemMutation.mutate({
      mediaUrl: uri,
      mediaType: "IMAGE",
      caption: caption || undefined,
    });
  };

  const handleLongPress = (item: PortfolioItem) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this portfolio item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeItemMutation.mutate(item.id),
        },
      ]
    );
  };

  const handleContinue = () => {
    router.push("/(provider)/onboarding/availability" as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">
          Loading portfolio...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#1A1A2E]">
            Portfolio
          </Text>
        </View>

        <Text className="px-5 text-sm text-[#757575] mt-2 mb-2">
          Showcase your best work to attract customers. Add photos of
          completed jobs.
        </Text>

        {/* Item count */}
        <View className="px-5 mb-4">
          <Text className="text-xs text-[#757575]">
            {portfolioItems.length} / {MAX_PORTFOLIO_ITEMS} items
          </Text>
          {portfolioItems.length >= MAX_PORTFOLIO_ITEMS && (
            <Text className="text-xs text-red-500 mt-1">
              Maximum portfolio items reached.
            </Text>
          )}
        </View>

        {/* Portfolio Grid */}
        <View
          className="px-5"
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: GRID_GAP,
          }}
        >
          {portfolioItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.8}
              style={{ width: ITEM_SIZE }}
            >
              {/* Image placeholder */}
              <View
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  borderRadius: 12,
                  backgroundColor: getPlaceholderColor(index),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 28 }}>📷</Text>
              </View>
              {item.caption ? (
                <Text
                  className="text-xs text-[#757575] mt-1 text-center"
                  numberOfLines={1}
                >
                  {item.caption}
                </Text>
              ) : (
                <Text
                  className="text-xs text-gray-300 mt-1 text-center"
                  numberOfLines={1}
                >
                  No caption
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Add Photo Button */}
          {portfolioItems.length < MAX_PORTFOLIO_ITEMS && (
            <TouchableOpacity
              onPress={handleAddPhoto}
              activeOpacity={0.7}
              style={{ width: ITEM_SIZE }}
              disabled={addItemMutation.isPending}
            >
              <View
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "#FF6B00",
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFF3E0",
                }}
              >
                {addItemMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FF6B00" />
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 28,
                        color: "#FF6B00",
                        fontWeight: "bold",
                      }}
                    >
                      +
                    </Text>
                    <Text className="text-xs text-[#FF6B00] font-semibold mt-1">
                      Add Photo
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Empty state */}
        {portfolioItems.length === 0 && (
          <View className="items-center py-8 px-5">
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
            <Text className="text-base font-semibold text-[#1A1A2E] mb-1">
              No portfolio items yet
            </Text>
            <Text className="text-sm text-[#757575] text-center">
              Add photos of your completed work to build trust with customers
              and get more bookings.
            </Text>
          </View>
        )}

        {/* Tips */}
        <View className="px-5 mt-6 mb-4">
          <View className="bg-[#E3F2FD] rounded-2xl p-4">
            <Text className="text-sm font-bold text-[#1A1A2E] mb-2">
              Tips for a great portfolio
            </Text>
            <Text className="text-xs text-[#757575] leading-5">
              {"\u2022"} Use well-lit, clear photos{"\n"}
              {"\u2022"} Show before & after results{"\n"}
              {"\u2022"} Add captions describing the work{"\n"}
              {"\u2022"} Include a variety of services{"\n"}
              {"\u2022"} Long press any photo to remove it
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-8 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-[#FF6B00] rounded-xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-base font-bold text-white">
            Continue to Availability
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
