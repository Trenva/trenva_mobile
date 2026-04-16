import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { BackIcon } from "../components/ui/general-ui";

function TrashIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 6H5M9 11V17M15 11V17M4 6H20L18.2 19.6C18.1 20.8 17 21.7 15.8 21.7H8.2C7 21.7 5.9 20.8 5.8 19.6L4 6Z" stroke="#2D2D2D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#2D2D2D" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={2.5} stroke="#2D2D2D" strokeWidth={1.6} />
      <Path d="M3 9H21M8 3V7M16 3V7" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function Field({
  label,
  placeholder,
  right,
}: {
  label: string;
  placeholder: string;
  right?: ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-[16px] text-[#2F2F2F]">{label}</Text>
      <View className="flex-row items-center rounded-2xl border border-[#7A5E48] bg-white px-3">
        <TextInput placeholder={placeholder} placeholderTextColor="#6A6A6A" className="flex-1 py-4 text-[16px] text-[#2F2F2F]" />
        {right}
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 26 }}>
        <View className="flex-row items-center justify-between px-5 pt-3">
          <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
            <BackIcon />
          </Pressable>
          <Text className="text-[24px] font-medium text-[#2F2F2F]">Edit Profile</Text>
          <Pressable>
            <TrashIcon />
          </Pressable>
        </View>

        <View className="px-5 pt-8">
          <Field label="First Name" placeholder="Enter Name" />
          <Field label="Last Name" placeholder="Enter Name" />
          <Field label="Email::" placeholder="Abbeth@gmail.com" />
          <Field label="Phone  Number" placeholder="567890987" />
          <Field label="Gender" placeholder="What’s your gender?" right={<DownIcon />} />
          <Field label="Date of Birth" placeholder="DD/MM/YYYY" right={<CalendarIcon />} />

          <Pressable className="mt-2 rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] text-white">Update</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
