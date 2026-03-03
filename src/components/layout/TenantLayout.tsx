import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Receipt,
  MessageSquare,
  User,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BedDouble,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

// --- TIPE DATA NOTIFIKASI ---
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string;
  created_at: string;
}

export default function TenantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useUIStore();
  const { user, logout } = useAuthStore();

  const [activeDropdown, setActiveDropdown] = useState<
    "theme" | "notification" | null
  >(null);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  const navItems = [
    { name: "Beranda", path: "/tenant/dashboard", icon: Home },
    { name: "Katalog", path: "/tenant/rooms", icon: BedDouble },
    { name: "Tagihan", path: "/tenant/invoices", icon: Receipt },
    { name: "Komplain", path: "/tenant/tickets", icon: MessageSquare },
    { name: "Profil", path: "/tenant/profile", icon: User },
  ];

  // --- LOGIKA NOTIFIKASI ---
  const { data: notifications = [], isLoading: isLoadingNotifs } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const response = await api.get("/notifications/unread");
      return response.data.data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 60000, // Auto-refresh setiap 1 menit
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  const handleNotificationClick = (notif: Notification) => {
    markAsReadMutation.mutate(notif.id);
    if (notif.action_url && notif.action_url !== "#") {
      setActiveDropdown(null);
      navigate(notif.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        );
      case "warning":
        return (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
        );
      case "error":
        return (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400">
            <MessageSquare className="h-5 w-5" />
          </div>
        );
    }
  };

  const unreadCount = notifications.length;

  // --- LOGIKA UI (Theme & Dropdown) ---
  const handleThemeToggle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Tutup dropdown jika klik di luar desktop nav ATAU mobile header
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        mobileHeaderRef.current &&
        !mobileHeaderRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: "theme" | "notification") => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getShortName = (name: string) => {
    if (!name) return "Penghuni";
    if (name.includes("@")) return name.split("@")[0];
    const words = name.split(" ");
    return words.length > 1 && words[0].length <= 2
      ? `${words[0]} ${words[1]}`
      : words[0];
  };

  const displayName =
    user?.profile?.nickname ||
    getShortName(user?.profile?.full_name || user?.email || "");

  // --- KOMPONEN DROPDOWN NOTIFIKASI (Agar tidak perlu diketik 2x untuk Desktop & Mobile) ---
  const NotificationDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 animate-in fade-in slide-in-from-top-2 rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-900/50 dark:ring-slate-800 origin-top-right">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <span className="font-bold text-slate-800 dark:text-slate-100">
          Notifikasi
        </span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
            {unreadCount} baru
          </span>
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar">
        {isLoadingNotifs ? (
          <div className="flex h-32 flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-xs">Memuat notifikasi...</p>
          </div>
        ) : unreadCount === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-slate-400">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Belum ada notifikasi baru</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className="flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-800/50"
            >
              {getNotificationIcon(notif.type)}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {notif.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {notif.created_at}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 shrink-0"></div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveDropdown(null);
            navigate("/tenant/notifications"); // <-- Arahkan ke halaman notif tenant
          }}
          className="w-full rounded-xl py-2.5 text-center text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
        >
          Lihat semua notifikasi
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* =========================================
          DESKTOP TOP NAVBAR (Hidden on Mobile)
      ========================================= */}
      <nav
        ref={navRef}
        className="hidden md:flex fixed top-0 w-full h-16 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 items-center justify-between px-8 shadow-sm"
      >
        <div className="flex items-center gap-10">
          <div className="font-black text-xl tracking-tight text-primary-600 dark:text-primary-400">
            Sadewas<span className="text-slate-800 dark:text-white">Hub</span>
          </div>

          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 text-sm font-bold transition-all border-b-2 py-5 ${
                    isActive
                      ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleThemeToggle}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title={`Tema saat ini: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5" />
          </button>

          {/* NOTIFIKASI DESKTOP */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("notification")}
              className={`p-2 rounded-full transition-colors relative ${activeDropdown === "notification" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0f172a]"></span>
              )}
            </button>
            {activeDropdown === "notification" && <NotificationDropdown />}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Hai, {displayName}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl dark:hover:bg-red-500/10 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================
          MOBILE TOP HEADER (Hidden on Desktop)
      ========================================= */}
      <header
        ref={mobileHeaderRef}
        className="md:hidden fixed top-0 w-full h-14 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-5 shadow-sm"
      >
        <div className="font-black text-lg tracking-tight text-primary-600 dark:text-primary-400">
          Sadewas<span className="text-slate-800 dark:text-white">Hub</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleThemeToggle}
            className="p-2 text-slate-500 dark:text-slate-400 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <ThemeIcon className="w-5 h-5" />
          </button>

          {/* NOTIFIKASI MOBILE */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("notification")}
              className={`p-2 rounded-full transition-colors relative ${activeDropdown === "notification" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0f172a]"></span>
              )}
            </button>
            {activeDropdown === "notification" && <NotificationDropdown />}
          </div>
        </div>
      </header>

      {/* =========================================
          MAIN CONTENT AREA 
      ========================================= */}
      <main className="pt-16 md:pt-20 pb-24 md:pb-10 min-h-screen flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* =========================================
          MOBILE BOTTOM NAVIGATION (Hidden on Desktop)
      ========================================= */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 z-50 px-2 pt-2 pb-safe-bottom shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all ${
                  isActive
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <div
                  className={`px-4 py-1 rounded-full transition-colors duration-300 ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-500/10"
                      : "bg-transparent"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-80"}`}
                >
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
