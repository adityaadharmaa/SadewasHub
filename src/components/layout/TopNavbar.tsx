import { useState, useRef, useEffect } from "react";
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Bell,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  LogOut,
  User,
  Settings,
  Menu,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string;
  created_at: string;
}

export function TopNavbar() {
  const { user: authUser, logout } = useAuthStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeDropdown, setActiveDropdown] = useState<
    "theme" | "notification" | "profile" | null
  >(null);
  const navRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA CURRENT USER ---
  const { data: profileData } = useQuery({
    queryKey: ["authMeProfile"],
    queryFn: async () => {
      const response = await api.get("/profile/me");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const userData = profileData?.data?.user || authUser;
  const userRoles = profileData?.data?.roles || authUser?.roles || [];
  const primaryRole = userRoles.length > 0 ? userRoles[0] : "User";

  const displayName = userData?.profile?.full_name || userData?.email || "User";
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  // --- SOLUSI NAMA PANJANG: Ambil Nama Depan Saja ---
  const getShortName = (name: string) => {
    if (name.includes("@")) return name.split("@")[0];
    const words = name.split(" ");
    if (words.length > 1) {
      if (words[0].length <= 2) {
        return `${words[0]} ${words[1]}`;
      }
      return words[0];
    }
    return name;
  };

  const shortName = userData?.profile?.nickname || getShortName(displayName);

  // --- INTEGRASI API NOTIFIKASI ---
  const { data: notifications = [], isLoading: isLoadingNotifs } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const response = await api.get("/notifications/unread");
      return response.data.data as Notification[];
    },
    enabled: !!userData,
    refetchInterval: 60000,
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: "theme" | "notification" | "profile") => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const unreadCount = notifications.length;

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80"
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex w-96 items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/20 dark:bg-slate-800/80 dark:focus-within:bg-slate-900 dark:focus-within:ring-primary-500/30">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari data..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
          <div className="flex items-center rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
            ⌘K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* THEME DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("theme")}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${activeDropdown === "theme" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"}`}
          >
            <ThemeIcon className="h-5 w-5" />
          </button>
          {activeDropdown === "theme" && (
            <div className="absolute right-0 top-full mt-2 w-36 animate-in fade-in slide-in-from-top-2 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-900/50 dark:ring-slate-800">
              <button
                onClick={() => {
                  setTheme("light");
                  toggleDropdown("theme");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                onClick={() => {
                  setTheme("dark");
                  toggleDropdown("theme");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
              <button
                onClick={() => {
                  setTheme("system");
                  toggleDropdown("theme");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Monitor className="h-4 w-4" /> System
              </button>
            </div>
          )}
        </div>

        {/* NOTIFICATION DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("notification")}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${activeDropdown === "notification" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {activeDropdown === "notification" && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 animate-in fade-in slide-in-from-top-2 rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-900/50 dark:ring-slate-800">
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

              <div className="max-h-80 overflow-y-auto p-2">
                {isLoadingNotifs ? (
                  <div className="flex h-32 flex-col items-center justify-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <p className="text-xs">Memuat notifikasi...</p>
                  </div>
                ) : unreadCount === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-slate-400">
                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">
                      Belum ada notifikasi baru
                    </p>
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
                    navigate("/admin/notifications");
                  }}
                  className="w-full rounded-xl py-2.5 text-center text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
                >
                  Lihat semua notifikasi
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 dark:bg-slate-700 hidden sm:block"></div>

        {/* PROFILE DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("profile")}
            className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 font-bold text-white shadow-sm dark:bg-primary-500">
              {getInitials(displayName)}
            </div>
            <div className="hidden text-left sm:block">
              {/* DI SINI KITA PAKAI SHORT NAME AGAR TIDAK KEPANJANGAN */}
              <p className="text-xs font-bold text-slate-700 leading-none dark:text-slate-200 max-w-30 truncate">
                {shortName}
              </p>
              <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wide mt-0.5">
                {primaryRole}
              </p>
            </div>
          </button>

          {activeDropdown === "profile" && (
            <div className="absolute right-0 top-full mt-2 w-64 animate-in fade-in slide-in-from-top-2 rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-900/50 dark:ring-slate-800">
              <div className="border-b border-slate-100 px-3 py-3 mb-1 dark:border-slate-800">
                {/* DI DALAM MENU DROPDOWN, TETAP TAMPILKAN FULL NAME AGAR JELAS */}
                <p
                  className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate"
                  title={displayName}
                >
                  {displayName}
                </p>
                <p
                  className="text-xs font-medium text-slate-500 truncate dark:text-slate-400"
                  title={userData?.email}
                >
                  {userData?.email}
                </p>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    navigate("/admin/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <User className="h-4 w-4 text-slate-400" /> Profil Saya
                </button>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                  <Settings className="h-4 w-4 text-slate-400" /> Pengaturan
                </button>
              </div>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
