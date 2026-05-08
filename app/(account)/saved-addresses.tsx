import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { getAddresses, setDefaultAddress, type ApiAddress } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

function AddressCard({
  item,
  onSetDefault,
  colors,
}: {
  item: ApiAddress;
  onSetDefault: (id: number) => void;
  colors: { card: string; border: string; elevated: string; text: string; textMuted: string };
}) {
  const fullName = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || "Address Owner";
  const line1 = [item.address, item.apartment].filter(Boolean).join(", ");
  const line2 = [item.city, item.state, item.country].filter(Boolean).join(", ");
  const postal = item.postal ? ` • ${item.postal}` : "";
  const isDefault = String(item.status ?? "").toLowerCase() === "yes";

  return (
    <View className="mb-3 rounded-2xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>{fullName}</Text>
        {isDefault ? (
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.elevated }}>
            <Text className="text-[11px] font-semibold text-primary">Default</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-[13px] leading-5" style={{ color: colors.textMuted }}>{line1 || "No address line provided"}</Text>
      <Text className="mt-0.5 text-[13px] leading-5" style={{ color: colors.textMuted }}>
        {line2 || "Location details missing"}
        {postal}
      </Text>
      {item.phone ? <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>{item.phone}</Text> : null}

      {!isDefault && item.id ? (
        <Pressable onPress={() => onSetDefault(item.id)} className="mt-3 self-start rounded-full border border-primary px-3 py-1.5">
          <Text className="text-[12px] font-semibold text-primary">Set as default</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function SavedAddressesScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);

  const loadAddresses = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const rows = await getAddresses();
      setAddresses(rows.filter((row) => !row.delete));
    } catch {
      setAddresses([]);
      notifyError("Addresses failed", "Unable to load saved addresses right now.");
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses(true);
  }, [loadAddresses]);

  async function handleSetDefault(addressId: number) {
    if (isSavingDefault) return;
    try {
      setIsSavingDefault(true);
      await setDefaultAddress(addressId);
      notifySuccess("Default updated", "Your default address has been updated.");
      await loadAddresses(false);
    } catch {
      notifyError("Update failed", "Could not update default address.");
    } finally {
      setIsSavingDefault(false);
    }
  }

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => {
      const aDefault = String(a.status ?? "").toLowerCase() === "yes" ? 1 : 0;
      const bDefault = String(b.status ?? "").toLowerCase() === "yes" ? 1 : 0;
      return bDefault - aDefault;
    });
  }, [addresses]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadAddresses(false);
            }}
          />
        }
      >
        <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center">
            <BackIcon />
          </Pressable>
          <Text className="text-[22px] font-semibold" style={{ color: colors.text }}>Saved Addresses</Text>
          <View className="w-8" />
        </View>

        <View className="px-5">
          <Pressable onPress={() => router.push("/add-address")} className="mb-4 rounded-xl bg-primary px-4 py-3">
            <Text className="text-center text-[14px] font-semibold text-white">Add New Address</Text>
          </Pressable>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : sortedAddresses.length === 0 ? (
            <View className="rounded-2xl border px-4 py-8" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>No saved addresses yet.</Text>
            </View>
          ) : (
            sortedAddresses.map((item) => (
              <AddressCard key={item.id} item={item} onSetDefault={(id) => void handleSetDefault(id)} colors={colors} />
            ))
          )}

          {isSavingDefault ? (
            <Text className="mt-1 text-center text-[12px]" style={{ color: colors.textMuted }}>Updating default address...</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}




