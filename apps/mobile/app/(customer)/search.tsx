import "../../global.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { searchService } from "@/services/search";
import { formatCurrency } from "@/utils/format";
import { CONFIG } from "@/constants/config";

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchService.textSearch(searchQuery.trim());
      setResults(data.services ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(text);
    }, CONFIG.SEARCH_DEBOUNCE_MS);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== query.trim());
        return [query.trim(), ...filtered].slice(0, 10);
      });
      performSearch(query);
    }
  };

  const handleRecentTap = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  const handleServicePress = (service: any) => {
    if (query.trim()) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== query.trim());
        return [query.trim(), ...filtered].slice(0, 10);
      });
    }
    router.push(`/(customer)/providers?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceSlug=${service.slug}&servicePrice=${service.basePrice}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Header */}
      <View className="flex-row items-center px-4 pt-3 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Text style={{ fontSize: 16 }} className="mr-2">
            🔍
          </Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            placeholder="Search for services like 'AC repair' or 'plumber'"
            placeholderTextColor="#9E9E9E"
            className="flex-1 text-base text-secondary"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
              }}
              className="p-1"
            >
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B00" className="mt-12" />
      ) : query.trim().length === 0 ? (
        /* Recent Searches / Empty State */
        <View className="flex-1 px-5 pt-4">
          {recentSearches.length > 0 ? (
            <>
              <Text className="text-sm font-semibold text-gray-500 mb-3">
                Recent Searches
              </Text>
              {recentSearches.map((term, index) => (
                <TouchableOpacity
                  key={`${term}-${index}`}
                  onPress={() => handleRecentTap(term)}
                  className="flex-row items-center py-3 border-b border-gray-50"
                  activeOpacity={0.6}
                >
                  <Text className="text-gray-400 mr-3">🕐</Text>
                  <Text className="text-base text-secondary">{term}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View className="flex-1 items-center justify-center pb-20">
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text className="text-base text-gray-400 mt-4 text-center px-8">
                Search for services like 'AC repair' or 'plumber'
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Search Results */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id ?? item.slug}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleServicePress(item)}
              className="py-4 border-b border-gray-50"
              activeOpacity={0.6}
            >
              <Text className="text-base font-semibold text-secondary mb-1">
                {item.name}
              </Text>
              <View className="flex-row items-center">
                {item.category?.name && (
                  <Text className="text-xs text-gray-400 mr-3">
                    {item.category.name}
                  </Text>
                )}
                <Text className="text-sm font-bold text-primary">
                  {formatCurrency(item.basePrice)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>🤷</Text>
              <Text className="text-base text-gray-400 mt-4 text-center px-8">
                No results found for "{query}"
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
