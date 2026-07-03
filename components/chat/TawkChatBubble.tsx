import type { ComponentType } from "react";
import { Platform } from "react-native";
import TawkChatBubbleNative from "./TawkChatBubble.native";
import TawkChatBubbleWeb from "./TawkChatBubble.web";

type TawkChatBubbleProps = {
  userName?: string;
  userEmail?: string;
  bottomOffset?: number;
};

const TawkChatBubble =
  Platform.OS === "web"
    ? TawkChatBubbleNative
    : TawkChatBubbleNative;

export default TawkChatBubble as ComponentType<TawkChatBubbleProps>;
