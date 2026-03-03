import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  User,
  DoorClosed,
  Loader2,
  AlertCircle,
  Eye,
  ArrowRight,
  FileText,
  X,
} from "lucide-react";
import api from "@/services/api";

// --- TYPES (Menyesuaikan dengan BookingResource) ---
interface Payment {
  id: string;
  external_id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
  checkout_url?: string;
  paid_at?: string;
}

interface Room {
  id: string;
  room_number: string;
  type?: {
    name: string;
  };
}

interface TenantUser {
  id: string;
  email: string;
  profile?: {
    full_name: string;
    phone_number: string;
  };
}

interface Booking {
  id: string;
  user: TenantUser;
  room: Room;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  discount_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payments?: Payment[]; // Karena bisa jadi array atau single resource di backend
  created_at: string;
}

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // --- FETCH DATA ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminBookings", page, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/admin/bookings`, {
        params: {
          search: searchTerm,
          status: statusFilter || undefined,
          per_page: 10,
          page,
        },
      });
      return response.data;
    },
  });

  // --- HELPER FORMAT CURRENCY ---
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- HELPER DATE FORMAT ---
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // --- HELPER STATUS BADGE ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> AKTIF
          </span>
        );
      case "pending":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> PENDING
          </span>
        );
      case "cancelled":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" /> BATAL
          </span>
        );
      default:
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status)
      return <span className="text-xs text-slate-400 italic">No Payment</span>;
    switch (status) {
      case "paid":
        return (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            LUNAS
          </span>
        );
      case "pending":
        return (
          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
            MENUNGGU DIBAYAR
          </span>
        );
      case "expired":
      case "failed":
        return (
          <span className="text-red-600 dark:text-red-400 font-bold text-xs">
            KADALUARSA / GAGAL
          </span>
        );
      default:
        return (
          <span className="text-slate-500 font-bold text-xs uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary-500" /> Data Booking
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Pantau seluruh transaksi pemesanan dan status perpanjangan kamar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-[#1e293b]">
            <button
              onClick={() => setStatusFilter("")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "" ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700/80 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "pending" ? "bg-white text-amber-600 shadow-sm dark:bg-slate-700/80 dark:text-amber-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("confirmed")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "confirmed" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700/80 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Aktif
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block dark:bg-slate-700"></div>
          <div className="relative flex w-full sm:w-56 items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* --- TABLE DATA --- */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/50 dark:bg-[#0f172a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700/80 dark:bg-[#1e293b]/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Transaksi & User</th>
                <th className="px-6 py-4 font-extrabold">Kamar</th>
                <th className="px-6 py-4 font-extrabold">Durasi Sewa</th>
                <th className="px-6 py-4 font-extrabold">Total & Pembayaran</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/80">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-3" />
                    Memuat data transaksi...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-red-500">
                    <AlertCircle className="mx-auto h-8 w-8 mb-3" />
                    Gagal memuat data.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">
                      Belum ada transaksi
                    </p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: Booking) => {
                  // Jika API mengirim relasi payments dalam array (hasMany)
                  const latestPayment = Array.isArray(item.payments)
                    ? item.payments[0]
                    : item.payments;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1e293b]/30"
                    >
                      {/* Kolom Transaksi & User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {item.user?.profile?.full_name || "Tanpa Nama"}
                              {getStatusBadge(item.status)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              ID: {item.id.substring(0, 8)}... •{" "}
                              {new Date(item.created_at).toLocaleDateString(
                                "id-ID",
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Kamar */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <DoorClosed className="h-4 w-4 text-slate-400" />
                            Kamar {item.room?.room_number || "-"}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.room?.type?.name || "Tipe Standar"}
                          </span>
                        </div>
                      </td>

                      {/* Kolom Durasi Sewa */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <span>{formatDate(item.check_in_date)}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(item.check_out_date)}</span>
                        </div>
                      </td>

                      {/* Kolom Pembayaran */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {formatRupiah(item.total_amount)}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-slate-400" />
                            {getPaymentStatusBadge(latestPayment?.status)}
                          </div>
                        </div>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedBooking(item)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && data?.meta && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/60 px-6 py-4 dark:border-slate-700/80">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Halaman {data.meta.current_page} dari {data.meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#1e293b]"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.meta.last_page}
                className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#1e293b]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DETAIL BOOKING --- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#0f172a] ring-1 ring-slate-100 dark:ring-slate-800 max-h-[95vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700/80 shrink-0">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  Detail Transaksi
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1 font-mono">
                  {selectedBooking.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-[#1e293b] dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                    Status Pemesanan
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                    Kamar Dipesan
                  </p>
                  <p className="font-extrabold text-lg text-slate-900 dark:text-white">
                    Kamar {selectedBooking.room?.room_number}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Nama Penyewa
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedBooking.user?.profile?.full_name ||
                      selectedBooking.user?.email ||
                      "Tanpa Nama"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Kontak (No. HP)
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedBooking.user?.profile?.phone_number || "-"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Durasi Hunian
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {formatDate(selectedBooking.check_in_date)} -{" "}
                    {formatDate(selectedBooking.check_out_date)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Diskon (Promo)
                  </span>
                  <span className="text-sm font-bold text-emerald-500">
                    - {formatRupiah(selectedBooking.discount_amount)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2">
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                    Total Tagihan
                  </span>
                  <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                    {formatRupiah(selectedBooking.total_amount)}
                  </span>
                </div>
              </div>

              {/* Detail Pembayaran Xendit */}
              {selectedBooking.payments &&
                (Array.isArray(selectedBooking.payments)
                  ? selectedBooking.payments.length > 0
                  : selectedBooking.payments) && (
                  <div className="mt-8 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 dark:bg-[#1e293b] px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Status Pembayaran (Gateway)
                      </h3>
                      {getPaymentStatusBadge(
                        Array.isArray(selectedBooking.payments)
                          ? selectedBooking.payments[0].status
                          : (selectedBooking.payments as any).status,
                      )}
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800/50 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500">
                          ID Invoice Xendit
                        </p>
                        <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                          {Array.isArray(selectedBooking.payments)
                            ? selectedBooking.payments[0].external_id
                            : (selectedBooking.payments as any).external_id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
