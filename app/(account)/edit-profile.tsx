import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
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
import { promptLoginRequired } from "../../lib/ui/login-required";

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
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [initialSnapshot, setInitialSnapshot] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

        const profileDob =
          (typeof data.birthday === "string" && data.birthday) ||
          (typeof data.date_of_birth === "string" && data.date_of_birth) ||
          (typeof data.dob === "string" && data.dob) ||
          "";
        setDateOfBirth(profileDob);
        setInitialSnapshot({
          firstName: typeof data.first_name === "string" ? data.first_name : "",
          lastName: typeof data.last_name === "string" ? data.last_name : "",
          email: typeof data.email === "string" ? data.email : "",
          phone: profilePhone,
          dateOfBirth: profileDob,
        });
        if (profileDob) {
          const parsed = new Date(profileDob);
          if (!Number.isNaN(parsed.getTime())) setDobDate(parsed);
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          await clearAuthTokens();
          promptLoginRequired(router, "Please sign in to edit your profile.");
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
      const profileDob =
        (typeof data.birthday === "string" && data.birthday) ||
        (typeof data.date_of_birth === "string" && data.date_of_birth) ||
        (typeof data.dob === "string" && data.dob) ||
        "";
      setDateOfBirth(profileDob);
      setInitialSnapshot({
        firstName: typeof data.first_name === "string" ? data.first_name : "",
        lastName: typeof data.last_name === "string" ? data.last_name : "",
        email: typeof data.email === "string" ? data.email : "",
        phone: profilePhone,
        dateOfBirth: profileDob,
      });
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
    const phoneTrim = phone.trim();
    const dobTrim = dateOfBirth.trim();

    if (firstNameTrim !== initialSnapshot.firstName) payload.first_name = firstNameTrim;
    if (lastNameTrim !== initialSnapshot.lastName) payload.last_name = lastNameTrim;

    if (phoneTrim !== initialSnapshot.phone) {
      payload.phone = phoneTrim;
      payload.phone_number = phoneTrim;
    }
    if (dobTrim !== initialSnapshot.dateOfBirth) {
      payload.birthday = dobTrim;
      payload.date_of_birth = dobTrim;
      payload.dob = dobTrim;
    }

    if (Object.keys(payload).length === 0) {
      notifyInfo("No changes", "Update a field before saving.");
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateProfile(payload);
      setProfile(updated);
      notifySuccess("Profile updated", "Your profile has been updated.");
      goBackOr(router, "/(tabs)/profile");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        promptLoginRequired(router, "Please sign in to edit your profile.");
        return;
      }
      notifyError("Update failed", getApiErrorMessage(error, "Unable to update profile right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 26 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshProfile()} />}
      >
        <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center" hitSlop={12}>
            <BackIcon />
          </Pressable>
          <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Edit Profile</Text>
          <View className="h-8 w-8 items-center justify-center" hitSlop={12}>
            <TrashIcon color={colors.textMuted} />
          </View>
        </View>

        <View className="px-5 pt-6">
          <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Enter first name" />
          <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Enter last name" />
          <Field
            label="Email"
            value={email}
            onChangeText={() => {}}
            placeholder="name@email.com"
            keyboardType="email-address"
            right={<Text className="text-[12px]" style={{ color: colors.textMuted }}>Verified</Text>}
          />
          <Field
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="08012345678"
            keyboardType="phone-pad"
          />
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
    </KeyboardAvoidingView>
  );
}




