import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackIcon } from "../components/ui/general-ui";

export default function VerificationCodeScreen() {
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
    <View className="flex-1 bg-[#F7F7F7] px-5 pt-3">
      <View className="flex-row items-center">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
      </View>

      <View className="mt-10 items-center">
        <Text className="text-[24px] font-medium text-[#2F2F2F]">Verification Code</Text>
        <Text className="mt-2 text-center text-[16px] leading-6 text-[#2F2F2F]">
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
                active ? "border-primary" : "border-[#D6D6D6]"
              }`}
            >
              <TextInput
                ref={refs[index]}
                value={digit}
                onChangeText={(value) => updateDigit(index, value)}
                keyboardType="number-pad"
                maxLength={1}
                className="w-full text-center text-[24px] text-[#2F2F2F]"
                cursorColor="#FF9F0A"
              />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-10 items-center">
        <Text className="text-[28px] font-medium text-primary">00:59</Text>
        <Text className="mt-2 text-[16px] text-[#2E2E2E]">
          Didn’t receive code? <Text className="text-primary">Resend Code</Text>
        </Text>
      </View>

      <View className="mt-24">
        <Pressable onPress={() => router.back()} className="rounded-full bg-primary py-3.5">
          <Text className="text-center text-[16px] text-white">Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
