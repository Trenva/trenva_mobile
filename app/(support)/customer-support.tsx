import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { fetchProfile } from "../../lib/api/auth";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { createContactForm } from "../../lib/api/shop";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";

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

function MessageIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M20 11.5C20 15.6 16.4 19 12 19C10.9 19 9.8 18.8 8.8 18.4L4 20L5.5 15.8C4.8 14.7 4.4 13.2 4.4 11.7C4.4 7.6 8 4.2 12.4 4.2C16.8 4.2 20 7.4 20 11.5Z" stroke="#FF9F0A" strokeWidth={1.8} strokeLinejoin="round" />
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
  return (
    <View className="mb-5">
      <Text className="mb-2 text-[16px] text-[#2F2F2F]">{label}</Text>
      <View className={`rounded-2xl border border-[#6F5846] bg-white px-3 ${multiline ? "py-2" : ""}`}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#5E5E5E"
          className={`text-[16px] text-[#2F2F2F] ${multiline ? "min-h-[130px]" : "py-4"}`}
          multiline={multiline}
          textAlignVertical="top"
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

export default function CustomerSupportScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }
    }
    void prefillFromProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      notifyError("Missing fields", "Name, email and message are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createContactForm({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim() || "Customer Support",
        message: message.trim(),
      });

      notifySuccess("Message sent", "Our support team will contact you soon.");
      setSubject("");
      setMessage("");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        notifyInfo("Session expired", "Please log in again.");
        router.replace("/(auth)/login");
        return;
      }
      notifyError("Send failed", getApiErrorMessage(error, "Unable to send message right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center px-3 pt-3">
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
            <BackIcon />
          </Pressable>
        </View>

        <View className="px-5 pt-4">
          <Text className="text-center text-[24px] font-medium text-[#2F2F2F]">Customer Support</Text>
          <Text className="mt-5 text-[16px] text-[#2F2F2F]">Fill your complaint here</Text>

          <View className="mt-4">
            <InputField label="Username" placeholder="Enter name" value={name} onChangeText={setName} />
            <InputField label="Email" placeholder="name@email.com" value={email} onChangeText={setEmail} />
            <InputField label="Subject" placeholder="Support topic" value={subject} onChangeText={setSubject} />
            <InputField label="Message" placeholder="Your message" value={message} onChangeText={setMessage} multiline />
          </View>

          <View className="mt-4 flex-row gap-4">
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 rounded-md py-3.5 ${canSubmit ? "bg-primary" : "bg-[#B9A89A]"}`}
            >
              <Text className="text-center text-[17px] font-medium text-white">
                {isSubmitting ? "Sending..." : "Send Message"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => notifyInfo("Live chat", "Live chat will be enabled shortly.")}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-primary bg-white py-3.5"
            >
              <MessageIcon />
              <Text className="text-[17px] font-medium text-primary">Live Chat</Text>
            </Pressable>
          </View>

          <View className="mt-10 flex-row items-start gap-4">
            <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-primary">
              <PhoneIcon />
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-medium text-[#2F2F2F]">Call To Us</Text>
              <Text className="mt-4 text-[16px] leading-7 text-[#2F2F2F]">We are available 24/7, 7 days a week.</Text>
              <Text className="mt-2 text-[16px] text-[#2F2F2F]">Phone: +2374932022379</Text>
            </View>
          </View>

          <View className="my-8 h-[1px] bg-[#8D8D8D]" />

          <View className="flex-row items-start gap-4">
            <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-primary">
              <MailIcon />
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-medium text-[#2F2F2F]">Write To Us</Text>
              <Text className="mt-4 text-[16px] leading-7 text-[#2F2F2F]">Fill out our form and we will contact you within 24 hours.</Text>
              <Text className="mt-2 text-[16px] text-[#2F2F2F]">Email: customer@gmail.com</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
