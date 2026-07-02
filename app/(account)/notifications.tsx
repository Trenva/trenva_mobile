import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useAppTheme } from "../../lib/theme/theme-provider";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={12}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Notifications</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 py-10">
          <Text className="text-center text-[16px]" style={{ color: colors.text }}>
            No notifications yet.
          </Text>
          <Text className="mt-2 text-center text-[13px]" style={{ color: colors.textMuted }}>
            This is a placeholder page for future notification updates.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

