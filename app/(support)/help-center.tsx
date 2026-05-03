import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon, SearchGrayIcon } from "../../components/ui/general-ui";

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
}: {
  id: string;
  title: string;
  icon: ReactNode;
}) {
  const gradientId = `helpCardGradient-${id}`;

  return (
    <Pressable className="w-[48%] overflow-hidden rounded-[12px] px-3 py-3">
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
  const [openIndex, setOpenIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timeout);
  }, []);

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
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center px-3 pt-3">
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] text-[#2F2F2F]">Trenva Help Center</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pt-6">
          <Text className="text-center text-[24px] font-medium text-[#2F2F2F]">
            <Text className="text-primary">Hello,</Text> How Can We Help?
          </Text>

          <View className="mt-4 flex-row items-center rounded-2xl border border-[#3C3C3C] bg-white px-3 py-2">
            <SearchGrayIcon />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search FAQs"
              placeholderTextColor="#868686"
              className="ml-3 flex-1 py-1 text-[16px] text-[#2F2F2F]"
            />
          </View>

          <Text className="mt-8 text-[18px] font-semibold text-primary">Self Service</Text>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-4">
            <HelpCard id="wallet" title="How to use Wallet" icon={<WalletCardIcon />} />
            <HelpCard id="deposit" title="How to Deposit" icon={<DepositCardIcon />} />
            <HelpCard id="search" title="How to access Search Filter" icon={<SearchFilterCardIcon />} />
            <HelpCard id="transactions" title="Accessing Transactions" icon={<TransactionsCardIcon />} />
          </View>

          <View className="mb-2 mt-8 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">FAQs</Text>
            <Text className="text-[14px] text-[#27272A] underline">
              {isLoading ? "Loading..." : `${filteredFaqs.length} result${filteredFaqs.length === 1 ? "" : "s"}`}
            </Text>
          </View>

          {isLoading ? (
            <View className="py-6">
              <Text className="text-[15px] text-[#6A6A6A]">Loading help content...</Text>
            </View>
          ) : null}

          {!isLoading && filteredFaqs.length === 0 ? (
            <View className="rounded-xl border border-[#E3E3E3] bg-white p-4">
              <Text className="text-[15px] text-[#5A5A5A]">No FAQs matched your search. Try another keyword.</Text>
            </View>
          ) : null}

          {!isLoading &&
            filteredFaqs.map((faq, index) => {
              const open = openIndex === index;
              return (
                <View key={faq.question} className="border-b border-[#B7B7B7] py-4">
                  <Pressable onPress={() => setOpenIndex(open ? -1 : index)} className="flex-row items-center justify-between">
                    <Text className="max-w-[85%] text-[18px] font-medium text-[#1F1F1F]">{faq.question}</Text>
                    {open ? <MinusIcon /> : <PlusIcon />}
                  </Pressable>
                  {open && faq.answer ? <Text className="mt-3 text-[14px] leading-7 text-[#4F4F4F]">{faq.answer}</Text> : null}
                </View>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );
}
