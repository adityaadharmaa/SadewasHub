import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import {
  Search,
  Wifi,
  Wind,
  BedDouble,
  Monitor,
  Lock,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Loader2,
  MailWarning,
  ShieldAlert,
} from "lucide-react";

interface RoomImage {
  id: string | number;
  url: string;
}
interface RoomType {
  id: string | number;
  name: string;
  price_per_month: number;
  price_formatted: string;
}
interface Room {
  id: string | number;
  room_number: string;
  status: string;
  type?: RoomType;
  images?: RoomImage[];
}

export default function RoomCatalogPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // --- FETCH DATA PROFILE REAL-TIME ---
  const { data: profileResponse } = useQuery({
    queryKey: ["authMeProfile"],
    queryFn: async () => {
      const response = await api.get("/profile/me");
      return response.data;
    },
  });

  const liveUser = profileResponse?.data?.user || user;

  // PENGECEKAN GANDA
  const isEmailVerified = !!liveUser?.email_verified_at;
  const isKtpVerified = liveUser?.profile?.is_verified;
  const canBook = isEmailVerified && isKtpVerified;

  // --- FETCH DATA KAMAR ---
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["tenantRooms"],
    queryFn: async () => {
      const response = await api.get("/tenant/rooms");
      return response.data;
    },
  });

  const roomsList: Room[] = Array.isArray(responseData?.data)
    ? responseData.data
    : [];

  const filteredRooms = roomsList.filter((room) => {
    const matchNumber = (room.room_number || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchType = (room.type?.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchNumber || matchType;
  });

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* HEADER & SEARCH */}
      <div className="pt-2 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Eksplorasi Kamar 🛏️
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Temukan kamar yang paling cocok untuk kenyamanan Anda.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor atau tipe kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b]/50 dark:text-white"
          />
        </div>
      </div>

      {/* ALERT JIKA EMAIL BELUM VERIFIED */}
      {!isEmailVerified && (
        <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-5 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <MailWarning className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                Email Harus Diverifikasi
              </h3>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-1 mb-3 leading-relaxed">
                Anda dapat melihat katalog kamar, tetapi pemesanan hanya terbuka
                jika email Anda sudah diverifikasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ALERT JIKA KTP BELUM VERIFIED (Muncul jika Email sudah aman tapi KTP belum) */}
      {isEmailVerified && !isKtpVerified && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-5 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Identitas KTP Diperlukan
              </h3>
              <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mt-1 mb-3 leading-relaxed">
                {liveUser?.profile?.ktp_path
                  ? "Admin sedang meninjau dokumen KTP Anda. Tombol pemesanan akan terbuka otomatis setelah disetujui."
                  : "Anda dapat melihat katalog kamar, tetapi pemesanan hanya terbuka untuk akun yang KTP-nya sudah diverifikasi."}
              </p>
              {!liveUser?.profile?.ktp_path && (
                <button
                  onClick={() => navigate("/tenant/profile")}
                  className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Verifikasi Akun Sekarang
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DAFTAR KAMAR */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
          <p className="font-bold text-sm">Memuat katalog kamar...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#1e293b]/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <BedDouble className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Kamar tidak ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Coba ubah kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const thumbnail =
              room.images && room.images.length > 0 ? room.images[0].url : null;

            return (
              <div
                key={room.id}
                className="group flex flex-col bg-white dark:bg-[#1e293b]/40 border border-slate-200/80 dark:border-slate-700/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`Kamar ${room.room_number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <BedDouble className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    {room.status === "available" ? (
                      <span className="bg-emerald-500/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Tersedia
                      </span>
                    ) : (
                      <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Terisi
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
                        {room.type?.name || "Kamar Reguler"}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
                        Kamar {room.room_number}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                    <MapPin className="h-3.5 w-3.5" /> Sadewas Coliving, Bali
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                      <Wind className="h-4 w-4" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                      <BedDouble className="h-4 w-4" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                      <Monitor className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Harga Sewa
                      </p>
                      <p className="text-base font-black text-primary-600 dark:text-primary-400">
                        {room.type?.price_formatted || "Rp 0"}{" "}
                        <span className="text-[10px] text-slate-500 font-medium">
                          / bln
                        </span>
                      </p>
                    </div>

                    <button
                      disabled={!canBook || room.status !== "available"}
                      onClick={() =>
                        navigate(`/tenant/bookings/create/${room.id}`)
                      }
                      className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
                        room.status !== "available"
                          ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                          : canBook
                            ? "bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 active:scale-95"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {!canBook ? (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Terkunci
                        </>
                      ) : room.status !== "available" ? (
                        "Penuh"
                      ) : (
                        <>
                          Pesan <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
