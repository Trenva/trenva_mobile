import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useToastStore } from "../../store/toast-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

export function AppToast() {
  const { visible, title, message, type, hideToast } = useToastStore();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 2600);

    return () => clearTimeout(timer);
  }, [hideToast, visible]);

  if (!visible) return null;

  const toneStyles =
    type === "success"
      ? { backgroundColor: colors.successSoft, borderColor: colors.success }
      : type === "error"
      ? { backgroundColor: colors.errorSoft, borderColor: colors.error }
      : { backgroundColor: colors.infoSoft, borderColor: colors.info };

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 top-0 z-[9999] items-center pt-14">
      <Pressable
        onPress={hideToast}
        className="mx-4 w-[92%] rounded-xl border px-4 py-3 shadow-sm"
        style={toneStyles}
      >
        <Text className="text-[14px] font-semibold" style={{ color: colors.text }}>{title}</Text>
        <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>{message}</Text>
      </Pressable>
    </View>
  );
}
