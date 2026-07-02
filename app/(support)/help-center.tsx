import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { useAppTheme } from "../../lib/theme/theme-provider";
const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

const faqs = [
  {
    question: "Is there a free trial available?",
    answer:
      "Yes, you can try us for free for 30 days. If you want, we'll provide you with a free, personalized 30-minute onboarding call to get you up and running as soon as possible.",
  },
  {
    question: "What is Trenva about?",
    answer: "Trenva is a marketplace where you can discover products, place orders, track delivery, and manage wallet, coupons, and support in one app.",
  },
  {
    question: "What is your cancellation policy?",
    answer: "Cancellation eligibility depends on order status. Orders that have started fulfillment may not be cancellable.",
  },
  {
    question: "Can other info be added to an invoice?",
    answer: "Yes. Include order notes at checkout and contact support for invoice-specific requests.",
  },
  {
    question: "How does billing work?",
    answer: "Billing is completed at checkout through supported payment methods, including wallet and Paystack.",
  },
  {
    question: "How do I change my account email?",
    answer: "Go to Profile > Edit Profile and update your email, then save changes.",
  },
];

function WalletCardIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={12} rx={2.5} stroke="#FFFFFF" strokeWidth={1.8} />
      <Path d="M14 10H21V14H14C12.9 14 12 13.1 12 12C12 10.9 12.9 10 14 10Z" stroke="#FFFFFF" strokeWidth={1.8} />
    </Svg>
  );
}

function DepositCardIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4V16M12 4L7.5 8.5M12 4L16.5 8.5" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 16V19H19V16" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchFilterCardIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#FFFFFF" strokeWidth={1.8} />
      <Path d="M21 21L16.65 16.65" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function TransactionsCardIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={3} width={14} height={18} rx={2.4} stroke="#FFFFFF" strokeWidth={1.8} />
      <Path d="M8 8H16M8 12H16M8 16H13" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function HelpCard({
  id,
  title,
  icon,
  onPress,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  onPress?: () => void;
}) {
  const gradientId = `helpCardGradient-${id}`;

  return (
    <Pressable onPress={onPress} className="w-[48%] overflow-hidden rounded-[12px] px-3 py-3" hitSlop={ICON_HIT_SLOP}>
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 210 120" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#F8A100" />
              <Stop offset="0.55" stopColor="#F8A152" />
              <Stop offset="1" stopColor="#EC7FA1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="210" height="120" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      <View className="relative">
        <Text className="w-[120px] text-[16px] font-medium text-white">{title}</Text>
        <View className="mt-2 self-end">{icon}</View>
      </View>
    </Pressable>
  );
}

function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6V18M6 12H18" stroke="#FF9F0A" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function MinusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M6 12H18" stroke="#FF9F0A" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  function runRefresh(showLoader = true) {
    if (showLoader) setIsLoading(true);
    const timeout = setTimeout(() => {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }, 250);
    return () => clearTimeout(timeout);
  }

  useEffect(() => runRefresh(true), []);

  const normalizedQuery = searchText.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  useEffect(() => {
    setOpenIndex(filteredFaqs.length > 0 ? 0 : -1);
  }, [normalizedQuery, filteredFaqs.length]);

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              runRefresh(false);
            }}
          />
        }
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px]" style={{ color: colors.text }}>Trenva Help Center</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pt-5">
          <Text className="text-center text-[24px] font-medium" style={{ color: colors.text }}>
            <Text className="text-primary">Hello,</Text> How Can We Help?
          </Text>

          <View className="mt-4 flex-row items-center rounded-2xl border px-3 py-2" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <SearchGrayIcon />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search FAQs"
              placeholderTextColor={colors.textMuted}
              className="ml-3 flex-1 py-1 text-[16px]"
              style={{ color: colors.text }}
            />
          </View>

          <Text className="mt-8 text-[18px] font-semibold text-primary">Self Service</Text>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-4">
            <HelpCard id="wallet" title="How to use Wallet" icon={<WalletCardIcon />} onPress={() => router.push("/wallet")} />
            <HelpCard id="deposit" title="How to Deposit" icon={<DepositCardIcon />} onPress={() => router.push("/wallet")} />
            <HelpCard id="search" title="How to access Search Filter" icon={<SearchFilterCardIcon />} onPress={() => router.push("/filters")} />
            <HelpCard id="transactions" title="Accessing Transactions" icon={<TransactionsCardIcon />} onPress={() => router.push("/orders")} />
          </View>

          <View className="mb-2 mt-8 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">FAQs</Text>
            <Text className="text-[14px] underline" style={{ color: colors.text }}>
              {isLoading ? "Loading..." : `${filteredFaqs.length} result${filteredFaqs.length === 1 ? "" : "s"}`}
            </Text>
          </View>

          {isLoading ? (
            <View className="py-6">
              <Text className="text-[15px]" style={{ color: colors.textMuted }}>Loading help content...</Text>
            </View>
          ) : null}

          {!isLoading && filteredFaqs.length === 0 ? (
            <View className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <Text className="text-[15px]" style={{ color: colors.textMuted }}>No FAQs matched your search. Try another keyword.</Text>
            </View>
          ) : null}

          {!isLoading &&
            filteredFaqs.map((faq, index) => {
              const open = openIndex === index;
              return (
                <View key={faq.question} className="border-b py-4" style={{ borderColor: colors.border }}>
                  <Pressable onPress={() => setOpenIndex(open ? -1 : index)} className="flex-row items-center justify-between" hitSlop={ICON_HIT_SLOP}>
                    <Text className="max-w-[85%] text-[18px] font-medium" style={{ color: colors.text }}>{faq.question}</Text>
                    {open ? <MinusIcon /> : <PlusIcon />}
                  </Pressable>
                  {open && faq.answer ? <Text className="mt-3 text-[14px] leading-7" style={{ color: colors.textMuted }}>{faq.answer}</Text> : null}
                </View>
              );
            })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


