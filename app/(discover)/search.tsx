import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { CloseOrangeIcon, SearchOrangeIcon } from "../../components/ui/general-ui";
import { useProductFilterStore } from "../../store/product-filter-store";

const recentSearches = ["Pot", "Gaming Pads", "Paintings", "Basketball"];

export default function SearchScreen() {
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
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-14">
          <View className="flex-row items-center gap-4">
            <Pressable
              className="flex-1 flex-row items-center rounded-[14px] border border-primary bg-white px-3 py-1.5"
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
                placeholderTextColor="#8B8B8B"
                className="flex-1 pl-3 text-[18px] text-[#2F2F2F]"
              />
            </Pressable>

            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
              <CloseOrangeIcon />
            </Pressable>
          </View>

          <Text className="mt-7 text-[14px] text-[#666666]">Recent search</Text>

          <View className="mt-3 flex-row flex-wrap gap-3">
            {recentSearches.map((item) => (
              <Pressable
                key={item}
                className="rounded-[12px] border border-primary bg-white px-4 py-2.5"
                onPress={() => goToResults(item)}
              >
                <Text className="text-[13px] text-[#444444]">{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
