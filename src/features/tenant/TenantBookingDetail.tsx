import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import {
  ArrowLeft,
  CalendarDays,
  DoorOpen,
  MapPin,
  Clock,
  ShieldCheck,
  Receipt,
  AlertCircle,
  Loader2,
  Wallet,
} from "lucide-react";

export default function TenantBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- FETCH DATA DETAIL BOOKING ---
  const {
    data: bookingData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bookingDetail", id],
    queryFn: async () => {
      const res = await api.get(`/tenant/bookings/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Helper untuk format tanggal
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  // Helper untuk format mata uang
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // --- LOADING & ERROR STATES ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-sm font-bold text-slate-400 animate-pulse">
          Memuat detail sewa...
        </p>
      </div>
    );
  }

  if (isError || !bookingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Data Tidak Ditemukan
        </h2>
        <p className="text-slate-500 mt-2 max-w-sm mb-6">
          Maaf, kami tidak dapat menemukan detail penyewaan ini atau sesi Anda
          telah berakhir.
        </p>
        <button
          onClick={() => navigate("/tenant/dashboard")}
          className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const isPending = bookingData.status === "pending";

  // ==========================================
  // 🧮 KALKULATOR TRANSPARANSI BIAYA (REVERSE)
  // ==========================================
  const ADMIN_FEE_PERCENTAGE = 1.5;

  // 1. Total Tagihan Akhir (termasuk admin) dari Database
  const finalTotalAmount = Number(bookingData.total_amount) || 0;

  // 2. Diskon dari Database
  const discountAmount = Number(bookingData.discount_amount) || 0;

  // 3. Menghitung Mundur:
  // Jika Final = Base * 1.015, maka Base = Final / 1.015
  const priceAfterDiscount =
    finalTotalAmount / (1 + ADMIN_FEE_PERCENTAGE / 100);

  // 4. Biaya Admin Murni
  const adminFeeAmount = finalTotalAmount - priceAfterDiscount;

  // 5. Harga Sewa Kamar Asli (sebelum diskon & admin)
  const baseRoomPrice = priceAfterDiscount + discountAmount;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      {/* HEADER NAV */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={() => navigate("/tenant/dashboard")}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Detail Sewa Kamar
          </h1>
          <p className="text-xs font-bold text-slate-500">
            ID: {bookingData.id.split("-")[0].toUpperCase()}
          </p>
        </div>
      </div>

      {/* STATUS CARD */}
      <div
        className={`rounded-4xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-colors ${
          isPending
            ? "bg-linear-to-br from-indigo-500 to-purple-700 shadow-indigo-500/20"
            : "bg-linear-to-br from-primary-600 to-blue-800 shadow-primary-500/20"
        }`}
      >
        <div className="absolute -right-6 -top-6 opacity-10">
          <ShieldCheck className="h-48 w-48" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/20 mb-3">
              {isPending ? (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
              {bookingData.status === "confirmed"
                ? "Aktif & Berjalan"
                : bookingData.status}
            </span>
            <h2 className="text-3xl font-black mb-1">
              Kamar {bookingData.room?.room_number}
            </h2>
            <p className="text-white/80 font-medium flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4" /> Sadewas Coliving, Bali
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">
              {isPending ? "Batas Waktu Bayar" : "Sisa Waktu Sewa"}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-300" />
              <p className="text-lg font-bold text-white">
                {isPending
                  ? "Segera Lunasi"
                  : `Berakhir ${formatDate(bookingData.check_out_date)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RANGKUMAN TANGGAL & FASILITAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tanggal Sewa */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
              Periode Sewa
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mulai (Check-in)
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {formatDate(bookingData.check_in_date)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Selesai (Check-out)
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {formatDate(bookingData.check_out_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Kamar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <DoorOpen className="h-6 w-6" />
          </div>
          <div className="w-full">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
              Detail Kamar
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                <p className="text-xs font-bold text-slate-500">Tipe</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {bookingData.room?.type?.name || "-"}
                </p>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                <p className="text-xs font-bold text-slate-500">Kapasitas</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  1-2 Orang
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500">Status Bayar</p>
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                    isPending
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isPending ? "Belum Bayar" : "Lunas"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOTAL PEMBAYARAN DENGAN TRANSPARANSI BIAYA ADMIN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
            <Receipt className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Rincian Pembayaran
          </h3>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-3">
          {/* Harga Pokok */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500">
              Harga Sewa Kamar
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatRupiah(baseRoomPrice)}
            </p>
          </div>

          {/* Tampilkan diskon jika ada */}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600">
              <p className="text-sm font-medium">Potongan Promo</p>
              <p className="text-sm font-bold">
                -{formatRupiah(discountAmount)}
              </p>
            </div>
          )}

          {/* Biaya Admin Transparan */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500">
              Biaya Layanan Aplikasi ({ADMIN_FEE_PERCENTAGE}%)
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatRupiah(adminFeeAmount)}
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <p className="text-sm font-black text-slate-900 dark:text-white">
              Total Dibayar
            </p>
            <p className="text-xl font-black text-primary-600 dark:text-primary-400">
              {formatRupiah(finalTotalAmount)}
            </p>
          </div>
        </div>

        {/* Tombol Aksi Tambahan */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* JIKA STATUS PENDING, MUNCUL TOMBOL BAYAR KE XENDIT */}
          {isPending && bookingData.payments?.[0]?.checkout_url && (
            <button
              onClick={() =>
                window.open(bookingData.payments[0].checkout_url, "_blank")
              }
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] animate-pulse"
            >
              <Wallet className="h-5 w-5" /> Selesaikan Pembayaran via Xendit
            </button>
          )}

          {/* PESAN JIKA SUDAH LUNAS */}
          {!isPending && (
            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-4 rounded-xl flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-bold">
                Transaksi Lunas & Tercatat di Sistem
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
