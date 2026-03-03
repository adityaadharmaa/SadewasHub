import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Search,
  LifeBuoy,
  AlertCircle,
  Loader2,
  X,
  Eye,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  DoorClosed,
  User,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../services/api";

// --- TYPES (Menyesuaikan dengan TicketResource) ---
interface Ticket {
  id: string | number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  photo_url: string | null;
  admin_note: string | null;
  room?: {
    id: string | number;
    room_number: string;
  };
  user?: {
    id: string | number;
    email: string;
    profile?: {
      full_name: string;
      phone_number: string;
    };
  };
  created_at_humans: string;
  created_at: string;
}

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // State untuk Modal Form (Tanggapan Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Form Handle Tanggapan
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // --- FETCH DATA (Daftar Tiket) ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminTickets", page, searchTerm, statusFilter, priorityFilter],
    queryFn: async () => {
      const response = await api.get(`/admin/tickets`, {
        params: {
          search: searchTerm,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          per_page: 10,
          page,
        },
      });
      return response.data;
    },
  });

  // --- MUTATION: RESPON TIKET ---
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: any;
    }) => {
      // Endpoint Admin untuk update tiket
      const res = await api.put(`/admin/tickets/${id}`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Tanggapan tiket berhasil dikirim!");
      setIsModalOpen(false);
      setSelectedTicket(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal memproses tanggapan.",
      );
    },
  });

  // --- HANDLERS ---
  const openModalForRespond = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // Masukkan data lama jika admin ingin mengubah catatannya lagi
    reset({
      status: ticket.status,
      admin_note: ticket.admin_note || "",
    });
    setIsModalOpen(true);
  };

  const onSubmitResponse = (formData: any) => {
    if (!selectedTicket) return;
    updateMutation.mutate({ id: selectedTicket.id, payload: formData });
  };

  // --- HELPER BADGE STATUS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
            <Clock className="h-3.5 w-3.5" /> MENUNGGU PROSES
          </span>
        );
      case "in_progress":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> SEDANG DIPROSES
          </span>
        );
      case "resolved":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> SELESAI
          </span>
        );
      case "rejected":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" /> DITOLAK
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // --- HELPER BADGE PRIORITAS ---
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return (
          <span className="text-[11px] font-bold text-slate-500">Rendah</span>
        );
      case "medium":
        return (
          <span className="text-[11px] font-bold text-blue-500">Sedang</span>
        );
      case "high":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
            <AlertTriangle className="h-3 w-3" /> Tinggi
          </span>
        );
      case "urgent":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 animate-pulse">
            <AlertTriangle className="h-3 w-3" /> URGENT!
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  // Trik URL Fallback (jika di-hosting terpisah)
  const getFullImageUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    const baseUrl =
      api.defaults.baseURL?.replace("/api/v1", "") || "http://localhost:8000";
    return `${baseUrl}${url}`;
  };

  let ticketsList: Ticket[] = [];
  if (Array.isArray(data?.data)) ticketsList = data.data;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary-500" /> Tiket Bantuan
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Pantau laporan masalah, komplain, dan permintaan bantuan dari
            penghuni.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-8 text-sm font-bold text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-slate-200"
          >
            <option value="">Semua Status</option>
            <option value="open">Menunggu Proses</option>
            <option value="in_progress">Sedang Diproses</option>
            <option value="resolved">Selesai</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-8 text-sm font-bold text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-slate-200"
          >
            <option value="">Semua Prioritas</option>
            <option value="urgent">Urgent</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>
        </div>
      </div>

      {/* --- TICKET GRID (Bentuk Card ala Trello/Kanban lebih modern) --- */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/60 dark:border-slate-700/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
          <p className="font-medium">Memuat tiket komplain...</p>
        </div>
      ) : isError ? (
        <div className="py-20 flex flex-col items-center justify-center text-red-500 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/60 dark:border-slate-700/50">
          <AlertCircle className="h-8 w-8 mb-3" />
          <p className="font-medium">Gagal mengambil data tiket.</p>
        </div>
      ) : ticketsList.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/60 dark:border-slate-700/50">
          <LifeBuoy className="h-12 w-12 opacity-50 mb-3" />
          <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
            Kosong, Hore!
          </p>
          <p className="text-sm mt-1">
            Tidak ada komplain dari penghuni saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ticketsList.map((ticket: Ticket) => (
            <div
              key={ticket.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700/80 dark:bg-[#1e293b]/50"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>

                <h3
                  className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 mb-1"
                  title={ticket.title}
                >
                  {ticket.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {ticket.description}
                </p>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {ticket.user?.profile?.full_name ||
                        ticket.user?.email ||
                        "Tanpa Nama"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">
                      Kamar {ticket.room?.room_number || "?"} •{" "}
                      {ticket.created_at_humans}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-[#0f172a] p-3 flex justify-between items-center">
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {ticket.id}
                </span>
                <button
                  onClick={() => openModalForRespond(ticket)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  <Eye className="h-4 w-4" /> Lihat & Respon
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PAGINATION --- */}
      {!isLoading && data?.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/80">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Halaman {data.meta.current_page} dari {data.meta.last_page}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#1e293b]"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === data.meta.last_page}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#1e293b]"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL RESPON TIKET --- */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-[#0f172a] ring-1 ring-slate-100 dark:ring-slate-800 max-h-[95vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700/80 shrink-0 bg-slate-50/50 dark:bg-[#1e293b]/30">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary-500" />
                  Detail Laporan (Tiket #{selectedTicket.id})
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-[#1e293b] dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- KOLOM KIRI: INFO TIKET & FOTO --- */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Info Pelapor
                      </span>
                      <span className="text-xs font-bold bg-slate-100 dark:bg-[#1e293b] px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                        Kamar {selectedTicket.room?.room_number}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                      {selectedTicket.user?.profile?.full_name ||
                        selectedTicket.user?.email}
                    </p>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5" /> Dilaporkan{" "}
                      {selectedTicket.created_at_humans}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-extrabold text-slate-900 dark:text-white mb-2">
                      {selectedTicket.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                      Foto / Bukti Lampiran
                    </span>
                    {selectedTicket.photo_url ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                        <img
                          src={getFullImageUrl(selectedTicket.photo_url)}
                          alt={`Bukti ${selectedTicket.title}`}
                          className="w-full h-auto max-h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.innerHTML =
                              '<div class="text-center text-slate-400 p-4"><p class="text-sm">Gambar tidak dapat dimuat</p></div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-slate-400 dark:border-slate-700 dark:bg-[#1e293b]">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-xs font-medium">
                          Penghuni tidak melampirkan foto
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- KOLOM KANAN: FORM TANGGAPAN ADMIN --- */}
                <form
                  id="respondForm"
                  onSubmit={handleSubmit(onSubmitResponse)}
                  className="flex flex-col h-full bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/80"
                >
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-5">
                    Tindak Lanjut Admin
                  </h3>

                  <div className="space-y-5 flex-1">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
                        Update Status Tiket
                      </label>
                      <select
                        {...register("status")}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white"
                      >
                        <option value="open">Menunggu Proses (Open)</option>
                        <option value="in_progress">
                          Sedang Ditangani Tukang/Staf (In Progress)
                        </option>
                        <option value="resolved">
                          Masalah Selesai (Resolved)
                        </option>
                        <option value="rejected">
                          Tolak Laporan (Rejected)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
                        Catatan Balasan ke Penghuni{" "}
                        <span className="text-slate-400 font-normal">
                          (Opsional)
                        </span>
                      </label>
                      <textarea
                        {...register("admin_note")}
                        rows={6}
                        placeholder="Contoh: Baik pak, tukang AC akan datang jam 3 sore ini..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-200 custom-scrollbar"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="submit"
                      form="respondForm"
                      disabled={updateMutation.isPending}
                      className="w-full flex justify-center items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      Kirim Tanggapan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
