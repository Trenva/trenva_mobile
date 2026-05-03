import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useToastStore } from "../../store/toast-store";

function getToastClass(type: "success" | "error" | "info") {
  if (type === "success") return "border-[#3AB26F] bg-[#EAF9F0]";
  if (type === "error") return "border-[#E35D5D] bg-[#FDEEEE]";
  return "border-[#5C8EF2] bg-[#EEF4FF]";
}

export function AppToast() {
  const { visible, title, message, type, hideToast } = useToastStore();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 2600);

    return () => clearTimeout(timer);
  }, [hideToast, visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 top-0 z-[9999] items-center pt-14">
      <Pressable
        onPress={hideToast}
        className={`mx-4 w-[92%] rounded-xl border px-4 py-3 shadow-sm ${getToastClass(type)}`}
      >
        <Text className="text-[14px] font-semibold text-[#232323]">{title}</Text>
        <Text className="mt-1 text-[13px] text-[#4A4A4A]">{message}</Text>
      </Pressable>
    </View>
  );
}

