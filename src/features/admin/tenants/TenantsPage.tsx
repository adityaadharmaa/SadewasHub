import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileWarning,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Image as ImageIcon,
  Lock, // Tambahkan icon Lock
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

// --- KOMPONEN KHUSUS GAMBAR PRIVATE ---
const PrivateImage = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // 🌟 PERBAIKAN 1: BYPASS UNTUK FOTO GOOGLE / URL PUBLIK 🌟
        // Jika src adalah URL (http) dan BUKAN folder rahasia ktp_images,
        // langsung pakai src-nya. JANGAN gunakan Axios!
        if (src.startsWith("http") && !src.includes("ktp_images")) {
          setImgSrc(src);
          setLoading(false);
          return;
        }

        let endpoint = src;

        // 🌟 PERBAIKAN 2: PENCARIAN KTP LEBIH FLEKSIBEL 🌟
        if (src.includes("ktp_images")) {
          const filename = src.split("/").pop();
          endpoint = `/profile/ktp/${filename}`;
        }

        const response = await api.get(endpoint, { responseType: "blob" });

        objectUrl = URL.createObjectURL(response.data);
        setImgSrc(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error("Gagal memuat gambar private:", err);
        setError(true);
        setLoading(false);
      }
    };

    if (src) fetchImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-[#1e293b] text-slate-400 animate-pulse ${className} min-h-[200px]`}
      >
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <span className="text-xs font-medium">Mendekripsi KTP...</span>
      </div>
    );
  }

  if (error || !imgSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 text-slate-400 ${className} min-h-[200px]`}
      >
        <ShieldAlert className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-sm font-medium">
          Akses KTP Ditolak / Tidak Ditemukan
        </p>
      </div>
    );
  }

  return <img src={imgSrc} alt={alt} className={className} />;
};

// --- TYPES ---
interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  profile: {
    id: string;
    nik: string | null;
    address: string | null;
    ktp_url: string | null;
    admin_note: string | null;
  } | null;
  joined_human: string;
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // --- 1. FETCH DATA CURRENT USER (Untuk Cek Permission) ---
  const { data: currentUserData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const response = await api.get("/profile/me");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 menit agar tidak membebani server
  });

  // Cek apakah user yang login punya permission 'verify-ktp'
  const hasVerifyPermission =
    currentUserData?.data?.permissions?.includes("verify-ktp");

  // --- FETCH DATA TENANTS ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenants", page, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/admin/tenants`, {
        params: {
          search: searchTerm,
          status: statusFilter || undefined,
          perPage: 10,
          page,
        },
      });
      return response.data;
    },
  });

  // --- MUTATION VERIFIKASI ---
  const verifyMutation = useMutation({
    mutationFn: async ({
      profileId,
      status,
    }: {
      profileId: string;
      status: "verified" | "rejected";
    }) => {
      const res = await api.post(`/admin/verify-profile/${profileId}`, {
        is_verified: status === "verified",
        admin_note:
          status === "rejected"
            ? "KTP tidak valid, buram, atau tidak sesuai."
            : "Verifikasi Sukses",
      });
      return res.data;
    },
    onSuccess: (res, variables) => {
      const actionTxt =
        variables.status === "verified" ? "diverifikasi" : "ditolak";
      toast.success(`Profil penghuni berhasil ${actionTxt}!`);
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal memproses verifikasi.",
      );
    },
  });

  // --- HELPER BADGE STATUS ---
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
          </span>
        );
      case "pending":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Menunggu Review
          </span>
        );
      case "rejected":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
            <FileWarning className="h-3.5 w-3.5" /> Belum Upload KTP
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
            <Users className="h-6 w-6 text-primary-500" /> Data Penghuni
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola data akun penyewa, informasi kontak, dan verifikasi identitas
            (KTP).
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setStatusFilter("")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "" ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "pending" ? "bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Perlu Review
            </button>
            <button
              onClick={() => setStatusFilter("verified")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "verified" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Verified
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block dark:bg-slate-700"></div>
          <div className="relative flex w-full sm:w-56 items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Informasi Penghuni</th>
                <th className="px-6 py-4 font-extrabold">Kontak</th>
                <th className="px-6 py-4 font-extrabold">Status KTP</th>
                <th className="px-6 py-4 font-extrabold">Bergabung</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-2" />
                    Memuat data penghuni...
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center font-medium text-slate-500"
                  >
                    Belum ada data penghuni yang sesuai.
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: Tenant) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {item.phone || (
                        <span className="text-slate-400 italic text-xs">
                          Belum diisi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.verification_status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {item.joined_human}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.profile &&
                        item.verification_status !== "unverified" && (
                          <button
                            onClick={() => setSelectedTenant(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20"
                          >
                            <Eye className="h-3.5 w-3.5" /> Review
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && data?.meta && (
          <div className="flex items-center justify-between border-t border-slate-200/60 px-6 py-4 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Halaman {data.meta.current_page} dari {data.meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.meta.last_page}
                className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL REVIEW KTP --- */}
      {selectedTenant && selectedTenant.profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-[#0f172a] ring-1 ring-slate-100 dark:ring-slate-800 max-h-[95vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary-500" />
                  Review Identitas Penghuni
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {selectedTenant.name} ({selectedTenant.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- KTP IMAGE VIEWER --- */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dokumen KTP
                  </label>
                  {selectedTenant.profile.ktp_url ? (
                    <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1e293b] p-2">
                      <PrivateImage
                        src={selectedTenant.profile.ktp_url}
                        alt={`KTP ${selectedTenant.name}`}
                        className="w-full h-auto object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-slate-400 dark:border-slate-700 dark:bg-[#1e293b]">
                      <ShieldAlert className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm font-medium">Belum Upload KTP</p>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Status Saat Ini
                    </label>
                    {getStatusBadge(selectedTenant.verification_status)}

                    {selectedTenant.verification_status === "rejected" &&
                      selectedTenant.profile.admin_note && (
                        <p className="mt-2 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-100 dark:border-red-500/20">
                          <span className="font-bold">Catatan Admin:</span>{" "}
                          {selectedTenant.profile.admin_note}
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <div className="font-mono text-lg font-bold text-slate-900 dark:text-white tracking-widest bg-slate-100 dark:bg-[#1e293b] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      {selectedTenant.profile.nik || "-"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Alamat Sesuai KTP
                    </label>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-100 dark:border-slate-700/80 leading-relaxed">
                      {selectedTenant.profile.address || (
                        <span className="italic opacity-70">
                          Belum mengisi alamat.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <button
                onClick={() => setSelectedTenant(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Tutup
              </button>

              {/* --- 2. PENGECEKAN PERMISSION DI SINI --- */}
              {selectedTenant.verification_status === "pending" && (
                <>
                  {hasVerifyPermission ? (
                    <>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Yakin ingin menolak KTP penghuni ini?",
                            )
                          ) {
                            verifyMutation.mutate({
                              profileId: selectedTenant.profile!.id,
                              status: "rejected",
                            });
                          }
                        }}
                        disabled={verifyMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-red-100 px-5 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> Tolak KTP
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "KTP sudah sesuai? Verifikasi penghuni sekarang?",
                            )
                          ) {
                            verifyMutation.mutate({
                              profileId: selectedTenant.profile!.id,
                              status: "verified",
                            });
                          }
                        }}
                        disabled={verifyMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                      >
                        {verifyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Verifikasi Sah
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Lock className="h-4 w-4" /> Tidak Ada Izin Verifikasi
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
