import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import {
  AuthCard,
  AuthField,
  AuthHeader,
  Divider,
  EyeIcon,
  GoogleButton,
  NameFields,
  PhoneFieldWithCountry,
  PrimaryButton,
} from "../../components/ui/auth-ui";
import { getApiErrorMessage } from "../../lib/api/errors";
import { checkEmailExists, register } from "../../lib/api/auth";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !normalizedEmail || !password) {
      notifyError("Missing fields", "Please fill all required signup fields.");
      return;
    }

    if (password !== confirmPassword) {
      notifyError("Password mismatch", "Password and confirm password must be the same.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      notifyError("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      notifyError("Weak password", "Password must be at least 6 characters.");
      return;
    }

    const usernameBase = `${firstName}${lastName}`.replace(/\s+/g, "").toLowerCase();
    const usernameFromEmail = normalizedEmail.split("@")[0] ?? "user";
    const username = (usernameBase || usernameFromEmail).slice(0, 30);

    try {
      setIsSubmitting(true);

      const exists = await checkEmailExists(normalizedEmail);
      if (exists) {
        notifyError("Email already in use", "Please login or use another email.");
        return;
      }

      await register({
        username,
        email: normalizedEmail,
        password,
        password_confirm: confirmPassword,
        phone: phone.trim() ? `${countryCode}${phone.trim()}` : "",
        phone_number: phone.trim() ? `${countryCode}${phone.trim()}` : "",
        bio: `Hi, I'm ${firstName.trim()} ${lastName.trim()}.`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      notifySuccess("Signup successful", "Account created successfully. Please log in.");
      router.replace("/(auth)/login");
    } catch (error) {
      notifyError("Signup failed", getApiErrorMessage(error, "Unable to create your account right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 140, 180) }}
      >
        <AuthHeader
          title="Sign Up"
          promptText="Already have an account?"
          promptActionText="Log In"
          onPromptAction={() => router.push("/(auth)/login")}
          showBack
          onBackPress={() => goBackOr(router, "/(auth)/login")}
        />

        <AuthCard>
          <NameFields
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
          />

          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="AkBeth@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PhoneFieldWithCountry
            value={phone}
            onChangeText={setPhone}
            countryCode={countryCode}
            onChangeCountryCode={setCountryCode}
          />

          <AuthField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="*******"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightIcon={
              <Pressable onPress={() => setShowPassword((value) => !value)}>
                <EyeIcon open={showPassword} />
              </Pressable>
            }
          />

          <AuthField
            label="Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="*******"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            rightIcon={
              <Pressable
                onPress={() => setShowConfirmPassword((value) => !value)}
              >
                <EyeIcon open={showConfirmPassword} />
              </Pressable>
            }
          />

          <PrimaryButton title={isSubmitting ? "Signing up..." : "Sign Up"} onPress={handleSignup} />
          <Divider text="Or" />
          <GoogleButton title="Sign up with Google" />
        </AuthCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
