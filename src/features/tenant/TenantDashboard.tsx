import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ShieldAlert,
  DoorOpen,
  Clock,
  ArrowRight,
  Receipt,
  MessageSquare,
  Sparkles,
  Loader2,
  MailWarning,
  CalendarCheck,
  X,
  Copy,
  CheckCircle2,
  Wallet,
} from "lucide-react";

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // --- 1. FETCH DATA PROFILE REAL-TIME ---
  const { data: profileResponse } = useQuery({
    queryKey: ["authMeProfile"],
    queryFn: async () => {
      const response = await api.get("/profile/me");
      return response.data;
    },
  });

  const liveUser = profileResponse?.data?.user || user;
  const isEmailVerified = !!liveUser?.email_verified_at;
  const isKtpVerified = liveUser?.profile?.is_verified;
  const isFullyVerified = isEmailVerified && isKtpVerified;

  const nickname =
    liveUser?.profile?.nickname ||
    liveUser?.profile?.full_name?.split(" ")[0] ||
    "Penghuni";

  // --- 2. FETCH DATA BOOKING AKTIF ---
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ["myBookings"],
    queryFn: async () => {
      const response = await api.get("/tenant/bookings");
      return response.data;
    },
    enabled: !!isFullyVerified,
  });

  // --- 3. FETCH DATA PROMO AKTIF ---
  const { data: promosData } = useQuery({
    queryKey: ["activePromos"],
    queryFn: async () => {
      const response = await api.get("/tenant/promos/active");
      return response.data;
    },
    enabled: !!isFullyVerified,
  });

  const promos = promosData?.data || [];
  const bookingsList = bookingsData?.data || [];

  // --- PISAHKAN KAMAR AKTIF & TAGIHAN GANTUNG ---
  const activeBooking =
    bookingsList.find(
      (b: any) => b.status === "confirmed" || b.status === "occupied",
    ) || bookingsList[0];

  const pendingBooking = bookingsList.find((b: any) => b.status === "pending");

  // --- LOGIKA PERPANJANGAN DINAMIS (EXTEND) ---
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      rent_type: "monthly",
      duration: 1,
    },
  });

  const selectedRentType = watch("rent_type");
  const selectedDuration = watch("duration");

  const calculateDaysLeft = (checkOutDateString?: string) => {
    if (!checkOutDateString) return null;
    const today = new Date();
    const checkOut = new Date(checkOutDateString);
    const diffTime = checkOut.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(activeBooking?.check_out_date);
  const isNearExpiry = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isExpired = daysLeft !== null && daysLeft < 0;

  // --- FUNGSI MENGHITUNG ESTIMASI HARGA (DENGAN BIAYA ADMIN) ---
  const ADMIN_FEE = 5000; // Flat Fee Rp 5.000

  // 1. Ambil Subtotal Harga Kamar Saja
  const getSubTotal = () => {
    if (!activeBooking?.room?.type) return 0;
    const type = activeBooking.room.type;
    const duration = Number(selectedDuration) || 1;

    if (selectedRentType === "daily")
      return Number(type.price_per_day) * duration;
    if (selectedRentType === "weekly")
      return Number(type.price_per_week) * duration;
    if (selectedRentType === "monthly")
      return Number(type.price_per_month) * duration;
    return 0;
  };

  // 2. Ambil Total Keseluruhan (Termasuk Admin)
  const getEstimatedPrice = () => {
    const subTotal = getSubTotal();
    if (subTotal === 0) return 0;
    return subTotal + ADMIN_FEE;
  };

  const extendMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        rent_type: data.rent_type,
        duration: parseInt(data.duration),
      };
      const res = await api.post(
        `/tenant/bookings/${activeBooking.id}/extend`,
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Tagihan berhasil dibuat! Silakan lakukan pembayaran.");
      setIsExtendModalOpen(false);
      reset();

      const checkoutUrl = data?.data?.payments?.[0]?.checkout_url;
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      }

      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperpanjang sewa.");
    },
  });

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode ${code} berhasil disalin!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* SECTION 1: GREETING */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Halo, {nickname}! 👋
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Selamat datang di portal penghuni Sadewas Hub.
        </p>
      </div>

      {/* SECTION 2 & 3: ALERTS VERIFIKASI */}
      {!isEmailVerified && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600 shrink-0">
              <MailWarning className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900">
                Email Belum Diverifikasi
              </h3>
              <p className="text-xs font-medium text-blue-700 mt-1 leading-relaxed">
                Silakan cek kotak masuk email Anda ({liveUser?.email}) dan klik
                link verifikasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {isEmailVerified && !isKtpVerified && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Identitas KTP Belum Disetujui
              </h3>
              <p className="text-xs font-medium text-amber-700 mt-1 mb-3 leading-relaxed">
                {liveUser?.profile?.ktp_path
                  ? "Admin sedang meninjau dokumen KTP Anda."
                  : "Anda belum melengkapi profil & foto KTP."}
              </p>
              {!liveUser?.profile?.ktp_path && (
                <button
                  onClick={() => navigate("/tenant/profile")}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Lengkapi Profil
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: KARTU KAMAR AKTIF */}
      {isFullyVerified && (
        <section className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Kamar Saya
            </h2>
          </div>

          {loadingBookings ? (
            <div className="h-48 rounded-3xl border border-slate-200 flex flex-col items-center justify-center bg-slate-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-2" />
            </div>
          ) : activeBooking ? (
            <div
              className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 shadow-xl text-white transition-all ${
                isNearExpiry
                  ? "bg-linear-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
                  : isExpired
                    ? "bg-linear-to-br from-rose-500 to-red-700 shadow-rose-500/20"
                    : "bg-linear-to-br from-primary-600 via-primary-700 to-blue-800 shadow-primary-500/20"
              }`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <DoorOpen className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/80 text-[10px] font-black uppercase tracking-wider mb-1">
                      {isExpired ? "Masa Sewa Habis" : "Kamar Aktif"}
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-black">
                      Kamar {activeBooking.room?.room_number}
                    </h3>
                    <p className="text-white/90 text-sm font-medium mt-1">
                      {activeBooking.room?.type?.name}
                    </p>
                  </div>
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-white border border-white/20">
                    {activeBooking.status_label || activeBooking.status}
                  </span>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl">
                      <Clock className="h-5 w-5 text-white/90" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
                        {isExpired
                          ? "Berakhir Pada"
                          : isNearExpiry
                            ? `Sisa ${daysLeft} Hari!`
                            : "Batas Sewa"}
                      </p>
                      <p className="text-sm font-bold text-white">
                        {formatDate(activeBooking.check_out_date)}
                      </p>
                    </div>
                  </div>

                  {pendingBooking ? (
                    <button
                      onClick={() => navigate(`/tenant/invoices`)}
                      className="bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105 text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-lg animate-pulse flex items-center gap-1.5"
                    >
                      <Wallet className="h-3.5 w-3.5" /> Menunggu Pembayaran
                    </button>
                  ) : isNearExpiry || isExpired ? (
                    <button
                      onClick={() => setIsExtendModalOpen(true)}
                      className="bg-white text-slate-900 hover:scale-105 text-xs font-black px-4 py-2.5 rounded-xl transition-transform shadow-lg animate-pulse flex items-center gap-1.5"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" /> Perpanjang
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        navigate(`/tenant/bookings/${activeBooking.id}`)
                      }
                      className="bg-white text-primary-700 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      Lihat Detail
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-500 mb-4">
                <DoorOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Belum Ada Kamar
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto mb-6">
                Jelajahi pilihan kamar kami yang nyaman dan mulai pemesanan
                Anda.
              </p>
              <button
                onClick={() => navigate("/tenant/rooms")}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md"
              >
                Pesan Kamar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* SECTION 5: QUICK ACTIONS */}
      <section className="grid grid-cols-2 gap-4">
        <Link
          to="/tenant/invoices"
          className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-1 transition-all"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Receipt className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Tagihan
          </span>
        </Link>
        <Link
          to="/tenant/tickets"
          className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-1 transition-all"
        >
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <MessageSquare className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Komplain
          </span>
        </Link>
      </section>

      {/* --- SECTION 6: PROMO BANNER --- */}
      {isFullyVerified && promos.length > 0 && (
        <section className="pt-2 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Promo Spesial
              </h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 hidden sm:block">
              *Khusus pesan kamar baru
            </p>
          </div>

          <div className="flex overflow-x-auto gap-5 pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {promos.map((promo: any) => (
              <div
                key={promo.id}
                className="shrink-0 w-80 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all"
              >
                <div className="relative h-28 bg-linear-to-br from-amber-400 via-orange-500 to-rose-500 p-5 flex flex-col justify-between overflow-hidden">
                  <div className="absolute -right-4 -top-4 bg-white/20 h-24 w-24 rounded-full blur-xl"></div>
                  <span className="inline-flex self-start bg-black/20 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    ✨ Khusus Pesan Baru
                  </span>
                  <div className="flex items-end justify-between z-10">
                    <span className="bg-white text-orange-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                      {promo.code}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col grow">
                  <h4 className="font-black text-slate-900 dark:text-white text-base mb-1.5">
                    {promo.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {promo.description}
                  </p>

                  <button
                    onClick={() => handleCopyCode(promo.code)}
                    className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      copiedCode === promo.code
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Salin Kode Promo
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL PERPANJANG SEWA DENGAN KALKULATOR HARGA BARU */}
      {isExtendModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsExtendModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-4xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Perpanjang Kamar {activeBooking.room?.room_number}
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Masa sewa berakhir:{" "}
                  <span className="text-rose-500 font-black">
                    {formatDate(activeBooking.check_out_date)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((data) => extendMutation.mutate(data))}
              className="p-6 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Jenis Paket
                  </label>
                  <select
                    {...register("rent_type", { required: true })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3.5 text-sm font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Lama Sewa
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={
                        selectedRentType === "daily"
                          ? 30
                          : selectedRentType === "weekly"
                            ? 4
                            : 12
                      }
                      {...register("duration", { required: true, min: 1 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3.5 text-sm font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-center"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {selectedRentType === "daily"
                        ? "Hari"
                        : selectedRentType === "weekly"
                          ? "Minggu"
                          : "Bulan"}
                    </span>
                  </div>
                </div>
              </div>

              {/* TAMPILAN RINCIAN HARGA BARU */}
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl">
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                    *Harga mengikuti tipe kamar{" "}
                    <b>{activeBooking.room?.type?.name}</b>. <br />
                    <span className="text-rose-500 font-bold">
                      *Kode promo tidak berlaku untuk perpanjangan sewa.
                    </span>
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  {/* Harga Pokok */}
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Harga Sewa Kamar:</span>
                    <span>{formatRupiah(getSubTotal())}</span>
                  </div>

                  {/* Biaya Admin Transparan */}
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                    <span>Biaya Layanan Aplikasi:</span>
                    <span>{formatRupiah(ADMIN_FEE)}</span>
                  </div>

                  {/* Total Tagihan */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Total Tagihan:
                    </span>
                    <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                      {formatRupiah(getEstimatedPrice())}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={extendMutation.isPending || getSubTotal() === 0}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {extendMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Buat Tagihan Pembayaran"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
