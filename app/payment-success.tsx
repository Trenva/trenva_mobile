import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";

function SuccessIcon() {
  return (
    <Svg width={112} height={112} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={44} stroke="#FF9F0A" strokeWidth={8} />
      <Path
        d="M52 36L39 50V78C39 82.4 42.6 86 47 86H76C80.4 86 84 82.4 84 78V54C84 49.6 80.4 46 76 46H63L66 39C67 34 64 30 59.7 29.4C56.6 29 53.8 31.1 52 36Z"
        fill="#FF9F0A"
      />
    </Svg>
  );
}

export default function PaymentSuccessScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/order-overview");
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      onPress={() => router.replace("/order-overview")}
      className="flex-1 items-center justify-center bg-[#F7F7F7]"
    >
      <SuccessIcon />
    </Pressable>
  );
}
