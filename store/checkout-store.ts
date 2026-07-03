import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { ApiAddress } from "../lib/api/shop";

type CheckoutState = {
  selectedAddress: ApiAddress | null;
  selectedPaymentMethod: string;
  selectedDeliveryMethod: string;
  lastOrderId: string | null;
  appliedCoupon: {
    id: number;
    code: string;
    discountValue: number;
    discountType?: string;
    minimumOrder?: number;
  } | null;
  setSelectedAddress: (address: ApiAddress | null) => void;
  setSelectedPaymentMethod: (method: string) => void;
  setSelectedDeliveryMethod: (method: string) => void;
  setLastOrderId: (orderId: string | null) => void;
  setAppliedCoupon: (coupon: CheckoutState["appliedCoupon"]) => void;
  resetCheckoutFlow: () => void;
};

// Same storage pattern used by lib/theme/theme-provider.tsx: SecureStore on
// native, localStorage on web. Only the user's chosen payment method needs
// to survive a reload, so we persist just that one field (see `partialize`
// below) rather than the whole checkout flow.
function getWebStorage(): Storage | null {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return null;
  return globalThis.localStorage;
}

const secureStoreAdapter: StateStorage = {
  getItem: async (name) => {
    const webStorage = getWebStorage();
    if (webStorage) return webStorage.getItem(name);
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(name, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  },
  removeItem: async (name) => {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.removeItem(name);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Ignore storage failures.
    }
  },
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      selectedAddress: null,
      selectedPaymentMethod: "paystack",
      selectedDeliveryMethod: "Kwikpik delivery",
      lastOrderId: null,
      appliedCoupon: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
      setSelectedDeliveryMethod: (method) => set({ selectedDeliveryMethod: method }),
      setLastOrderId: (orderId) => set({ lastOrderId: orderId }),
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      resetCheckoutFlow: () =>
        set({
          selectedAddress: null,
          selectedPaymentMethod: "paystack",
          selectedDeliveryMethod: "Kwikpik delivery",
          lastOrderId: null,
          appliedCoupon: null,
        }),
    }),
    {
      name: "checkout-payment-method-v1",
      storage: createJSONStorage(() => secureStoreAdapter),
      partialize: (state) => ({ selectedPaymentMethod: state.selectedPaymentMethod }),
    },
  ),
);