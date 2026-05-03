import { create } from "zustand";

export type ProductSort = "relevance" | "top_sales" | "most_recent" | "popular" | "price_asc" | "price_desc";

export type ProductFilters = {
  query: string;
  category: string;
  subcategory: string;
  leveltwo: string;
  color: string;
  review: string;
  location: string;
  resolution: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: ProductSort;
};

type ProductFilterState = ProductFilters & {
  setFilters: (updates: Partial<ProductFilters>) => void;
  resetFilters: () => void;
};

const defaults: ProductFilters = {
  query: "",
  category: "",
  subcategory: "",
  leveltwo: "",
  color: "",
  review: "",
  location: "",
  resolution: "",
  minPrice: null,
  maxPrice: null,
  sort: "relevance",
};

export const useProductFilterStore = create<ProductFilterState>((set) => ({
  ...defaults,
  setFilters: (updates) => set((state) => ({ ...state, ...updates })),
  resetFilters: () => set({ ...defaults }),
}));
