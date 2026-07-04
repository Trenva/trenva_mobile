import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin } from "lucide-react-native";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon } from "../../components/ui/general-ui";
import { createAddress, getAddressSuggestions, ApiAddressSuggestion, getCitiesByState, type ApiCityOption, getPlaceDetails } from "../../lib/api/shop";
import { getApiErrorMessage } from "../../lib/api/errors";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

const ERROR_COLOR = "#EF4444";

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "");
}


type FieldErrors = Partial<Record<"firstName" | "lastName" | "phone" | "address" | "city" | "state", string>>;

export default function AddAddressScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [addressSuggestions, setAddressSuggestions] = useState<ApiAddressSuggestion[]>([]);
  const [cityOptions, setCityOptions] = useState<ApiCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showStateOptions, setShowStateOptions] = useState(false);
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [pendingAutoCity, setPendingAutoCity] = useState("");
  const [showAddressOptions, setShowAddressOptions] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function closeAllDropdowns() {
    setShowAddressOptions(false);
    setShowStateOptions(false);
    setShowCityOptions(false);
  }

  function clearFieldError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // Address suggestions: debounced + race-safe (aborts stale requests so a
  // slower earlier response can never overwrite a newer one).
  useEffect(() => {
    const query = address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressOptions(false);
      setIsLoadingAddress(false);
      return;
    }

    const controller = new AbortController();
    let isStale = false;
    setIsLoadingAddress(true);

    const timer = setTimeout(async () => {
      try {
        const suggestions = await getAddressSuggestions(query, { signal: controller.signal });
        if (isStale) return;
        setAddressSuggestions(suggestions);
        setShowAddressOptions(suggestions.length > 0);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setAddressSuggestions([]);
        setShowAddressOptions(false);
      } finally {
        if (!isStale) setIsLoadingAddress(false);
      }
    }, 200); // Google Places is fast enough to shorten the debounce

    return () => {
      isStale = true;
      controller.abort();
      clearTimeout(timer);
    };
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

  const [isResolvingPlace, setIsResolvingPlace] = useState(false);

  async function handleSelectSuggestion(suggestion: ApiAddressSuggestion) {
    setAddress(suggestion.description);
    clearFieldError("address");
    setAddressSuggestions([]);
    closeAllDropdowns();
    setIsResolvingPlace(true);

    try {
      const details = await getPlaceDetails(suggestion.place_id);
      if (!details.success) return;

      const matchedState = NIGERIA_STATES.find(
        (s) => normalizeToken(s) === normalizeToken(details.state ?? ""),
      );
      if (matchedState) {
        setState(matchedState);
        clearFieldError("state");
        setShowCityOptions(Boolean(details.city));
        if (details.city) setPendingAutoCity(details.city);
      }

      if (details.postal_code) setPostal(details.postal_code);
    } catch {
      // Non-fatal — user can still fill state/city manually
    } finally {
      setIsResolvingPlace(false);
    }
  }
  async function handleUseCurrentLocation() {
    setIsLoadingLocation(true);
    try {
      const Location = await import("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        notifyError("Permission needed", "Location access is required to use this feature.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const place = results[0];
      if (!place) {
        notifyError("Location not found", "Could not determine your address from your current location.");
        return;
      }

      const streetLine = [place.streetNumber, place.street].filter(Boolean).join(" ") || place.name || "";
      if (streetLine) {
        setAddress(streetLine);
        clearFieldError("address");
      }

      const matchedState = NIGERIA_STATES.find((s) => normalizeToken(s) === normalizeToken(place.region ?? ""));
      if (matchedState) {
        setState(matchedState);
        clearFieldError("state");
        if (place.city) setPendingAutoCity(place.city);
        setShowCityOptions(Boolean(place.city));
      } else if (place.city) {
        setPendingAutoCity(place.city);
      }

      if (place.postalCode) setPostal(place.postalCode);

      closeAllDropdowns();
      notifySuccess("Location found", "We've pre-filled what we could — please review before saving.");
    } catch (error) {
      notifyError("Location error", "Unable to fetch your current location right now.");
    } finally {
      setIsLoadingLocation(false);
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    if (!phone.trim()) next.phone = "Phone number is required";
    if (!address.trim()) next.address = "Street address is required";
    if (!state.trim()) next.state = "Please select a state";
    if (!city.trim()) next.city = "Please select a city / town";
    return next;
  }

  async function handleSaveAddress() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      notifyError("Missing fields", "Please fill in all required fields.");
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

  function inputStyle(field?: keyof FieldErrors) {
    return {
      borderColor: field && errors[field] ? ERROR_COLOR : colors.border,
      backgroundColor: colors.card,
      color: colors.text,
    };
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
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 24 }}
        onScrollBeginDrag={closeAllDropdowns}
      >
        {/* --- Contact details --- */}
        <Text className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
          Contact Details
        </Text>

        <TextInput
          value={firstName}
          onChangeText={(v) => { setFirstName(v); clearFieldError("firstName"); }}
          placeholder="First name"
          placeholderTextColor={colors.textMuted}
          className="rounded-[12px] border px-3 py-3 text-[14px]"
          style={inputStyle("firstName")}
        />
        {errors.firstName ? <Text className="mt-1 text-[12px]" style={{ color: ERROR_COLOR }}>{errors.firstName}</Text> : null}

        <TextInput
          value={lastName}
          onChangeText={(v) => { setLastName(v); clearFieldError("lastName"); }}
          placeholder="Last name"
          placeholderTextColor={colors.textMuted}
          className="mt-3 rounded-[12px] border px-3 py-3 text-[14px]"
          style={inputStyle("lastName")}
        />
        {errors.lastName ? <Text className="mt-1 text-[12px]" style={{ color: ERROR_COLOR }}>{errors.lastName}</Text> : null}

        <TextInput
          value={phone}
          onChangeText={(v) => { setPhone(v); clearFieldError("phone"); }}
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          className="mt-3 rounded-[12px] border px-3 py-3 text-[14px]"
          style={inputStyle("phone")}
        />
        {errors.phone ? <Text className="mt-1 text-[12px]" style={{ color: ERROR_COLOR }}>{errors.phone}</Text> : null}

        {/* --- Delivery address --- */}
        <View className="mt-6 mb-2 flex-row items-center justify-between">
          <Text className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Delivery Address
          </Text>
          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={isLoadingLocation}
            className="flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <MapPin size={14} color={colors.text} />
            )}
            <Text className="ml-1.5 text-[12px] font-medium" style={{ color: colors.text }}>
              {isLoadingLocation ? "Locating..." : "Use current location"}
            </Text>
          </Pressable>
        </View>

        <View className="relative z-30">
          <TextInput
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              clearFieldError("address");
              setShowStateOptions(false);
              setShowCityOptions(false);
            }}
            placeholder="Street address"
            placeholderTextColor={colors.textMuted}
            className="rounded-[12px] border px-3 py-3 text-[14px]"
            style={inputStyle("address")}
          />
          {isLoadingAddress|| isResolvingPlace ? (
            <View className="absolute right-3 top-0 h-full justify-center">
              <ActivityIndicator size="small" color={colors.textMuted} />
            </View>
          ) : null}

          {showAddressOptions && addressSuggestions.length > 0 ? (
            <View
              className="absolute left-0 right-0 top-[52px] overflow-hidden rounded-[12px] border"
              style={{ borderColor: colors.border, backgroundColor: colors.card, maxHeight: 240, zIndex: 60, elevation: 60 }}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                {addressSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={suggestion.place_id}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    className="flex-row items-start px-3 py-2.5"
                    style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}
                  >
                    <MapPin size={15} color={colors.textMuted} style={{ marginTop: 1, marginRight: 8 }} />
                    <Text className="flex-1 text-[13px]" style={{ color: colors.text }}>{suggestion.description}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
        {errors.address ? <Text className="mt-1 text-[12px]" style={{ color: ERROR_COLOR }}>{errors.address}</Text> : null}

        <View className="mt-3 relative z-20">
          <Pressable
            onPress={() => {
              setShowStateOptions((prev) => !prev);
              setShowAddressOptions(false);
              setShowCityOptions(false);
            }}
            className="flex-row items-center justify-between rounded-[12px] border px-3 py-3"
            style={inputStyle("state")}
          >
            <Text className="text-[14px]" style={{ color: state ? colors.text : colors.textMuted }}>
              {state || "Select state (Nigeria)"}
            </Text>
            <MapPin size={16} color={colors.textMuted} />
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
                      clearFieldError("state");
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
        {errors.state ? <Text className="mt-1 text-[12px]" style={{ color: ERROR_COLOR }}>{errors.state}</Text> : null}

        <View className="mt-3 relative z-10">
          <Pressable
            onPress={() => {
              if (!state.trim()) return;
              setShowCityOptions((prev) => !prev);
              setShowStateOptions(false);
              setShowAddressOptions(false);
            }}
            className="flex-row items-center justify-between rounded-[12px] border px-3 py-3"
            style={{ ...inputStyle("city"), opacity: state.trim() ? 1 : 0.65 }}
          >
            <Text className="text-[14px]" style={{ color: city ? colors.text : colors.textMuted }}>
              {city || (state.trim() ? "Select city / town" : "Select state first")}
            </Text>
            <MapPin size={16} color={colors.textMuted} />
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
                      clearFieldError("city");
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
        {errors.city ? (
          <Text className="mt-1 text-[12px]" style={{ color: ERROR_COLOR }}>{errors.city}</Text>
        ) : isLoadingCities ? (
          <Text className="mt-2 px-1 text-[12px]" style={{ color: colors.textMuted }}>Loading delivery cities...</Text>
        ) : (
          <Text className="mt-2 px-1 text-[12px]" style={{ color: colors.textMuted }}>
            City/town becomes selectable after choosing street address or state.
          </Text>
        )}

        {/* --- Additional details --- */}
        <Text className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
          Additional Details
        </Text>
        <TextInput
          value={postal}
          onChangeText={setPostal}
          placeholder="Postal code (optional)"
          placeholderTextColor={colors.textMuted}
          className="rounded-[12px] border px-3 py-3 text-[14px]"
          style={inputStyle()}
        />
        <TextInput
          value={country}
          editable={false}
          placeholder="Country"
          placeholderTextColor={colors.textMuted}
          className="mt-3 rounded-[12px] border px-3 py-3 text-[14px]"
          style={inputStyle()}
        />
      </ScrollView>

      {/* --- Sticky save bar --- */}
      <View
        className="border-t px-4 pt-3"
        style={{ borderColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom + 8, 16) }}
      >
        <Pressable onPress={handleSaveAddress} disabled={isSaving} className="rounded-full bg-primary py-3.5">
          {isSaving ? <ActivityIndicator color={colors.card} /> : <Text className="text-center text-[16px] font-medium text-white">Save Address</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}