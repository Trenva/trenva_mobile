import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { clearAuthTokens, getAccessToken } from "../../lib/auth/tokens";
import { fetchProfile } from "../../lib/api/auth";
import { notifySuccess } from "../../lib/ui/notify";
import { resolveMediaUrl } from "../../lib/api/shop";
import { CachedImage } from "../../components/ui/cached-image";
import { fontStyles } from "../../lib/ui/typography";
import { useAppTheme } from "../../lib/theme/theme-provider";

function ProfileMenuRow({
  icon,
  label,
  onPress,
  rightIcon,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  rightIcon?: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between px-3 py-4">
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-[16px] font-normal" style={[fontStyles.medium, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      {rightIcon ?? <ChevronRightDarkIcon color={colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const [displayName, setDisplayName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (isMounted) {
            setIsLoggedIn(false);
            setProfileImageUrl(null);
            setDisplayName("Guest");
          }
          return;
        }

        const profile = await fetchProfile();
        if (isMounted) setIsLoggedIn(true);
        const firstName = (profile?.first_name as string | undefined)?.trim() ?? "";
        const lastName = (profile?.last_name as string | undefined)?.trim() ?? "";
        const fullName = `${firstName} ${lastName}`.trim();

        if (isMounted) {
          const maybeImage =
            (typeof (profile as any)?.image === "string" && (profile as any).image) ||
            (typeof (profile as any)?.profile_image === "string" && (profile as any).profile_image) ||
            (typeof (profile as any)?.avatar === "string" && (profile as any).avatar) ||
            (typeof (profile as any)?.photo === "string" && (profile as any).photo) ||
            null;
          setProfileImageUrl(maybeImage ? resolveMediaUrl(maybeImage) ?? null : null);

          if (fullName) {
            setDisplayName(fullName);
          } else if (typeof profile?.username === "string" && profile.username.trim()) {
            setDisplayName(profile.username.trim());
          } else if (typeof profile?.email === "string" && profile.email.trim()) {
            setDisplayName(profile.email.trim());
          } else {
            setDisplayName("User");
          }
        }
      } catch {
        if (isMounted) {
          setIsLoggedIn(false);
          setProfileImageUrl(null);
          setDisplayName("Guest");
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshProfile() {
    setIsRefreshing(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsLoggedIn(false);
        setProfileImageUrl(null);
        setDisplayName("Guest");
        return;
      }

      const profile = await fetchProfile();
      setIsLoggedIn(true);
      const firstName = (profile?.first_name as string | undefined)?.trim() ?? "";
      const lastName = (profile?.last_name as string | undefined)?.trim() ?? "";
      const fullName = `${firstName} ${lastName}`.trim();
      const maybeImage =
        (typeof (profile as any)?.image === "string" && (profile as any).image) ||
        (typeof (profile as any)?.profile_image === "string" && (profile as any).profile_image) ||
        (typeof (profile as any)?.avatar === "string" && (profile as any).avatar) ||
        (typeof (profile as any)?.photo === "string" && (profile as any).photo) ||
        null;
      setProfileImageUrl(maybeImage ? resolveMediaUrl(maybeImage) ?? null : null);
      if (fullName) setDisplayName(fullName);
      else if (typeof profile?.username === "string" && profile.username.trim()) setDisplayName(profile.username.trim());
      else if (typeof profile?.email === "string" && profile.email.trim()) setDisplayName(profile.email.trim());
      else setDisplayName("User");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLogout() {
    await clearAuthTokens();
    notifySuccess("Logged out", "You have been logged out successfully.");
    router.replace("/(auth)/login");
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center px-3 pb-1" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
        <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
          <BackIcon color={colors.text} />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-medium" style={[fontStyles.semibold, { color: colors.text }]}>
          Profile
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshProfile()} />}
      >
        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}>
        <View className="items-center pb-7 pt-9">
          {profileImageUrl ? (
            <CachedImage uri={profileImageUrl} className="h-[76px] w-[76px] rounded-full" />
          ) : (
            <View className="h-[76px] w-[76px] items-center justify-center rounded-full" style={{ backgroundColor: colors.elevated }}>
              <Text className="text-[30px] font-semibold" style={[fontStyles.semibold, { color: colors.primary }]}>
                {(displayName || "U").trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isLoadingProfile ? (
            <View className="mt-3 h-6 items-center justify-center">
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : (
            <Text className="mt-3 text-[17px] font-normal" style={[fontStyles.medium, { color: colors.text }]}>
              {displayName}
            </Text>
          )}
        </View>

        <View className="px-4">
          <View className="mb-2 px-3 py-3" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <ProfileCircleIcon color={colors.text} />
                <Text className="text-[16px]" style={[fontStyles.semibold, { color: colors.text }]}>
                  Your Profile
                </Text>
              </View>
              <ChevronDownDarkIcon color={colors.textMuted} />
            </View>
          </View>

          <Pressable onPress={() => router.push("/edit-profile")} className="mb-2 px-4 py-3" style={{ backgroundColor: colors.card }}>
            <Text className="pl-9 text-[16px]" style={[fontStyles.medium, { color: colors.text }]}>
              Edit Profile
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/change-password")} className="mb-2 px-4 py-3" style={{ backgroundColor: colors.card }}>
            <Text className="pl-9 text-[16px]" style={[fontStyles.medium, { color: colors.text }]}>
              Edit Password
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/delete-account")} className="mb-2 px-4 py-3" style={{ backgroundColor: colors.card }}>
            <Text className="pl-9 text-[16px]" style={[fontStyles.medium, { color: colors.text }]}>
              Delete Trenva Account
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/saved-addresses")} className="mb-2 px-4 py-3" style={{ backgroundColor: colors.card }}>
            <Text className="pl-9 text-[16px]" style={[fontStyles.medium, { color: colors.text }]}>
              Saved Addresses
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/payment-methods")} className="mb-6 px-4 py-3" style={{ backgroundColor: colors.card }}>
            <Text className="pl-9 text-[16px]" style={[fontStyles.medium, { color: colors.text }]}>
              Payment Methods
            </Text>
          </Pressable>

          <View className="mb-8">
            <ProfileMenuRow icon={<WalletOutlineIcon color={colors.text} />} label="Wallet" onPress={() => router.push("/wallet")} />
            <ProfileMenuRow icon={<HeartOutlineDarkIcon color={colors.text} />} label="Wishlist" onPress={() => router.push("/(tabs)/wishlist")} />
            <ProfileMenuRow icon={<OrdersOutlineIcon color={colors.text} />} label="Followed Vendors" onPress={() => router.push("/following-vendors")} />
            <ProfileMenuRow icon={<CouponOutlineIcon color={colors.text} />} label="Coupon" onPress={() => router.push("/coupons")} />
            <ProfileMenuRow icon={<BellOutlineIcon color={colors.text} />} label="Notifications" onPress={() => router.push("/notifications")} />
            <ProfileMenuRow icon={<GlobeOutlineIcon color={colors.text} />} label="Appearance" onPress={() => router.push("/appearance")} />
            <ProfileMenuRow icon={<OrdersOutlineIcon color={colors.text} />} label="My Orders" onPress={() => router.push("/orders")} />
            <ProfileMenuRow icon={<HeadsetOutlineIcon color={colors.text} />} label="Customer Care" onPress={() => router.push("/customer-support")} />
            <ProfileMenuRow
              icon={<HelpCircleIcon color={colors.text} />}
              label="Help"
              onPress={() => setIsHelpExpanded((prev) => !prev)}
              rightIcon={
                <View style={{ transform: [{ rotate: isHelpExpanded ? "180deg" : "0deg" }] }}>
                  <ChevronDownDarkIcon color={colors.textMuted} />
                </View>
              }
            />
            {isHelpExpanded ? (
              <View style={{ backgroundColor: colors.card }}>
                <Pressable onPress={() => router.push("/help-center")} className="px-12 py-3">
                  <Text className="text-[15px]" style={[fontStyles.medium, { color: colors.text }]}>
                    FAQ
                  </Text>
                </Pressable>
                <Pressable onPress={() => router.push({ pathname: "/help-content", params: { type: "privacy" } })} className="px-12 py-3">
                  <Text className="text-[15px]" style={[fontStyles.medium, { color: colors.text }]}>
                    Privacy & Policy
                  </Text>
                </Pressable>
                <Pressable onPress={() => router.push({ pathname: "/help-content", params: { type: "terms" } })} className="px-12 py-3">
                  <Text className="text-[15px]" style={[fontStyles.medium, { color: colors.text }]}>
                    Terms of Use
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <ProfileMenuRow
              icon={<LogoutOutlineIcon color={colors.text} />}
              label={isLoggedIn ? "Logout" : "Login"}
              onPress={() => {
                if (isLoggedIn) {
                  void handleLogout();
                } else {
                  router.replace("/(auth)/login");
                }
              }}
            />
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}




