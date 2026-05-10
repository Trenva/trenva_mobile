import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon } from "../../components/ui/general-ui";
import { useAppTheme } from "../../lib/theme/theme-provider";

export default function VerificationCodeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const updateDigit = (index: number, value: string) => {
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < refs.length - 1) {
      refs[index + 1].current?.focus();
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingTop: Math.max(insets.top + 4, 12), paddingBottom: 24 }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center" hitSlop={12}>
            <BackIcon />
          </Pressable>
        </View>

      <View className="mt-10 items-center">
        <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Verification Code</Text>
        <Text className="mt-2 text-center text-[16px] leading-6" style={{ color: colors.text }}>
          Please enter the 4digit code that has{"\n"}been sent to your email
        </Text>
      </View>

      <View className="mt-14 flex-row items-center justify-between px-3">
        {digits.map((digit, index) => {
          const active = index === digits.findIndex((d) => d === "") || (digits.every((d) => d) && index === 3);
          return (
            <Pressable
              key={index}
              onPress={() => refs[index].current?.focus()}
              className={`h-16 w-16 items-center justify-center rounded-2xl border ${
                active ? "border-primary" : ""
              }`}
              style={active ? undefined : { borderColor: colors.border }}
            >
              <TextInput
                ref={refs[index]}
                value={digit}
                onChangeText={(value) => updateDigit(index, value)}
                keyboardType="number-pad"
                maxLength={1}
                className="w-full text-center text-[24px]"
                style={{ color: colors.text }}
                cursorColor={colors.primary}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-10 items-center">
        <Text className="text-[24px] font-medium text-primary">00:59</Text>
        <Text className="mt-2 text-[16px]" style={{ color: colors.text }}>
          Didn’t receive code? <Text className="text-primary">Resend Code</Text>
        </Text>
      </View>

        <View className="mt-24">
          <Pressable onPress={() => goBackOr(router)} className="rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] text-white">Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}




