import type { ReactNode } from "react";
import { Image, Platform, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";

const nameLogo = require("../../assets/name-logo.png");

type HeaderProps = {
  title: string;
  subtitle?: string;
  promptText?: string;
  promptActionText?: string;
  onPromptAction?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
};

type FieldProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  rightIcon?: ReactNode;
};

const DOTS = [
  { top: 10, left: 14, size: 2 },
  { top: 18, left: 88, size: 2 },
  { top: 30, right: 44, size: 2 },
  { top: 52, left: 32, size: 1.5 },
  { top: 76, right: 78, size: 2 },
  { top: 100, left: 12, size: 1.5 },
  { top: 132, right: 28, size: 1.5 },
  { top: 180, left: 58, size: 2 },
  { top: 214, right: 66, size: 1.5 },
  { top: 246, left: 4, size: 1.5 },
  { top: 292, right: 14, size: 1.5 },
  { top: 330, left: 24, size: 2 },
  { top: 380, right: 52, size: 1.5 },
];

export function AuthHeader({
  title,
  subtitle,
  promptText,
  promptActionText,
  onPromptAction,
  showBack,
  onBackPress,
}: HeaderProps) {
  return (
    <View className="relative items-center overflow-hidden bg-primary px-6 pb-36 pt-10 ios:pt-16">
      {DOTS.map((dot, index) => (
        <View
          key={index}
          pointerEvents="none"
          className="absolute rounded-full bg-white/55"
          style={{
            top: dot.top,
            left: dot.left,
            right: dot.right,
            width: dot.size,
            height: dot.size,
          }}
        />
      ))}

      {showBack ? (
        <Pressable
          className="absolute left-5 z-10 h-8 w-8 items-center justify-center ios:top-[60px] android:top-9"
          onPress={onBackPress}
        >
          <BackIcon />
        </Pressable>
      ) : null}

      <Image
        source={nameLogo}
        style={{ width: 250, height: 200 }}
        resizeMode="contain"
        className="mt-[-40px] h-[22px] w-[82px]"
      />

      <Text className="mb-[10px] mt-[-40px] text-center text-[28px] font-extrabold leading-[34px] text-white">
        {title}
      </Text>

      {subtitle ? (
        <Text className="text-center text-[15px] font-medium leading-[22px] text-white">
          {subtitle}
        </Text>
      ) : null}

      {promptText && promptActionText ? (
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[15px] leading-[22px] text-orange-50">
            {promptText}
          </Text>
          <Pressable onPress={onPromptAction}>
            <Text className="text-[15px] font-bold leading-[22px] text-white underline">
              {promptActionText}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <View className="-mt-24 mx-6 rounded-[15px] bg-white px-6 pb-[18px] pt-6 shadow-sm">
      {children}
    </View>
  );
}

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "sentences",
  rightIcon,
}: FieldProps) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-2 text-[13px] font-medium leading-[18px] text-gray-500">
          {label}
        </Text>
      ) : null}

      <View className="min-h-[46px] flex-row items-center rounded-xl border border-gray-200 bg-white">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA3AF"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="flex-1 px-[14px] py-3 text-base leading-5 text-[#20242A] ios:py-[14px]"
        />
        {rightIcon ? <View className="px-[14px]">{rightIcon}</View> : null}
      </View>
    </View>
  );
}

export function NameFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
}: {
  firstName: string;
  setFirstName: (text: string) => void;
  lastName: string;
  setLastName: (text: string) => void;
}) {
  return (
    <View className="flex-row gap-4">
      <View className="flex-1">
        <Text className="mb-2 text-[13px] font-medium leading-[18px] text-gray-500">
          First Name
        </Text>
        <View className="min-h-[46px] flex-row items-center rounded-xl border border-gray-200 bg-white">
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="AK"
            placeholderTextColor="#9AA3AF"
            autoCapitalize="words"
            className="flex-1 px-[14px] py-3 text-base leading-5 text-[#20242A] ios:py-[14px]"
          />
        </View>
      </View>

      <View className="flex-1">
        <Text className="mb-2 text-[13px] font-medium leading-[18px] text-gray-500">
          Last Name
        </Text>
        <View className="min-h-[46px] flex-row items-center rounded-xl border border-gray-200 bg-white">
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Beth"
            placeholderTextColor="#9AA3AF"
            autoCapitalize="words"
            className="flex-1 px-[14px] py-3 text-base leading-5 text-[#20242A] ios:py-[14px]"
          />
        </View>
      </View>
    </View>
  );
}

export function PhoneField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[13px] font-medium leading-[18px] text-gray-500">
        Phone Number
      </Text>
      <View className="min-h-[46px] flex-row items-center rounded-xl border border-gray-200 bg-white">
        <View className="flex-row items-center gap-2 pl-[14px] pr-[10px]">
          <Text className="text-base">🇩🇰</Text>
          <ChevronDownIcon />
        </View>
        <View className="self-stretch w-px bg-gray-200" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="(454) 726-0592"
          placeholderTextColor="#9AA3AF"
          keyboardType="phone-pad"
          className="flex-1 px-3 py-3 text-base leading-5 text-[#20242A] ios:py-[14px]"
        />
      </View>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="mt-0.5 min-h-[46px] items-center justify-center rounded-xl bg-primary"
      onPress={onPress}
    >
      <Text className="text-[18px] font-bold leading-[22px] text-white">
        {title}
      </Text>
    </Pressable>
  );
}

export function GoogleButton({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="min-h-[46px] flex-row items-center justify-center gap-3 rounded-xl border border-primary bg-white"
      onPress={onPress}
    >
      <GoogleGlyph />
      <Text className="text-base font-semibold leading-5 text-[#20242A]">
        {title}
      </Text>
    </Pressable>
  );
}

export function Divider({ text }: { text: string }) {
  return (
    <View className="my-[18px] flex-row items-center gap-4">
      <View className="h-px flex-1 bg-gray-200" />
      <Text className="text-sm leading-[18px] text-[#7D8184]">{text}</Text>
      <View className="h-px flex-1 bg-gray-200" />
    </View>
  );
}

export function Checkbox({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable className="flex-row items-center gap-2.5" onPress={onPress}>
      <View
        className={`h-4 w-4 items-center justify-center rounded border ${
          checked ? "border-primary bg-primary" : "border-[#98A2B3] bg-white"
        }`}
      >
        {checked ? <CheckIcon /> : null}
      </View>
      <Text className="text-[15px] leading-5 text-gray-500">{label}</Text>
    </Pressable>
  );
}

export function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M5 12L9 16M5 12L9 8"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeIcon({ open = false }: { open?: boolean }) {
  if (open) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 9C12.7956 9 13.5587 9.31607 14.1213 9.87868C14.6839 10.4413 15 11.2044 15 12C15 12.7956 14.6839 13.5587 14.1213 14.1213C13.5587 14.6839 12.7956 15 12 15C11.2044 15 10.4413 14.6839 9.87868 14.1213C9.31607 13.5587 9 12.7956 9 12C9 11.2044 9.31607 10.4413 9.87868 9.87868C10.4413 9.31607 11.2044 9 12 9Z"
          fill="#B5BDC8"
        />
        <Path
          d="M3.18 12C3.98825 13.6503 5.24331 15.0407 6.80248 16.0133C8.36165 16.9858 10.1624 17.5013 12 17.5013C13.8376 17.5013 15.6383 16.9858 17.1975 16.0133C18.7567 15.0407 20.0117 13.6503 20.82 12C20.0117 10.3497 18.7567 8.95925 17.1975 7.98675C15.6383 7.01424 13.8376 6.49868 12 6.49868C10.1624 6.49868 8.36165 7.01424 6.80248 7.98675C5.24331 8.95925 3.98825 10.3497 3.18 12Z"
          fill="#B5BDC8"
        />
      </Svg>
    );
  }

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.5299 4.52985C20.6624 4.38767 20.7345 4.19963 20.7311 4.00532C20.7277 3.81102 20.6489 3.62564 20.5115 3.48822C20.3741 3.35081 20.1887 3.2721 19.9944 3.26867C19.8001 3.26524 19.6121 3.33737 19.4699 3.46985L3.46991 19.4698C3.39622 19.5385 3.33712 19.6213 3.29613 19.7133C3.25514 19.8053 3.23309 19.9046 3.23132 20.0053C3.22954 20.106 3.24807 20.2061 3.28579 20.2994C3.32351 20.3928 3.37965 20.4777 3.45087 20.5489C3.52209 20.6201 3.60692 20.6762 3.70031 20.714C3.7937 20.7517 3.89373 20.7702 3.99443 20.7684C4.09513 20.7667 4.19445 20.7446 4.28645 20.7036C4.37845 20.6626 4.46125 20.6035 4.52991 20.5298L7.37691 17.6828C8.74391 18.3268 10.3169 18.7498 11.9999 18.7498C14.6839 18.7498 17.0899 17.6728 18.8199 16.3448C19.6869 15.6798 20.4029 14.9378 20.9089 14.2088C21.4009 13.4998 21.7499 12.7228 21.7499 11.9998C21.7499 11.2768 21.3999 10.4998 20.9089 9.79085C20.4029 9.06185 19.6869 8.32085 18.8209 7.65485C18.5582 7.45285 18.2809 7.25851 17.9889 7.07185L20.5299 4.52985ZM16.8999 8.16085L15.1289 9.93185C15.6064 10.653 15.8199 11.517 15.7333 12.3775C15.6467 13.238 15.2654 14.0422 14.6538 14.6537C14.0423 15.2653 13.2381 15.6467 12.3776 15.7333C11.517 15.8198 10.653 15.6063 9.93191 15.1288L8.51491 16.5448C9.62042 17.0018 10.8037 17.2412 11.9999 17.2498C14.2869 17.2498 16.3799 16.3268 17.9069 15.1548C18.6689 14.5698 19.2709 13.9368 19.6769 13.3538C20.0959 12.7498 20.2499 12.2768 20.2499 11.9998C20.2499 11.7228 20.0959 11.2498 19.6769 10.6458C19.2709 10.0628 18.6689 9.42985 17.9069 8.84485C17.5936 8.60418 17.2586 8.37618 16.8999 8.16085ZM11.0289 14.0308C11.4488 14.2314 11.9205 14.2968 12.3791 14.2181C12.8376 14.1394 13.2606 13.9205 13.5896 13.5915C13.9186 13.2625 14.1375 12.8396 14.2162 12.381C14.2949 11.9224 14.2294 11.4507 14.0289 11.0308L11.0289 14.0308Z"
        fill="#B5BDC8"
      />
      <Path
        d="M12 5.25C13.032 5.25 14.024 5.41 14.951 5.681C14.9916 5.69311 15.0283 5.71562 15.0575 5.74629C15.0867 5.77697 15.1074 5.81474 15.1175 5.85588C15.1276 5.89701 15.1268 5.94007 15.1151 5.98078C15.1035 6.0215 15.0814 6.05846 15.051 6.088L14.227 6.913C14.1966 6.94368 14.1589 6.96597 14.1173 6.97771C14.0758 6.98945 14.0319 6.99024 13.99 6.98C13.3373 6.82952 12.6698 6.75237 12 6.75C9.713 6.75 7.62 7.673 6.093 8.845C5.331 9.43 4.729 10.063 4.323 10.646C3.904 11.25 3.75 11.723 3.75 12C3.75 12.277 3.904 12.75 4.323 13.354C4.677 13.864 5.181 14.411 5.811 14.931C5.927 15.026 5.938 15.201 5.831 15.308L5.123 16.017C5.07964 16.061 5.02132 16.087 4.95962 16.09C4.89793 16.093 4.83738 16.0726 4.79 16.033C4.14601 15.5023 3.57476 14.889 3.091 14.209C2.6 13.5 2.25 12.723 2.25 12C2.25 11.277 2.6 10.5 3.091 9.791C3.597 9.062 4.313 8.321 5.179 7.655C6.91 6.327 9.316 5.25 12 5.25Z"
        fill="#B5BDC8"
      />
      <Path
        d="M12 8.25C12.1186 8.25 12.2356 8.25533 12.351 8.266C12.548 8.285 12.619 8.52 12.48 8.66L11.267 9.872C10.9441 9.98393 10.6508 10.1676 10.4092 10.4092C10.1676 10.6509 9.98391 10.9441 9.87197 11.267L8.65998 12.48C8.51998 12.62 8.28497 12.548 8.26597 12.351C8.21711 11.8312 8.27732 11.3069 8.44275 10.8117C8.60819 10.3166 8.8752 9.86137 9.2267 9.47532C9.57819 9.08928 10.0064 8.78089 10.484 8.56989C10.9615 8.35889 11.4779 8.24994 12 8.25Z"
        fill="#B5BDC8"
      />
    </Svg>
  );
}

export function ChevronDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M13.5 6.75L9 11.25L4.5 6.75"
        stroke="#7D8184"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GoogleGlyph() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M18.171 10.2083C18.171 9.62496 18.1228 9.19996 18.0187 8.7583H10.1708V11.7916H14.7771C14.6843 12.5458 14.1833 13.6791 13.0706 14.4416L13.055 14.5432L15.5305 16.4224L15.702 16.4391C17.276 15.0166 18.171 12.9208 18.171 10.2083Z"
        fill="#4285F4"
      />
      <Path
        d="M10.1709 18.25C12.4272 18.25 14.3218 17.5208 15.7021 16.4396L13.0706 14.4421C12.3664 14.9188 11.4209 15.25 10.1709 15.25C7.96097 15.25 6.08276 13.8271 5.41496 11.875L5.31673 11.8831L2.74267 13.8352L2.70886 13.9271C4.07939 16.5854 6.90544 18.25 10.1709 18.25Z"
        fill="#34A853"
      />
      <Path
        d="M5.41489 11.8749C5.23837 11.4332 5.13658 10.954 5.13658 10.4582C5.13658 9.96231 5.23837 9.48318 5.40562 9.04151L5.40094 8.93308L2.79447 6.94958L2.70879 6.98943C2.14271 8.09568 1.81982 9.33943 1.81982 10.4582C1.81982 11.5769 2.14271 12.8207 2.70879 13.9269L5.41489 11.8749Z"
        fill="#FBBC05"
      />
      <Path
        d="M10.1709 5.66672C11.7476 5.66672 12.8111 6.33339 13.4144 6.88964L15.7578 4.66672C14.3126 3.34839 12.4272 2.66672 10.1709 2.66672C6.90544 2.66672 4.07939 4.3313 2.70886 6.98964L5.40569 9.04172C6.08276 7.08964 7.96097 5.66672 10.1709 5.66672Z"
        fill="#EB4335"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6.25L4.75 8.5L9.5 3.75"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
