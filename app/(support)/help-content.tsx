import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useAppTheme } from "../../lib/theme/theme-provider";

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

type ContentType = "privacy" | "terms" | "faq";

const CONTENT_META: Record<ContentType, { title: string; url: string; startHints: string[] }> = {
  privacy: {
    title: "Privacy and Policy",
    url: "https://trenva.store/ng/trenva/policy/",
    startHints: ["General Customer Policy", "TRENVA – GENERAL CUSTOMER POLICY FOR CUSTOMERS", "Trenva Policy"],
  },
  terms: {
    title: "Terms of Use",
    url: "https://trenva.store/ng/terms-of-use/",
    startHints: ["Terms of Use", "Trenva Terms", "TERMS OF USE"],
  },
  faq: {
    title: "FAQ",
    url: "https://trenva.store/ng/faq/",
    startHints: ["Frequently asked questions", "FAQs - Trenva Nigeria", "Everything you need to know"],
  },
};

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const normalizedBlocks = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");

  const noTags = normalizedBlocks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(noTags);

  return decoded
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractRelevant(text: string, hints: string[]) {
  const lower = text.toLowerCase();
  let startIndex = -1;
  for (const hint of hints) {
    const idx = lower.indexOf(hint.toLowerCase());
    if (idx >= 0 && (startIndex < 0 || idx < startIndex)) startIndex = idx;
  }
  if (startIndex < 0) return text;

  // Strip common footer chunks.
  const sliced = text.slice(startIndex);
  const footerMarkers = ["© Copyright", "Download App", "Quick Link", "Support"];
  let endIndex = sliced.length;
  for (const marker of footerMarkers) {
    const idx = sliced.toLowerCase().indexOf(marker.toLowerCase());
    if (idx > 0 && idx < endIndex) endIndex = idx;
  }
  return sliced.slice(0, endIndex).trim();
}

function isSectionHeading(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\d+[\.\)]\s+/.test(trimmed)) return true;
  if (/^Section\s+\d+/i.test(trimmed)) return true;
  if (/\?$/.test(trimmed) && trimmed.length <= 120) return true;
  return false;
}

type ContentSection = {
  heading: string;
  body: string[];
};

export default function HelpContentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ type?: string }>();
  const type: ContentType = params.type === "terms" || params.type === "faq" ? params.type : "privacy";
  const meta = CONTENT_META[type];

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  async function loadContent(pull = false) {
    try {
      if (pull) setIsRefreshing(true);
      else setIsLoading(true);
      const response = await fetch(meta.url);
      if (!response.ok) throw new Error(`Failed to load (${response.status})`);
      const html = await response.text();
      const parsed = extractRelevant(htmlToText(html), meta.startHints);
      setRawText(parsed);
      setErrorText(null);
    } catch {
      setErrorText("Unable to load this content right now. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadContent();
  }, [meta.url]);

  const lines = useMemo(() => rawText.split("\n").filter((line) => line.trim().length > 0), [rawText]);
  const sections = useMemo<ContentSection[]>(() => {
    if (!lines.length) return [];
    const built: ContentSection[] = [];
    let current: ContentSection | null = null;

    for (const line of lines) {
      if (isSectionHeading(line)) {
        if (current) built.push(current);
        current = { heading: line.trim(), body: [] };
        continue;
      }
      if (!current) current = { heading: "Overview", body: [] };
      current.body.push(line.trim());
    }
    if (current) built.push(current);
    return built;
  }, [lines]);

  useEffect(() => {
    setOpenSections(new Set([0]));
  }, [meta.url, rawText]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadContent(true)} />}
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[22px]" style={{ color: colors.text }}>{meta.title}</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pt-4">
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color={colors.primary} />
              <Text className="mt-3 text-[14px]" style={{ color: colors.textMuted }}>Loading content...</Text>
            </View>
          ) : null}

          {!isLoading && errorText ? (
            <View className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <Text className="text-[14px]" style={{ color: colors.textMuted }}>{errorText}</Text>
              <Pressable onPress={() => void loadContent()} className="mt-4 self-start rounded-full bg-primary px-4 py-2">
                <Text className="text-[13px] font-semibold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !errorText ? (
            <View className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              {sections.length > 0 ? (
                sections.map((section, idx) => {
                  const isOpen = openSections.has(idx);
                  return (
                    <View key={`${idx}-${section.heading.slice(0, 24)}`} className={idx < sections.length - 1 ? "mb-3 border-b pb-3" : ""} style={{ borderColor: colors.border }}>
                      <Pressable
                        onPress={() =>
                          setOpenSections((prev) => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx);
                            else next.add(idx);
                            return next;
                          })
                        }
                        className="flex-row items-center justify-between"
                        hitSlop={ICON_HIT_SLOP}
                      >
                        <Text className="max-w-[88%] text-[15px] font-semibold" style={{ color: colors.text }}>
                          {section.heading}
                        </Text>
                        <Text className="text-[22px] font-semibold" style={{ color: colors.primary }}>
                          {isOpen ? "-" : "+"}
                        </Text>
                      </Pressable>

                      {isOpen
                        ? section.body.map((line, lineIdx) => (
                            <Text key={`${idx}-${lineIdx}-${line.slice(0, 18)}`} className="mt-2 text-[14px] leading-6" style={{ color: colors.textMuted }}>
                              {line}
                            </Text>
                          ))
                        : null}
                    </View>
                  );
                })
              ) : (
                lines.map((line, idx) => (
                  <Text
                    key={`${idx}-${line.slice(0, 24)}`}
                    className={`text-[14px] leading-6 ${idx < lines.length - 1 ? "mb-2" : ""} ${isSectionHeading(line) ? "font-semibold" : ""}`}
                    style={{ color: isSectionHeading(line) ? colors.text : colors.textMuted }}
                  >
                    {line}
                  </Text>
                ))
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
