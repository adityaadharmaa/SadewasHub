import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  Clock,
  MailOpen,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

// --- TYPES (Disesuaikan 100% dengan NotificationController Anda) ---
interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string;
  is_read?: boolean; // Dikirim oleh fungsi index()
  created_at_humans?: string; // Dikirim oleh fungsi index()
  created_at: string; // Bisa berisi ISO String atau diffForHumans (dari fungsi unread())
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);

  // --- FETCH DATA ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", filter, page],
    queryFn: async () => {
      const endpoint =
        filter === "unread" ? `/notifications/unread` : `/notifications`;
      const response = await api.get(endpoint, {
        params: { page, perPage: 10 },
      });
      return response.data;
    },
  });

  // --- MUTATION: TANDAI DIBACA ---
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Gagal menandai notifikasi.");
    },
  });

  // --- SMART DATA EXTRACTOR ---
  let notificationsList: AppNotification[] = [];
  if (Array.isArray(data)) {
    notificationsList = data;
  } else if (Array.isArray(data?.data?.data)) {
    notificationsList = data.data.data;
  } else if (Array.isArray(data?.data)) {
    notificationsList = data.data;
  }

  const meta = data?.meta || data?.data || data;

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary-500" /> Pusat Notifikasi
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Pantau semua aktivitas, pemberitahuan sistem, dan peringatan di
            Sadewas Hub.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-[#1e293b]">
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${filter === "all" ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700/80 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >
            Semua Notifikasi
          </button>
          <button
            onClick={() => {
              setFilter("unread");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all ${filter === "unread" ? "bg-white text-primary-600 shadow-sm dark:bg-slate-700/80 dark:text-primary-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >
            Belum Dibaca
            {filter !== "unread" && (
              <span className="h-2 w-2 rounded-full bg-primary-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* --- NOTIFICATION LIST --- */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/60 dark:border-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
            <p className="font-medium">Memuat notifikasi...</p>
          </div>
        )}

        {isError && (
          <div className="py-12 flex flex-col items-center justify-center text-red-500 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/60 dark:border-slate-800">
            <AlertCircle className="h-8 w-8 mb-3" />
            <p className="font-medium">Gagal mengambil data notifikasi.</p>
          </div>
        )}

        {!isLoading && !isError && notificationsList.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/60 dark:border-slate-800">
            <div className="h-16 w-16 bg-slate-100 dark:bg-[#1e293b] rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
              Tidak ada notifikasi
            </p>
            <p className="text-sm mt-1">Anda sudah membaca semuanya!</p>
          </div>
        ) : (
          notificationsList.map((notification: AppNotification) => {
            // Karena fungsi /unread tidak mengirim is_read, kita asumsikan jika filter === 'unread', maka isUnread = true
            // Jika filter === 'all', kita pakai data boolean is_read dari backend
            const isUnread =
              filter === "unread" ? true : notification.is_read === false;

            return (
              <div
                key={notification.id}
                className={`group relative flex flex-col sm:flex-row gap-4 sm:items-center justify-between rounded-2xl border p-5 transition-all ${
                  isUnread
                    ? "border-primary-100 bg-primary-50/50 dark:border-primary-900/30 dark:bg-primary-500/5"
                    : "border-slate-200/60 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-[#0f172a] dark:hover:bg-[#1e293b]/50"
                }`}
              >
                {/* Indikator Unread (Garis Kiri) */}
                {isUnread && (
                  <div className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-primary-500"></div>
                )}

                <div className="flex items-start gap-4">
                  {/* Ikon Lingkaran */}
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isUnread
                        ? "bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isUnread ? (
                      <Bell className="h-5 w-5" />
                    ) : (
                      <MailOpen className="h-5 w-5" />
                    )}
                  </div>

                  {/* Konten Text */}
                  <div>
                    {/* BACA LANGSUNG DARI notification.title bukan notification.data.title */}
                    <h3
                      className={`text-base font-bold ${isUnread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      {notification.title || "Notifikasi"}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                      {notification.message || "Tidak ada detail pesan."}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock className="h-3 w-3" />
                      {/* BACA DARI created_at_humans ATAU created_at */}
                      {notification.created_at_humans ||
                        notification.created_at}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex shrink-0 items-center justify-end sm:flex-col sm:items-end gap-2 mt-4 sm:mt-0 ml-14 sm:ml-0">
                  {isUnread ? (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-primary-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:bg-slate-800 dark:text-primary-400 dark:ring-slate-700 dark:hover:bg-slate-700"
                    >
                      {markAsReadMutation.isPending &&
                      markAsReadMutation.variables === notification.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Tandai Dibaca
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Sudah Dibaca
                    </span>
                  )}

                  {/* BACA LANGSUNG DARI notification.action_url */}
                  {notification.action_url &&
                    notification.action_url !== "#" && (
                      <a
                        href={notification.action_url}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mt-2"
                      >
                        <Info className="h-3.5 w-3.5" /> Lihat Detail
                      </a>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- PAGINATION --- */}
      {!isLoading && meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Halaman {meta.current_page} dari {meta.last_page}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.last_page}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
