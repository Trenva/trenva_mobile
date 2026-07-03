import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { WebView } from "react-native-webview";
import { useAppTheme } from "../../lib/theme/theme-provider";

const PROPERTY_ID = "67c06913de20e6190b17114d";
const WIDGET_ID = "1il3pktdh";
const DIRECT_CHAT_URL = `https://tawk.to/chat/${PROPERTY_ID}/${WIDGET_ID}`;

interface TawkChatBubbleProps {
  userName?: string;
  userEmail?: string;
  bottomOffset?: number;
}

function ChatIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11.5C20 15.6421 16.4183 19 12 19C10.8629 19 9.78116 18.7774 8.801 18.376L4.5 19.5L5.62397 15.9481C4.59988 14.7075 4 13.1737 4 11.5C4 7.35786 7.58172 4 12 4C16.4183 4 20 7.35786 20 11.5Z"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
      <Path
        d="M8.5 11.5H8.51M12 11.5H12.01M15.5 11.5H15.51"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}

export default function TawkChatBubble({ userName, userEmail, bottomOffset = 24 }: TawkChatBubbleProps) {
  const { colors, mode } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  function getInjectedJavaScript() {
    if (!userName && !userEmail) return "";

    const attributes = JSON.stringify({
      ...(userName ? { name: userName } : {}),
      ...(userEmail ? { email: userEmail } : {}),
    });

    return `
      (function() {
        function setTawkAttributes() {
          if (typeof Tawk_API !== 'undefined' && Tawk_API.setAttributes) {
            Tawk_API.setAttributes(${attributes}, function(error) {});
          } else {
            setTimeout(setTawkAttributes, 200);
          }
        }
        setTawkAttributes();
      })();
      true;
    `;
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setLoading(true);
          setVisible(true);
        }}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary"
        style={{
          position: "absolute",
          bottom: bottomOffset,
          right: 20,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          zIndex: 50,
        }}
      >
        <ChatIcon />
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        presentationStyle="pageSheet"
        visible={visible}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View
            className="flex-row items-center justify-between border-b px-4 py-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-green-500" />
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                Support Chat
              </Text>
            </View>
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setVisible(false)}
              style={{ backgroundColor: colors.elevated }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.textMuted }}>
                x
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View
              className="items-center justify-center gap-3"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, zIndex: 10 }]}
            >
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                Connecting to support...
              </Text>
            </View>
          ) : null}

          <WebView
            ref={webViewRef}
            className="flex-1"
            domStorageEnabled
            injectedJavaScript={getInjectedJavaScript()}
            javaScriptEnabled
            mixedContentMode="always"
            onError={(event) => console.log("Tawk WebView error:", event.nativeEvent)}
            onLoadEnd={() => setLoading(false)}
            source={{ uri: DIRECT_CHAT_URL }}
            style={{ backgroundColor: mode === "dark" ? "#111111" : "#FFFFFF" }}
            thirdPartyCookiesEnabled
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
