import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon } from "../../components/ui/general-ui";
import { createAddress } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

export default function AddAddressScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Nigeria");

  async function handleSaveAddress() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim()) {
      notifyError("Missing fields", "Please fill first name, last name, phone and address.");
      return;
    }

    setIsSaving(true);
    try {
      await createAddress({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal: postal.trim(),
        country: country.trim(),
        status: "No",
      });
      notifySuccess("Address added", "Your shipping address was saved.");
      router.back();
    } catch {
      notifyError("Save failed", "Unable to save address right now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center px-4 pb-2" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
        <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="ml-2 text-[22px] font-medium" style={{ color: colors.text }}>Add Address</Text>
      </View>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={state} onChangeText={setState} placeholder="State" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={postal} onChangeText={setPostal} placeholder="Postal code" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor={colors.textMuted} className="mb-4 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />

        <Pressable onPress={handleSaveAddress} disabled={isSaving} className="rounded-full bg-primary py-3.5">
          {isSaving ? <ActivityIndicator color={colors.card} /> : <Text className="text-center text-[16px] font-medium text-white">Save Address</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}



