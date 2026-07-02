// components/TawkChatBubble.native.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const PROPERTY_ID = '67c06913de20e6190b17114d';
const WIDGET_ID = '1il3pktdh';

// 1. Use the Direct Chat URL directly instead of a raw script
const DIRECT_CHAT_URL = `https://tawk.to{PROPERTY_ID}/${WIDGET_ID}`;

interface TawkChatBubbleProps {
  userName?: string;
  userEmail?: string;
}

export default function TawkChatBubble({ userName, userEmail }: TawkChatBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // 2. Generate a script string that interacts with the live tawk.to iframe API
  const getInjectedJavaScript = () => {
    if (!userName && !userEmail) return '';
    return `
      (function() {
        function setTawkAttributes() {
          if (typeof Tawk_API !== 'undefined' && Tawk_API.setAttributes) {
            Tawk_API.setAttributes({
              ${userName ? `name: '${userName}',` : ''}
              ${userEmail ? `email: '${userEmail}',` : ''}
            }, function(error) {});
          } else {
            // Retry if the API isn't fully ready inside the iframe yet
            setTimeout(setTawkAttributes, 200);
          }
        }
        setTawkAttributes();
      })();
      true; // Required for WebView injected JavaScript
    `;
  };

  return (
    <>
      {/* Floating Bubble */}
      <TouchableOpacity
        onPress={() => {
          setLoading(true);
          setVisible(true);
        }}
        activeOpacity={0.85}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-blue-500 items-center justify-center z-50"
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }}
      >
        <Text className="text-2xl">💬</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-base font-semibold text-gray-900">
                Support Chat
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-gray-500 text-sm font-medium">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View className="absolute inset-0 bg-white items-center justify-center z-10 gap-3">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-sm text-gray-400">Connecting to support...</Text>
            </View>
          )}

          {/* WebView — Pointed to the Direct Chat URL */}
          <WebView
            ref={webViewRef}
            source={{ uri: DIRECT_CHAT_URL }}
            className="flex-1"
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            mixedContentMode="always"
            // Use injectedJavaScript to seamlessly map the user data over
            injectedJavaScript={getInjectedJavaScript()}
            // Removed arbitrary 3000ms setTimeout; use standard onLoadEnd
            onLoadEnd={() => setLoading(false)}
            onError={(e) => console.log('WebView error:', e.nativeEvent)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
