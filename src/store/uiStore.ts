import { create } from "zustand";

interface UIState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

// --- FUNGSI HELPER UNTUK MENGGANTI CLASS DI HTML ---
const applyThemeToDOM = (theme: "light" | "dark" | "system") => {
  if (typeof window === "undefined") return;

  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

// --- INISIALISASI TEMA SAAT APLIKASI PERTAMA KALI DIBUKA ---
const getInitialTheme = (): "light" | "dark" | "system" => {
  if (typeof window !== "undefined") {
    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system";
    if (storedTheme) {
      applyThemeToDOM(storedTheme);
      return storedTheme;
    }
    // Jika belum ada di local storage, gunakan system default
    applyThemeToDOM("system");
  }
  return "system";
};

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    applyThemeToDOM(theme); // <-- Langsung eksekusi perubahan warna di sini!
    set({ theme });
  },

  isSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));
