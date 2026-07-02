import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon } from "../../components/ui/general-ui";
import { createAddress, getAddressSuggestions, getCitiesByState, type ApiCityOption } from "../../lib/api/shop";
import { getApiErrorMessage } from "../../lib/api/errors";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "");
}

function parseStateCityFromSuggestion(suggestion: string) {
  const parts = suggestion
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let detectedState = "";
  for (const state of NIGERIA_STATES) {
    const found = parts.find((part) => normalizeToken(part) === normalizeToken(state));
    if (found) {
      detectedState = state;
      break;
    }
  }

  let detectedCity = "";
  if (detectedState) {
    const stateIndex = parts.findIndex((part) => normalizeToken(part) === normalizeToken(detectedState));
    if (stateIndex > 0) {
      detectedCity = parts[stateIndex - 1] ?? "";
    }
  }

  return { state: detectedState, city: detectedCity };
}

export default function AddAddressScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<ApiCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showStateOptions, setShowStateOptions] = useState(false);
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [pendingAutoCity, setPendingAutoCity] = useState("");
  const [showAddressOptions, setShowAddressOptions] = useState(false);

  function closeAllDropdowns() {
    setShowAddressOptions(false);
    setShowStateOptions(false);
    setShowCityOptions(false);
  }

  useEffect(() => {
    const query = address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressOptions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const suggestions = await getAddressSuggestions(query);
        setAddressSuggestions(suggestions);
        setShowAddressOptions(suggestions.length > 0);
      } catch {
        setAddressSuggestions([]);
        setShowAddressOptions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [address]);

  useEffect(() => {
    const stateQuery = state.trim();
    if (stateQuery.length < 2) {
      setCityOptions([]);
      setCity("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingCities(true);
      try {
        const cities = await getCitiesByState(stateQuery);
        setCityOptions(cities);
      } catch {
        setCityOptions([]);
      } finally {
        setIsLoadingCities(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (!pendingAutoCity || cityOptions.length === 0) return;
    const matched = cityOptions.find((option) => normalizeToken(option.city_name) === normalizeToken(pendingAutoCity));
    if (matched) {
      setCity(matched.city_name);
    }
    setPendingAutoCity("");
  }, [pendingAutoCity, cityOptions]);

  async function handleSaveAddress() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim() || !city.trim() || !state.trim()) {
      notifyError("Missing fields", "Please fill first name, last name, phone, address, city and state.");
      return;
    }

    setIsSaving(true);
    try {
      await createAddress({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal: postal.trim(),
        country: country.trim(),
        status: "No",
      });
      notifySuccess("Address added", "Your shipping address was saved.");
      goBackOr(router, "/address");
    } catch (error) {
      notifyError("Save failed", getApiErrorMessage(error, "Unable to save address right now."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="flex-row items-center px-4 pb-2" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
        <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center" hitSlop={12}>
          <BackIcon />
        </Pressable>
        <Text className="ml-2 text-[22px] font-medium" style={{ color: colors.text }}>Add Address</Text>
      </View>

      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 24 }}
        onScrollBeginDrag={closeAllDropdowns}
      >
        <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <View className="mb-3 relative z-30">
          <TextInput
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setShowStateOptions(false);
              setShowCityOptions(false);
            }}
            placeholder="Street address"
            placeholderTextColor={colors.textMuted}
            className="rounded-[12px] border px-3 py-3 text-[14px]"
            style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }}
          />
          {showAddressOptions && addressSuggestions.length > 0 ? (
            <View
              className="absolute left-0 right-0 top-[52px] overflow-hidden rounded-[12px] border"
              style={{ borderColor: colors.border, backgroundColor: colors.card, maxHeight: 220, zIndex: 60, elevation: 60 }}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                {addressSuggestions.slice(0, 12).map((suggestion, index) => (
                  <Pressable
                    key={`${suggestion}-${index}`}
                    onPress={() => {
                      setAddress(suggestion);
                      setAddressSuggestions([]);
                      closeAllDropdowns();
                      const parsed = parseStateCityFromSuggestion(suggestion);
                      if (parsed.state) {
                        setState(parsed.state);
                        setShowCityOptions(true);
                      }
                      if (parsed.city) {
                        setPendingAutoCity(parsed.city);
                      }
                    }}
                    className="px-3 py-2.5"
                    style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}
                  >
                    <Text className="text-[13px]" style={{ color: colors.text }}>{suggestion}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
        <View className="mb-3 relative z-20">
          <Pressable
            onPress={() => {
              setShowStateOptions((prev) => !prev);
              setShowAddressOptions(false);
              setShowCityOptions(false);
            }}
            className="rounded-[12px] border px-3 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.card }}
          >
            <Text className="text-[14px]" style={{ color: state ? colors.text : colors.textMuted }}>
              {state || "Select state (Nigeria)"}
            </Text>
          </Pressable>
          {showStateOptions ? (
            <View
              className="absolute left-0 right-0 top-[52px] overflow-hidden rounded-[12px] border"
              style={{ borderColor: colors.border, backgroundColor: colors.card, maxHeight: 240, zIndex: 55, elevation: 55 }}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                {NIGERIA_STATES.map((stateName, index) => (
                  <Pressable
                    key={stateName}
                    onPress={() => {
                      setState(stateName);
                      setCity("");
                      setPendingAutoCity("");
                      setShowStateOptions(false);
                      setShowCityOptions(true);
                    }}
                    className="px-3 py-2.5"
                    style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}
                  >
                    <Text className="text-[13px]" style={{ color: colors.text }}>{stateName}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <View className="relative z-10">
          <Pressable
            onPress={() => {
              if (!state.trim()) return;
              setShowCityOptions((prev) => !prev);
              setShowStateOptions(false);
              setShowAddressOptions(false);
            }}
            className="rounded-[12px] border px-3 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.card, opacity: state.trim() ? 1 : 0.65 }}
          >
            <Text className="text-[14px]" style={{ color: city ? colors.text : colors.textMuted }}>
              {city || (state.trim() ? "Select city / town" : "Select state first")}
            </Text>
          </Pressable>
          {!isLoadingCities && showCityOptions && cityOptions.length > 0 ? (
            <View
              className="absolute left-0 right-0 top-[52px] overflow-hidden rounded-[12px] border"
              style={{ borderColor: colors.border, backgroundColor: colors.card, maxHeight: 220, zIndex: 50, elevation: 50 }}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                {cityOptions.slice(0, 30).map((option, index) => (
                  <Pressable
                    key={`${option.id}-${index}`}
                    onPress={() => {
                      setCity(option.city_name);
                      closeAllDropdowns();
                    }}
                    className="px-3 py-2.5"
                    style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}
                  >
                    <Text className="text-[13px]" style={{ color: colors.text }}>{option.city_name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
        {isLoadingCities ? (
          <View className="mb-3 mt-2 px-1">
            <Text className="text-[12px]" style={{ color: colors.textMuted }}>Loading delivery cities...</Text>
          </View>
        ) : (
          <View className="mb-3 mt-1">
            <Text className="text-[12px]" style={{ color: colors.textMuted }}>
              City/town becomes selectable after choosing street address or state.
            </Text>
          </View>
        )}
        <TextInput value={postal} onChangeText={setPostal} placeholder="Postal code" placeholderTextColor={colors.textMuted} className="mb-3 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />
        <TextInput value={country} editable={false} placeholder="Country" placeholderTextColor={colors.textMuted} className="mb-4 rounded-[12px] border px-3 py-3 text-[14px]" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }} />

        <Pressable onPress={handleSaveAddress} disabled={isSaving} className="rounded-full bg-primary py-3.5">
          {isSaving ? <ActivityIndicator color={colors.card} /> : <Text className="text-center text-[16px] font-medium text-white">Save Address</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}




