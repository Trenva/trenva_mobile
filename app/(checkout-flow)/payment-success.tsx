import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { useAppTheme } from "../../lib/theme/theme-provider";

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
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    orderId?: string;
    total?: string;
    items?: string;
  }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/order-overview",
        params: {
          orderId: params.orderId ?? "",
          total: params.total ?? "",
          items: params.items ?? "",
        },
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [params.items, params.orderId, params.total]);

  return (
    <Pressable
      onPress={() =>
        router.replace({
          pathname: "/order-overview",
          params: {
            orderId: params.orderId ?? "",
            total: params.total ?? "",
            items: params.items ?? "",
          },
        })
      }
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background }}
    >
      <SuccessIcon />
    </Pressable>
  );
}
