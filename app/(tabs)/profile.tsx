import { View, Text, Image, Pressable, ScrollView } from "react-native";
import {
  ChevronRightIcon,
  WalletIcon,
  HeartOutlineIcon,
  CouponIcon,
  BellIcon,
  GlobeIcon,
  OrdersIcon,
  HeadsetIcon,
  HelpIcon,
  LogoutIcon,
} from "../../components/ui/home-ui";
import { Svg, Path } from "react-native-svg";
import { router } from "expo-router";
import { BackIcon } from "../../components/ui/general-ui";

const avatar = require("../../assets/profile-pic.png");

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-base text-[#222222]">{label}</Text>
      </View>
      <ChevronRightIcon />
    </Pressable>
  );
}

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F3]">
      <View className="flex-row items-center px-3 py-3">
        <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-2xl font-semibold text-[#222222]">Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="items-center py-6">
          <Image source={avatar} className="h-20 w-20 rounded-full" />
          <Text className="mt-3 text-base font-semibold text-[#222222]">Ak Beth</Text>
        </View>

        <View className="mx-4 rounded-md">
          <View className="mb-3 rounded bg-gray-200 px-3 py-3">
            <Text className="text-sm font-medium text-[#333333]">Your Profile</Text>
          </View>

          <View className="mb-4 rounded bg-white shadow-sm">
            <Row icon={<Text className="text-lg">🔒</Text>} label="Security Setting" />
            <Row icon={<Text className="text-lg">✏️</Text>} label="Edit Profile" />
            <Row icon={<Text className="text-lg">🔑</Text>} label="Edit Password" />
            <Row icon={<Text className="text-lg">🗑️</Text>} label="Delete Trenva Account" />
            <Row icon={<Text className="text-lg">📍</Text>} label="Saved Addresses" />
            <Row icon={<Text className="text-lg">💳</Text>} label="Payment Methods" />
          </View>

          <View className="mb-6 rounded bg-white shadow-sm">
            <Row icon={<WalletIcon />} label="Wallet" />
            <Row icon={<HeartOutlineIcon />} label="Wishlist" />
            <Row icon={<CouponIcon />} label="Coupon" />
            <Row icon={<BellIcon />} label="Notifications" />
            <Row icon={<GlobeIcon />} label="Language" />
            <Row icon={<OrdersIcon />} label="My Orders" />
            <Row icon={<HeadsetIcon />} label="Customer Care" />
            <Row icon={<HelpIcon />} label="Help" />
            <Row icon={<LogoutIcon />} label="Logout" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
