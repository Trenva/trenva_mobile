import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import {
  BackIcon,
  BellOutlineIcon,
  ChevronDownDarkIcon,
  ChevronRightDarkIcon,
  CouponOutlineIcon,
  GlobeOutlineIcon,
  HeadsetOutlineIcon,
  HeartOutlineDarkIcon,
  HelpCircleIcon,
  LogoutOutlineIcon,
  OrdersOutlineIcon,
  ProfileCircleIcon,
  WalletOutlineIcon,
} from "../../components/ui/general-ui";

const avatar = require("../../assets/profile-pic.png");

function ProfileMenuRow({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between px-3 py-4">
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-[16px] font-normal text-[#242424]">{label}</Text>
      </View>
      <ChevronRightDarkIcon />
    </Pressable>
  );
}

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-[#F4F4F4]">
      <View className="flex-row items-center px-3 pt-3">
        <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[28px] font-medium text-[#2F2F2F]">Profile</Text>
        <View className="w-8" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center pb-7 pt-9">
          <Image source={avatar} className="h-[76px] w-[76px] rounded-full" />
          <Text className="mt-3 text-[17px] font-normal text-[#3A3A3A]">Ak Beth</Text>
        </View>

        <View className="px-4">
          <View className="mb-2 bg-[#DEDEDE] px-3 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <ProfileCircleIcon />
                <Text className="text-[16px] text-[#2F2F2F]">Your Profile</Text>
              </View>
              <ChevronDownDarkIcon />
            </View>
          </View>

          <View className="mb-2 bg-[#E1E1E1] px-4 py-3">
            <Pressable onPress={() => router.push("/verification-code")} className="flex-row items-center justify-between">
              <Text className="pl-9 text-[16px] text-[#4A4A4A]">Security Setting</Text>
              <ChevronDownDarkIcon />
            </Pressable>
          </View>
          <Pressable onPress={() => router.push("/edit-profile")} className="mb-2 bg-[#E9E9E9] px-4 py-3">
            <Text className="pl-9 text-[16px] text-[#4A4A4A]">Edit Profile</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/change-password")} className="mb-2 bg-[#E9E9E9] px-4 py-3">
            <Text className="pl-9 text-[16px] text-[#4A4A4A]">Edit Password</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/delete-account")} className="mb-2 bg-[#E9E9E9] px-4 py-3">
            <Text className="pl-9 text-[16px] text-[#4A4A4A]">Delete Trenva Account</Text>
          </Pressable>
          <View className="mb-2 bg-[#E1E1E1] px-4 py-3">
            <Text className="pl-9 text-[16px] text-[#4A4A4A]">Saved Addresses</Text>
          </View>
          <View className="mb-6 bg-[#E1E1E1] px-4 py-3">
            <Text className="pl-9 text-[16px] text-[#4A4A4A]">Payment Methods</Text>
          </View>

          <View className="mb-8">
            <ProfileMenuRow icon={<WalletOutlineIcon />} label="Wallet" onPress={() => router.push("/wallet")} />
            <ProfileMenuRow icon={<HeartOutlineDarkIcon />} label="Wishlist" onPress={() => router.push("/(tabs)/wishlist")} />
            <ProfileMenuRow icon={<CouponOutlineIcon />} label="Coupon" onPress={() => router.push("/coupons")} />
            <ProfileMenuRow icon={<BellOutlineIcon />} label="Notifications" />
            <ProfileMenuRow icon={<GlobeOutlineIcon />} label="Language" />
            <ProfileMenuRow icon={<OrdersOutlineIcon />} label="My Orders" onPress={() => router.push("/orders")} />
            <ProfileMenuRow icon={<HeadsetOutlineIcon />} label="Customer Care" onPress={() => router.push("/customer-support")} />
            <ProfileMenuRow icon={<HelpCircleIcon />} label="Help" onPress={() => router.push("/help-center")} />
            <ProfileMenuRow icon={<LogoutOutlineIcon />} label="Logout" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
