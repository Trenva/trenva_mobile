import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AuthCard,
  AuthField,
  AuthHeader,
  Divider,
  EyeIcon,
  GoogleButton,
  NameFields,
  PhoneField,
  PrimaryButton,
} from "../../components/ui/auth-ui";

export default function SignupScreen() {
  const [firstName, setFirstName] = useState("AK");
  const [lastName, setLastName] = useState("Beth");
  const [email, setEmail] = useState("AkBeth@gmail.com");
  const [phone, setPhone] = useState("(454) 726-0592");
  const [password, setPassword] = useState("*******");
  const [confirmPassword, setConfirmPassword] = useState("*******");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
      >
        <AuthHeader
          title="Sign Up"
          promptText="Already have an account?"
          promptActionText="Log In"
          onPromptAction={() => router.push("/(auth)/login")}
          showBack
          onBackPress={() => router.back()}
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

          <PhoneField value={phone} onChangeText={setPhone} />

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

          <PrimaryButton title="Sign Up" />
          <Divider text="Or" />
          <GoogleButton title="Sign up with Google" />
        </AuthCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
