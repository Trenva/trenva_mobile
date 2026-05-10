import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon } from "../../components/ui/general-ui";
import { useAppTheme, type ThemePreference } from "../../lib/theme/theme-provider";

const OPTIONS: Array<{ key: ThemePreference; title: string; subtitle: string }> = [
  { key: "light", title: "Light", subtitle: "Always use light mode" },
  { key: "dark", title: "Dark", subtitle: "Always use dark mode" },
  { key: "system", title: "System", subtitle: "Follow your device setting" },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 px-4" style={{ backgroundColor: colors.background, paddingTop: Math.max(insets.top + 4, 12) }}>
      <View className="mb-6 flex-row items-center">
        <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
          <BackIcon />
        </Pressable>
        <Text className="ml-2 text-[22px]" style={{ color: colors.text }}>
          Appearance
        </Text>
      </View>

      {OPTIONS.map((option) => {
        const active = preference === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => void setPreference(option.key)}
            className="mb-3 rounded-xl border p-4"
            style={{
              backgroundColor: colors.card,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[16px]" style={{ color: colors.text }}>
                  {option.title}
                </Text>
                <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
                  {option.subtitle}
                </Text>
              </View>
              <View
                className="h-5 w-5 rounded-full border"
                style={{
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : "transparent",
                }}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

