import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ShieldCheck,
  Info,
  Loader2,
  BedDouble,
  CreditCard,
  MapPin,
  Receipt,
  Tag,
} from "lucide-react";

export default function BookingCreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // --- FORM STATE ---
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      check_in_date: new Date().toISOString().split("T")[0],
      rent_type: "monthly", // Default bulanan
      duration: 1, // Angka durasi (berlaku untuk hari/minggu/bulan)
      promo_code: "",
      notes: "",
    },
  });

  const rentType = watch("rent_type");
  const duration = watch("duration");

  // --- FETCH DETAIL KAMAR ---
  const {
    data: roomData,
    isLoading: loadingRoom,
    isError,
  } = useQuery({
    queryKey: ["tenantRoomDetail", id],
    queryFn: async () => {
      const response = await api.get(`/tenant/rooms/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // --- MUTASI UNTUK CREATE BOOKING ---
  const bookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/tenant/bookings", {
        room_id: id,
        ...payload,
      });
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Pemesanan berhasil dibuat!");
      navigate("/tenant/invoices");
    },
    onError: (error: any) => {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        Object.values(validationErrors).forEach((err: any) =>
          toast.error(err[0]),
        );
      } else {
        toast.error(
          error.response?.data?.message || "Gagal membuat pemesanan.",
        );
      }
    },
  });

  // --- HELPER KALKULASI & FORMAT ---
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // --- 1. KONSTANTA BIAYA ADMIN FLAT ---
  const ADMIN_FEE = 5000;

  // 2. Tentukan harga satuan berdasarkan pilihan rent_type
  const basePrice = useMemo(() => {
    if (!roomData?.type) return 0;
    if (rentType === "daily") return Number(roomData.type.price_per_day) || 0;
    if (rentType === "weekly") return Number(roomData.type.price_per_week) || 0;
    return Number(roomData.type.price_per_month) || 0;
  }, [roomData, rentType]);

  // 3. Kalkulasi Subtotal (Harga Pokok Kamar)
  const subTotalPrice = useMemo(() => {
    return basePrice * (Number(duration) || 1);
  }, [basePrice, duration]);

  // 4. Total Akhir (Sudah termasuk Admin Fee Flat Rp 5.000)
  const finalTotalPrice = useMemo(() => {
    // Jika user belum pilih durasi/tipe dengan benar dan harganya masih 0, jgn tambahkan admin fee
    if (subTotalPrice === 0) return 0;
    return subTotalPrice + ADMIN_FEE;
  }, [subTotalPrice]);

  // Label untuk UI
  const rentTypeLabel =
    rentType === "daily" ? "Hari" : rentType === "weekly" ? "Minggu" : "Bulan";

  const thumbnail =
    roomData?.images && roomData.images.length > 0
      ? roomData.images[0].url
      : null;

  // --- SUBMIT HANDLER ---
  const onSubmit = (data: any) => {
    const payload: any = {
      check_in_date: data.check_in_date,
      rent_type: data.rent_type,
      duration: Number(data.duration),
    };

    if (data.promo_code && data.promo_code.trim() !== "") {
      payload.promo_code = data.promo_code.trim().toUpperCase();
    }

    if (data.notes && data.notes.trim() !== "") {
      payload.notes = data.notes.trim();
    }

    bookingMutation.mutate(payload);
  };

  if (loadingRoom) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="font-bold">Menyiapkan halaman pemesanan...</p>
      </div>
    );
  }

  if (isError || !roomData) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
          <Info className="h-8 w-8" />
        </div>
        <p className="font-bold text-slate-800 dark:text-slate-200">
          Kamar tidak ditemukan.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm font-bold text-primary-600 hover:underline"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-10 animate-fade-in max-w-5xl mx-auto">
      {/* HEADER NAVIGASI */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Konfirmasi Pesanan
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Lengkapi detail untuk mengamankan kamar Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: FORM CHECKOUT */}
        <div className="lg:col-span-2 space-y-6">
          <form
            id="booking-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* BOX 1: DATA PEMESAN */}
            <div className="rounded-[24px] bg-white dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-500" /> Data
                Pemesan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Lengkap
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {user?.profile?.full_name}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email (Akun)
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* BOX 2: DETAIL WAKTU */}
            <div className="rounded-[24px] bg-white dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-500" /> Detail Sewa
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <CalendarDays className="h-4 w-4" /> Tanggal Masuk
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    {...register("check_in_date", {
                      required: "Tanggal check-in wajib diisi",
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b] [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  {errors.check_in_date && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(errors.check_in_date.message)}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tipe Sewa
                  </label>
                  <select
                    {...register("rent_type")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Durasi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={
                        rentType === "monthly"
                          ? 24
                          : rentType === "weekly"
                            ? 52
                            : 365
                      }
                      placeholder="1"
                      {...register("duration", {
                        required: "Durasi wajib diisi",
                        min: { value: 1, message: "Minimal durasi 1" },
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none bg-slate-50 dark:bg-[#0f172a] pl-1">
                      {rentTypeLabel}
                    </span>
                  </div>
                  {errors.duration && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(errors.duration.message)}
                    </p>
                  )}
                </div>
              </div>

              {/* CATATAN TAMBAHAN */}
              <div className="mt-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  {...register("notes")}
                  placeholder="Misal: Perkiraan jam kedatangan, permintaan khusus..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b] custom-scrollbar"
                />
              </div>

              {/* INPUT PROMO */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Tag className="h-4 w-4" /> Kode Promo (Opsional)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Masukkan kode promo jika ada..."
                    {...register("promo_code")}
                    className="w-full uppercase rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Diskon akan dihitung secara otomatis pada rincian tagihan
                  setelah pesanan dibuat.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* KOLOM KANAN: RINGKASAN & PEMBAYARAN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[24px] bg-white dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm sticky top-24">
            <div className="h-40 bg-slate-100 dark:bg-slate-800 relative">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Kamar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <BedDouble className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-5">
                <span className="text-[10px] font-black text-white/80 uppercase tracking-wider mb-1">
                  {roomData?.type?.name || "Kamar Reguler"}
                </span>
                <h3 className="text-xl font-black text-white">
                  Kamar {roomData?.room_number}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                <MapPin className="h-4 w-4" /> Sadewas Coliving, Bali
              </div>

              {/* Rincian Harga */}
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary-500" /> Rincian Biaya
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Harga Sewa Kamar</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {subTotalPrice > 0 ? formatRupiah(subTotalPrice) : "-"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Durasi Sewa</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {duration || 1} {rentTypeLabel}
                  </span>
                </div>

                {/* --- BIAYA ADMIN TRANSPARAN FLAT --- */}
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pb-3 border-b border-dashed border-slate-200 dark:border-slate-700">
                  <span>Biaya Layanan Aplikasi</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatRupiah(ADMIN_FEE)}
                  </span>
                </div>
              </div>

              <div className="my-5 pt-2 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Tagihan
                </span>
                <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                  {formatRupiah(finalTotalPrice)}
                </span>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl flex items-start gap-2 mb-6">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                  Klik tombol di bawah ini untuk membuat Invoice. Jika Anda
                  memasukkan Kode Promo, diskon akan langsung memotong tagihan
                  Anda.
                </p>
              </div>

              <button
                type="submit"
                form="booking-form"
                disabled={bookingMutation.isPending || basePrice === 0}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-500/25"
              >
                {bookingMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" /> Buat Tagihan Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
