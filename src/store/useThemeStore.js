import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system', // 'light' | 'dark' | 'system'
      setTheme: (theme) => set({ theme }),

      // 다음 테마로 순환 (light → dark → system → light)
      cycleTheme: () =>
        set((state) => {
          const next = { light: 'dark', dark: 'system', system: 'light' };
          return { theme: next[state.theme] };
        }),
    }),
    { name: 'crypto-dash-theme' },
  ),
);

export default useThemeStore;
