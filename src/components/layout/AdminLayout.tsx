import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { useUIStore } from "../../store/uiStore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, isSidebarOpen, closeSidebar } = useUIStore();

  // Mesin Pemicu Dark Mode
  useEffect(() => {
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
  }, [theme]);

  return (
    // Tambahkan class transition dan dark mode dasar
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Overlay Gelap Mobile (Muncul jika sidebar terbuka) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden animate-in fade-in"
          onClick={closeSidebar} // Tutup sidebar jika overlay diklik
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Area Utama (Margin Kiri hilang di mobile) */}
      <div className="flex flex-col min-h-screen transition-all duration-300 lg:ml-65">
        <TopNavbar />

        <main className="flex-1 p-4 sm:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
