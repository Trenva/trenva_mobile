import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseOrangeIcon, SearchOrangeIcon } from "../../components/ui/general-ui";
import { useProductFilterStore } from "../../store/product-filter-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

export default function SearchScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const setFilters = useProductFilterStore((state) => state.setFilters);

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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
          <View className="flex-row items-center gap-4">
            <Pressable
              className="flex-1 flex-row items-center rounded-[14px] border border-primary px-3 py-1.5"
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
                className="flex-1 pl-3 text-[18px]"
                style={{ color: colors.text }}
              />
            </Pressable>

            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
              <CloseOrangeIcon />
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
