import { create } from "zustand";
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

export const useCheckoutStore = create<CheckoutState>((set) => ({
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
}));
