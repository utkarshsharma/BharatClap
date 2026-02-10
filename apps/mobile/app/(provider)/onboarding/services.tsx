import "../../../global.css";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providerService, type ProviderService as ProviderSvc } from "@/services/providers";
import { catalogService, type Category, type Service } from "@/services/catalog";
import { formatCurrency } from "@/utils/format";

export default function ProviderServicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  // Fetch provider's current services
  const {
    data: myServices,
    isLoading: myServicesLoading,
  } = useQuery({
    queryKey: ["provider-own-services"],
    queryFn: providerService.getOwnServices,
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.getCategories,
  });

  // Fetch services for selected category
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ["catalog-services", selectedCategory],
    queryFn: () =>
      catalogService.getServices(
        selectedCategory ? { categorySlug: selectedCategory } : { limit: 50 }
      ),
    enabled: true,
  });

  const addServiceMutation = useMutation({
    mutationFn: ({ serviceId, price }: { serviceId: string; price?: number }) =>
      providerService.addService(serviceId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-own-services"] });
      Alert.alert("Success", "Service added!");
    },
    onError: () => Alert.alert("Error", "Failed to add service."),
  });

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: string) => providerService.removeService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-own-services"] });
      Alert.alert("Success", "Service removed.");
    },
    onError: () => Alert.alert("Error", "Failed to remove service."),
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ serviceId, price }: { serviceId: string; price: number }) =>
      providerService.updateServicePrice(serviceId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-own-services"] });
      setEditingPrices({});
      Alert.alert("Success", "Price updated!");
    },
    onError: () => Alert.alert("Error", "Failed to update price."),
  });

  const myServiceIds = new Set((myServices ?? []).map((s: ProviderSvc) => s.serviceId));
  const catalogServices = catalogData?.services ?? [];
  const availableServices = catalogServices.filter(
    (s: Service) => !myServiceIds.has(s.id)
  );

  const handleAddService = (service: Service) => {
    const priceStr = customPrices[service.id];
    const price = priceStr ? parseInt(priceStr, 10) * 100 : undefined;
    if (price !== undefined && price < service.basePrice) {
      Alert.alert(
        "Invalid Price",
        `Price must be at least ${formatCurrency(service.basePrice)}`
      );
      return;
    }
    addServiceMutation.mutate({ serviceId: service.id, price });
    setCustomPrices((prev) => {
      const copy = { ...prev };
      delete copy[service.id];
      return copy;
    });
  };

  const handleUpdatePrice = (serviceId: string, basePrice: number) => {
    const priceStr = editingPrices[serviceId];
    const price = priceStr ? parseInt(priceStr, 10) * 100 : 0;
    if (price < basePrice) {
      Alert.alert(
        "Invalid Price",
        `Price must be at least ${formatCurrency(basePrice)}`
      );
      return;
    }
    updatePriceMutation.mutate({ serviceId, price });
  };

  const handleRemoveService = (serviceId: string) => {
    Alert.alert("Remove Service", "Are you sure you want to remove this service?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeServiceMutation.mutate(serviceId),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-2xl text-[#1A1A2E]">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#1A1A2E]">My Services</Text>
        </View>

        {/* Your Services */}
        <View className="px-5 mt-4">
          <Text className="text-lg font-bold text-[#1A1A2E] mb-3">Your Services</Text>
          {myServicesLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-6" />
          ) : (myServices ?? []).length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center mb-4">
              <Text className="text-[#757575] text-sm">
                You haven't added any services yet.
              </Text>
            </View>
          ) : (
            (myServices ?? []).map((ps: ProviderSvc) => {
              const svc = catalogServices.find((s: Service) => s.id === ps.serviceId);
              const isEditing = editingPrices[ps.serviceId] !== undefined;

              return (
                <View
                  key={ps.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-bold text-[#1A1A2E] flex-1 mr-2">
                      {svc?.name ?? `Service ${ps.serviceId.slice(0, 6)}`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveService(ps.serviceId)}
                    >
                      <Text className="text-sm font-semibold text-[#F44336]">Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-[#757575] mr-2">Your Price:</Text>
                    {isEditing ? (
                      <View className="flex-row items-center flex-1">
                        <Text className="text-sm text-[#757575] mr-1">Rs.</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-2 py-1 text-sm flex-1"
                          value={editingPrices[ps.serviceId]}
                          onChangeText={(text) =>
                            setEditingPrices((prev) => ({
                              ...prev,
                              [ps.serviceId]: text.replace(/[^0-9]/g, ""),
                            }))
                          }
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor="#9E9E9E"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdatePrice(ps.serviceId, svc?.basePrice ?? 0)
                          }
                          className="bg-[#FF6B00] rounded-lg px-3 py-1.5 ml-2"
                        >
                          <Text className="text-xs text-white font-semibold">Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setEditingPrices((prev) => {
                              const copy = { ...prev };
                              delete copy[ps.serviceId];
                              return copy;
                            })
                          }
                          className="ml-2"
                        >
                          <Text className="text-xs text-[#757575]">Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          setEditingPrices((prev) => ({
                            ...prev,
                            [ps.serviceId]: ps.customPrice
                              ? String(ps.customPrice / 100)
                              : "",
                          }))
                        }
                      >
                        <Text className="text-sm font-semibold text-[#FF6B00]">
                          {ps.customPrice
                            ? formatCurrency(ps.customPrice)
                            : svc
                            ? formatCurrency(svc.basePrice)
                            : "N/A"}{" "}
                          <Text className="text-xs text-[#757575]">(tap to edit)</Text>
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Add Services */}
        <View className="px-5 mt-6 mb-8">
          <Text className="text-lg font-bold text-[#1A1A2E] mb-3">Add Services</Text>

          {/* Category Tabs */}
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-4" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedCategory === null ? "bg-[#FF6B00]" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedCategory === null ? "text-white" : "text-[#757575]"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              {(categories ?? []).map((cat: Category) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.slug)}
                  className={`mr-2 px-4 py-2 rounded-full ${
                    selectedCategory === cat.slug ? "bg-[#FF6B00]" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedCategory === cat.slug ? "text-white" : "text-[#757575]"
                    }`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Available Services */}
          {catalogLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-6" />
          ) : availableServices.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center">
              <Text className="text-[#757575] text-sm">
                {myServiceIds.size > 0
                  ? "You've added all available services in this category."
                  : "No services available in this category."}
              </Text>
            </View>
          ) : (
            availableServices.map((service: Service) => (
              <View
                key={service.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
              >
                <Text className="text-base font-bold text-[#1A1A2E] mb-1">
                  {service.name}
                </Text>
                <Text className="text-xs text-[#757575] mb-2" numberOfLines={2}>
                  {service.description}
                </Text>
                <Text className="text-sm text-[#757575] mb-3">
                  Base Price: {formatCurrency(service.basePrice)}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-sm text-[#757575] mr-2">Your Price (Rs.):</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1"
                    value={customPrices[service.id] ?? ""}
                    onChangeText={(text) =>
                      setCustomPrices((prev) => ({
                        ...prev,
                        [service.id]: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder={String(service.basePrice / 100)}
                    placeholderTextColor="#9E9E9E"
                  />
                  <TouchableOpacity
                    onPress={() => handleAddService(service)}
                    disabled={addServiceMutation.isPending}
                    className="bg-[#FF6B00] rounded-lg px-4 py-2 ml-2"
                  >
                    <Text className="text-sm text-white font-semibold">
                      {addServiceMutation.isPending ? "..." : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
