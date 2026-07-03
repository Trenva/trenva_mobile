import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { persistedStorage } from "../lib/storage/persisted-storage";
const MAX_RECENT_SEARCHES = 10;

type RecentSearchesState = {
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
};

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;
          const withoutDuplicate = state.recentSearches.filter(
            (existing) => existing.toLowerCase() !== trimmed.toLowerCase(),
          );
          return {
            recentSearches: [trimmed, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES),
          };
        }),
      removeRecentSearch: (query) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((existing) => existing !== query),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "recent-searches-v1",
      storage: createJSONStorage(() => persistedStorage),
    },
  ),
);