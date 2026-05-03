import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Path } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { type ApiAddress, getAddresses, setDefaultAddress } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useCheckoutStore } from "../../store/checkout-store";

function LocationPinDarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 18 16.2 18 10.8C18 7.04447 15.3137 4 12 4C8.68629 4 6 7.04447 6 10.8C6 16.2 12 21 12 21Z"
        stroke="#454545"
        strokeWidth={1.8}
      />
      <Circle cx={12} cy={10} r={2.2} fill="#454545" />
    </Svg>
  );
}

export default function AddressScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const setSelectedAddress = useCheckoutStore((state) => state.setSelectedAddress);

  async function loadAddresses() {
    setIsLoading(true);
    try {
      const response = await getAddresses();
      setAddresses(response);
      const defaultAddress = response.find((item) => item.status === "Yes") ?? response[0] ?? null;
      setSelected(defaultAddress ? String(defaultAddress.id) : null);
    } catch {
      setAddresses([]);
      setSelected(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAddresses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAddresses();
    }, []),
  );

  const selectedAddress = useMemo(
    () => addresses.find((item) => String(item.id) === selected) ?? null,
    [addresses, selected],
  );
  
  async function handleApply() {
    if (!selectedAddress) {
      notifyError("No address selected", "Please select a shipping address to continue.");
      return;
    }

    try {
      await setDefaultAddress(selectedAddress.id);
    } catch {
      // Continue flow even if set_default fails on backend.
    }

    setSelectedAddress(selectedAddress);
    notifySuccess("Address applied", "Shipping address selected.");
    router.push("/payments");
  }

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="text-[24px] font-medium text-[#2F2F2F]">Address</Text>
        <BellDarkIcon />
      </View>

      <View className="px-5">
        <View className="mb-5 mt-1 flex-row gap-2">
          <View className="h-[4px] flex-1 rounded-full bg-primary" />
          <View className="h-[4px] flex-1 rounded-full bg-[#EAEAEA]" />
          <View className="h-[4px] flex-1 rounded-full bg-[#EAEAEA]" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5">
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#FF9B00" />
          </View>
        ) : null}

        {!isLoading && addresses.length === 0 ? (
          <View className="py-6">
            <Text className="text-[14px] text-[#8B8B8B]">No saved address found yet.</Text>
          </View>
        ) : null}

        {addresses.map((address) => {
          const active = selected === String(address.id);
          const title =
            [address.first_name, address.last_name].filter(Boolean).join(" ").trim() ||
            address.company ||
            "Shipping Address";
          const cityState = [address.city, address.state].filter(Boolean).join(", ");
          const postal = address.postal ? ` - ${address.postal}` : "";
          const line = `${address.address ?? ""}${cityState ? `\n${cityState}` : ""}${postal}`.trim();

          return (
            <Pressable
              key={String(address.id)}
              onPress={() => setSelected(String(address.id))}
              className="border-b border-[#CFCFCF] py-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row gap-3">
                  <View className="pt-1">
                    <LocationPinDarkIcon />
                  </View>
                  <View>
                    <Text className="text-[16px] font-medium text-[#2E2E2E]">{title}</Text>
                    <Text className="mt-0.5 text-[12px] leading-5 text-[#A0A0A0]">{line || "No address line available"}</Text>
                  </View>
                </View>

                <View className="pt-1">
                  <View className={`h-6 w-6 rounded-full border-2 ${active ? "border-primary" : "border-[#D6A85A]"}`}>
                    {active ? <View className="m-[4px] h-3 w-3 rounded-full bg-primary" /> : null}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        <Pressable onPress={() => router.push("/add-address")} className="mt-12 items-center rounded-[8px] border border-dashed border-primary py-3">
          <Text className="text-[16px] text-primary">+  Add New Shipping Address</Text>
        </Pressable>
      </ScrollView>

      <View className="px-9 pb-8 pt-3">
        <Pressable onPress={handleApply} className="rounded-full bg-primary py-3.5">
          <Text className="text-center text-[16px] font-medium text-white">Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}
