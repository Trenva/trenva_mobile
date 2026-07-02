import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { fetchProfile } from "../../lib/api/auth";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { createContactForm } from "../../lib/api/shop";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { promptLoginRequired } from "../../lib/ui/login-required";
const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

const SUPPORT_EMAIL = "contact.trenva@gmail.com";

function PhoneIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6.4 4.8L9.6 4C10.2 3.9 10.8 4.2 11 4.8L12.1 7.9C12.3 8.4 12.1 9 11.7 9.3L10.2 10.4C11 12.4 12.6 14 14.6 14.8L15.7 13.3C16 12.9 16.6 12.7 17.1 12.9L20.2 14C20.8 14.2 21.1 14.8 21 15.4L20.2 18.6C20.1 19.2 19.5 19.6 18.9 19.6C10.6 19.6 4.4 13.4 4.4 5.1C4.4 4.5 4.8 3.9 5.4 3.8Z" stroke="#FFFFFF" strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={12} rx={2.5} stroke="#FFFFFF" strokeWidth={1.6} />
      <Path d="M4 8L12 13.2L20 8" stroke="#FFFFFF" strokeWidth={1.6} />
    </Svg>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-5">
      <Text className="mb-2 text-[16px]" style={{ color: colors.text }}>{label}</Text>
      <View
        className={`rounded-2xl border px-3 ${multiline ? "py-2" : ""}`}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          className={`text-[16px] ${multiline ? "min-h-[130px]" : "py-4"}`}
          style={{ color: colors.text }}
          multiline={multiline}
          textAlignVertical="top"
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

export default function CustomerSupportScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function prefillFromProfile() {
      try {
        const profile = await fetchProfile();
        if (!mounted) return;
        const fullName = `${String(profile?.first_name ?? "").trim()} ${String(profile?.last_name ?? "").trim()}`.trim();
        if (fullName) setName(fullName);
        if (typeof profile?.email === "string") setEmail(profile.email);
      } catch {
        // Keep fields editable; prefill is optional.
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    }
    void prefillFromProfile();
    return () => {
      mounted = false;
    };
  }, [isRefreshing]);

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      notifyError("Missing fields", "Name, email and message are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanedName = name.trim();
      const cleanedEmail = email.trim().toLowerCase();
      const cleanedSubject = subject.trim() || "Customer Support";
      const cleanedMessage = message.trim();

      await createContactForm({
        name: cleanedName,
        email: cleanedEmail,
        subject: cleanedSubject,
        message: cleanedMessage,
      });

      notifySuccess("Message sent", "Our support team will contact you soon.");

      setSubject("");
      setMessage("");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        promptLoginRequired(router, "Please sign in to contact support.");
        return;
      }
      notifyError("Send failed", getApiErrorMessage(error, "Unable to send message right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => setIsRefreshing(true)} />}
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
        </View>

        <View className="px-5 pt-5">
          <Text className="text-center text-[24px] font-medium" style={{ color: colors.text }}>Customer Support</Text>
          <Text className="mt-5 text-[16px]" style={{ color: colors.text }}>Fill your complaint here</Text>

          <View className="mt-4">
            <InputField label="Username" placeholder="Enter name" value={name} onChangeText={setName} />
            <InputField label="Email" placeholder="name@email.com" value={email} onChangeText={setEmail} />
            <InputField label="Subject" placeholder="Support topic" value={subject} onChangeText={setSubject} />
            <InputField label="Message" placeholder="Your message" value={message} onChangeText={setMessage} multiline />
          </View>

          <View className="mt-4">
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className="rounded-md py-3.5"
              style={{ backgroundColor: canSubmit ? colors.primary : colors.border }}
            >
              <Text className="text-center text-[17px] font-medium text-white">
                {isSubmitting ? "Sending..." : "Send Message"}
              </Text>
            </Pressable>
          </View>

          <View className="mt-10 flex-row items-start gap-4">
            <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-primary">
              <PhoneIcon />
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-medium" style={{ color: colors.text }}>Call To Us</Text>
              <Text className="mt-4 text-[16px] leading-7" style={{ color: colors.text }}>We are available 24/7, 7 days a week.</Text>
              <Text className="mt-2 text-[16px]" style={{ color: colors.text }}>Phone: +2374932022379</Text>
            </View>
          </View>

          <View className="my-8 h-[1px]" style={{ backgroundColor: colors.border }} />

          <View className="flex-row items-start gap-4">
            <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-primary">
              <MailIcon />
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-medium" style={{ color: colors.text }}>Write To Us</Text>
              <Text className="mt-4 text-[16px] leading-7" style={{ color: colors.text }}>Fill out our form and we will contact you within 24 hours.</Text>
              <Text className="mt-2 text-[16px]" style={{ color: colors.text }}>Email: {SUPPORT_EMAIL}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}




