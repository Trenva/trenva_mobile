import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackIcon } from "../../components/ui/general-ui";
import { createAddress } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

export default function AddAddressScreen() {
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
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center px-4 pb-2 pt-3">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="ml-2 text-[22px] font-medium text-[#2F2F2F]">Add Address</Text>
      </View>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={address} onChangeText={setAddress} placeholder="Street address" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={city} onChangeText={setCity} placeholder="City" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={state} onChangeText={setState} placeholder="State" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={postal} onChangeText={setPostal} placeholder="Postal code" className="mb-3 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />
        <TextInput value={country} onChangeText={setCountry} placeholder="Country" className="mb-4 rounded-[12px] border border-[#D6D6D6] bg-white px-3 py-3 text-[14px]" />

        <Pressable onPress={handleSaveAddress} disabled={isSaving} className="rounded-full bg-primary py-3.5">
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-[16px] font-medium text-white">Save Address</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}
