import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { CloseOrangeIcon, SearchOrangeIcon } from "../components/ui/general-ui";

const recentSearches = ["Pot", "Gaming Pads", "Paintings", "Basketball"];

export default function SearchScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-14">
          <View className="flex-row items-center gap-4">
            <Pressable
              className="flex-1 flex-row items-center rounded-[14px] border border-primary bg-white px-3 py-3"
              onPress={() => router.push({ pathname: "/search-results", params: { query: "Home Decor" } })}
            >
              <SearchOrangeIcon />
              <Text className="pl-3 text-[18px] text-[#8B8B8B]">Search</Text>
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
                onPress={() => router.push({ pathname: "/search-results", params: { query: item } })}
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
