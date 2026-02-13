import "../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  FlatList,
} from "react-native";

interface PortfolioItem {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption?: string | null;
}

interface PortfolioGalleryProps {
  items: PortfolioItem[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const ITEM_GAP = 4;
const ITEM_SIZE = (SCREEN_WIDTH - 40 - ITEM_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

export function PortfolioGallery({ items }: PortfolioGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  if (items.length === 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-sm text-gray-400">No portfolio items yet</Text>
      </View>
    );
  }

  const renderGridItem = ({ item }: { item: PortfolioItem }) => (
    <TouchableOpacity
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.8}
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        marginRight: ITEM_GAP,
        marginBottom: ITEM_GAP,
      }}
    >
      <View className="flex-1 rounded-xl bg-gray-100 overflow-hidden">
        <Image
          source={{ uri: item.mediaUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {item.mediaType === "VIDEO" && (
          <View className="absolute inset-0 items-center justify-center bg-black/20">
            <View className="w-10 h-10 rounded-full bg-white/80 items-center justify-center">
              <Text style={{ fontSize: 16 }}>{"\u25B6\uFE0F"}</Text>
            </View>
          </View>
        )}
      </View>
      {item.caption ? (
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
          {item.caption}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderGridItem}
        numColumns={COLUMN_COUNT}
        scrollEnabled={false}
        contentContainerStyle={{ paddingVertical: 4 }}
      />

      {/* Full-screen modal */}
      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View className="flex-1 bg-black">
          {/* Close button */}
          <TouchableOpacity
            onPress={() => setSelectedItem(null)}
            className="absolute top-14 right-5 z-10 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-white text-lg font-bold">{"\u2715"}</Text>
          </TouchableOpacity>

          {/* Image */}
          <View className="flex-1 items-center justify-center">
            {selectedItem ? (
              <Image
                source={{ uri: selectedItem.mediaUrl }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Caption */}
          {selectedItem?.caption ? (
            <View className="px-5 pb-10 pt-3">
              <Text className="text-white text-base text-center">
                {selectedItem.caption}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
