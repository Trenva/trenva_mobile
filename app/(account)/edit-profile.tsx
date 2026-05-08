import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import Svg, { Path, Rect } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { fetchProfile, type UserProfile, updateProfile } from "../../lib/api/auth";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 6H5M9 11V17M15 11V17M4 6H20L18.2 19.6C18.1 20.8 17 21.7 15.8 21.7H8.2C7 21.7 5.9 20.8 5.8 19.6L4 6Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={2.5} stroke={color} strokeWidth={1.6} />
      <Path d="M3 9H21M8 3V7M16 3V7" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
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
  const { colors } = useAppTheme();
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[16px]" style={{ color: colors.text }}>{label}</Text>
      <View className="flex-row items-center rounded-2xl border px-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize="none"
          className="flex-1 py-4 text-[16px]"
          style={{ color: colors.text }}
        />
        {right}
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date>(new Date(2000, 0, 1));

  useEffect(() => {
    let isMounted = true;

    async function loadProfile(showLoader = true) {
      try {
        if (showLoader) setIsLoading(true);
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
        if (profileDob) {
          const parsed = new Date(profileDob);
          if (!Number.isNaN(parsed.getTime())) setDobDate(parsed);
        }
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
        if (isMounted) setIsRefreshing(false);
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
      const data = await fetchProfile();
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
      if (profileDob) {
        const parsed = new Date(profileDob);
        if (!Number.isNaN(parsed.getTime())) setDobDate(parsed);
      }
    } catch {
      notifyError("Refresh failed", "Unable to refresh profile.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const canSubmit = useMemo(() => !isLoading && !isSubmitting, [isLoading, isSubmitting]);

  function toIsoDate(value: Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 26 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshProfile()} />}
      >
        <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center">
            <BackIcon />
          </Pressable>
          <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Edit Profile</Text>
          <View className="h-8 w-8 items-center justify-center">
            <TrashIcon color={colors.textMuted} />
          </View>
        </View>

        <View className="px-5 pt-6">
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
          <View className="mb-4">
            <Text className="mb-2 text-[16px]" style={{ color: colors.text }}>Gender</Text>
            <Pressable
              onPress={() => setShowGenderMenu(true)}
              className="flex-row items-center rounded-2xl border px-3 py-4"
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
            >
              <Text className="flex-1 text-[16px]" style={{ color: gender ? colors.text : colors.textMuted }}>
                {gender || "Select gender"}
              </Text>
              <DownIcon color={colors.textMuted} />
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-[16px]" style={{ color: colors.text }}>Date of Birth</Text>
            <Pressable
              onPress={() => {
                if (Platform.OS === "android") {
                  DateTimePickerAndroid.open({
                    value: dobDate,
                    mode: "date",
                    is24Hour: true,
                    maximumDate: new Date(),
                    onChange: (event, selectedDate) => {
                      if (event.type === "dismissed" || !selectedDate) return;
                      setDobDate(selectedDate);
                      setDateOfBirth(toIsoDate(selectedDate));
                    },
                  });
                  return;
                }
                setShowDobPicker(true);
              }}
              className="flex-row items-center rounded-2xl border px-3 py-4"
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
            >
              <Text className="flex-1 text-[16px]" style={{ color: dateOfBirth ? colors.text : colors.textMuted }}>
                {dateOfBirth || "YYYY-MM-DD"}
              </Text>
              <CalendarIcon color={colors.textMuted} />
            </Pressable>
          </View>

          {showDobPicker && Platform.OS !== "android" ? (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (event.type === "dismissed") {
                  setShowDobPicker(false);
                  return;
                }
                if (!selectedDate) return;
                setDobDate(selectedDate);
                setDateOfBirth(toIsoDate(selectedDate));
              }}
            />
          ) : null}

          <Modal
            visible={showGenderMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowGenderMenu(false)}
          >
            <Pressable
              className="flex-1 items-center justify-center bg-black/35 px-6"
              onPress={() => setShowGenderMenu(false)}
            >
              <View className="w-full max-w-[340px] overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
                <View className="border-b px-4 py-3" style={{ borderColor: colors.border }}>
                  <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>Select gender</Text>
                </View>
                {["Male", "Female"].map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setGender(option);
                      setShowGenderMenu(false);
                    }}
                    className="px-4 py-4"
                  >
                    <Text className={`text-[15px] ${gender === option ? "font-semibold text-primary" : ""}`} style={gender === option ? undefined : { color: colors.text }}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>

          <Pressable
            onPress={handleSave}
            disabled={!canSubmit}
            className="mt-2 rounded-full py-3.5"
            style={{ backgroundColor: canSubmit ? colors.primary : colors.border }}
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



