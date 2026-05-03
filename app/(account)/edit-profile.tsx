import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { fetchProfile, type UserProfile, updateProfile } from "../../lib/api/auth";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";

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
  value,
  onChangeText,
  placeholder,
  right,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  right?: ReactNode;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-[16px] text-[#2F2F2F]">{label}</Text>
      <View className="flex-row items-center rounded-2xl border border-[#7A5E48] bg-white px-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6A6A6A"
          keyboardType={keyboardType}
          autoCapitalize="none"
          className="flex-1 py-4 text-[16px] text-[#2F2F2F]"
        />
        {right}
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        const data = await fetchProfile();
        if (!isMounted) return;

        setProfile(data);
        setFirstName(typeof data.first_name === "string" ? data.first_name : "");
        setLastName(typeof data.last_name === "string" ? data.last_name : "");
        setEmail(typeof data.email === "string" ? data.email : "");

        const profilePhone =
          (typeof data.phone === "string" && data.phone) ||
          (typeof data.phone_number === "string" && data.phone_number) ||
          "";
        setPhone(profilePhone);
        setGender(typeof data.gender === "string" ? data.gender : "");

        const profileDob =
          (typeof data.date_of_birth === "string" && data.date_of_birth) ||
          (typeof data.dob === "string" && data.dob) ||
          "";
        setDateOfBirth(profileDob);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          await clearAuthTokens();
          notifyInfo("Session expired", "Please log in again.");
          router.replace("/(auth)/login");
          return;
        }
        notifyError("Profile load failed", "Unable to load profile data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => !isLoading && !isSubmitting, [isLoading, isSubmitting]);

  async function handleSave() {
    if (!profile) {
      notifyError("Profile unavailable", "Please retry loading your profile.");
      return;
    }

    const payload: Partial<UserProfile> = {};
    const firstNameTrim = firstName.trim();
    const lastNameTrim = lastName.trim();
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();
    const genderTrim = gender.trim();
    const dobTrim = dateOfBirth.trim();

    if (firstNameTrim !== (profile.first_name ?? "")) payload.first_name = firstNameTrim;
    if (lastNameTrim !== (profile.last_name ?? "")) payload.last_name = lastNameTrim;
    if (emailTrim && emailTrim !== (profile.email ?? "")) payload.email = emailTrim;

    if ("phone" in profile && phoneTrim !== String(profile.phone ?? "")) payload.phone = phoneTrim;
    if ("phone_number" in profile && phoneTrim !== String(profile.phone_number ?? "")) payload.phone_number = phoneTrim;
    if ("gender" in profile && genderTrim !== String(profile.gender ?? "")) payload.gender = genderTrim;
    if ("date_of_birth" in profile && dobTrim !== String(profile.date_of_birth ?? "")) payload.date_of_birth = dobTrim;
    if ("dob" in profile && dobTrim !== String(profile.dob ?? "")) payload.dob = dobTrim;

    if (Object.keys(payload).length === 0) {
      notifyInfo("No changes", "Update a field before saving.");
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateProfile(payload);
      setProfile(updated);
      notifySuccess("Profile updated", "Your profile has been updated.");
      router.back();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        notifyInfo("Session expired", "Please log in again.");
        router.replace("/(auth)/login");
        return;
      }
      notifyError("Update failed", getApiErrorMessage(error, "Unable to update profile right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Enter first name" />
          <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Enter last name" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@email.com"
            keyboardType="email-address"
          />
          <Field
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="08012345678"
            keyboardType="phone-pad"
          />
          <Field label="Gender" value={gender} onChangeText={setGender} placeholder="What's your gender?" right={<DownIcon />} />
          <Field
            label="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            right={<CalendarIcon />}
          />

          <Pressable
            onPress={handleSave}
            disabled={!canSubmit}
            className={`mt-2 rounded-full py-3.5 ${canSubmit ? "bg-primary" : "bg-[#B9A89A]"}`}
          >
            <Text className="text-center text-[16px] text-white">
              {isLoading ? "Loading..." : isSubmitting ? "Updating..." : "Update"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
