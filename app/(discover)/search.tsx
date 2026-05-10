import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { CloseOrangeIcon, SearchOrangeIcon } from "../../components/ui/general-ui";
import { useProductFilterStore } from "../../store/product-filter-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const setFilters = useProductFilterStore((state) => state.setFilters);
  const quickSearches = ["Sneakers", "Perfume", "T-shirt", "Headphones", "Watches", "Skincare"];
  const popularCategories = ["Fashion", "Beauty", "Electronics", "Home", "Groceries", "Accessories"];

  function goToResults(query: string) {
    setFilters({
      query,
      category: "",
      subcategory: "",
      leveltwo: "",
      sort: "relevance",
    });
    router.push("/search-results");
  }

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
          <View className="flex-row items-center gap-4">
            <Pressable
              className="flex-1 flex-row items-center rounded-[14px] border border-primary px-3 py-0.5"
              style={{ backgroundColor: colors.card }}
              onPress={() => undefined}
            >
              <SearchOrangeIcon />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={() => {
                  const query = searchText.trim();
                  if (query) goToResults(query);
                }}
                placeholder="Search"
                placeholderTextColor={colors.textMuted}
                className="flex-1 py-2.5 pl-3 text-[16px]"
                style={{ color: colors.text }}
              />
            </Pressable>

            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
              <CloseOrangeIcon />
            </Pressable>
          </View>

          <View className="mt-6 rounded-2xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <Text className="text-[18px] font-semibold" style={{ color: colors.text }}>Find what you need faster</Text>
            <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              Tap a quick search below or type your own keywords.
            </Text>
          </View>

          <View className="mt-6">
            <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>Quick Searches</Text>
            <View className="mt-2 flex-row flex-wrap">
              {quickSearches.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => goToResults(item)}
                  className="mb-2 mr-2 rounded-full border px-3 py-2"
                  style={{ borderColor: colors.border, backgroundColor: colors.elevated }}
                >
                  <Text className="text-[13px]" style={{ color: colors.text }}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-3">
            <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>Popular Categories</Text>
            <View className="mt-2 flex-row flex-wrap">
              {popularCategories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => goToResults(item)}
                  className="mb-2 mr-2 rounded-full bg-primary/10 px-3 py-2"
                >
                  <Text className="text-[13px] font-medium text-primary">{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

