import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  UserCircle,
  Mail,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  CreditCard,
  Lock,
  X,
  Clock,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function ProfilePage() {
  const queryClient = useQueryClient();

  // --- STATE UNTUK TAB NAVIGASI ---
  const [activeTab, setActiveTab] = useState<
    "basic" | "document" | "emergency"
  >("basic");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State khusus untuk URL KTP dari Backend (Terproteksi)
  const [ktpUrl, setKtpUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    // FIX: Menghapus 'errors' karena dideklarasikan tapi tidak pernah digunakan (Error TS6133)
  } = useForm();

  // --- FETCH CURRENT USER DATA ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["authMeProfile"],
    queryFn: async () => {
      const response = await api.get("/profile/me");
      return response.data;
    },
  });

  // --- FETCH FOTO KTP TERPROTEKSI (BLOB) ---
  const fetchKtpImage = async (filename: string) => {
    try {
      const response = await api.get(`/profile/ktp/${filename}`, {
        responseType: "blob", // Mengambil data sebagai binary/blob
      });
      const url = URL.createObjectURL(response.data);
      setKtpUrl(url);
    } catch (error) {
      console.error("Gagal memuat foto KTP terproteksi", error);
    }
  };

  // Populate form saat data berhasil di-fetch
  useEffect(() => {
    if (data?.data?.user) {
      const { profile } = data.data.user;
      reset({
        full_name: profile?.full_name || "",
        nickname: profile?.nickname || "",
        phone_number: profile?.phone_number || "",
        nik: profile?.nik || "",
        address: profile?.address || "",
        gender: profile?.gender || "",
        birth_date: profile?.birth_date || "",
        occupation: profile?.occupation || "",
        emergency_contact_name: profile?.emergency_contact_name || "",
        emergency_contact_phone: profile?.emergency_contact_phone || "",
      });

      const filename = profile?.ktp_url?.split("/").pop();
      if (filename) {
        fetchKtpImage(filename);
      }
    }
  }, [data, reset]);

  // --- MUTATION: UPDATE PROFIL ---
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const formData = new FormData();

      const textFields = [
        "full_name",
        "nickname",
        "phone_number",
        "nik",
        "address",
        "gender",
        "birth_date",
        "occupation",
        "emergency_contact_name",
        "emergency_contact_phone",
      ];

      textFields.forEach((field) => {
        if (payload[field]) formData.append(field, payload[field]);
      });

      if (selectedFile) {
        formData.append("ktp_image", selectedFile);
      }

      const res = await api.post(`/profile/update`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Profil berhasil diperbarui!");
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ["authMeProfile"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
    },
    onError: (error: any) => {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        Object.keys(validationErrors).forEach((key) => {
          toast.error(validationErrors[key][0]);
        });
      } else {
        toast.error(
          error.response?.data?.message || "Gagal memperbarui profil.",
        );
      }
    },
  });

  // --- MUTATION: KIRIM ULANG EMAIL VERIFIKASI ---
  const resendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/auth/email/verification-notification`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Link verifikasi berhasil dikirim ke email Anda!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal mengirim link verifikasi.",
      );
    },
  });

  const onSubmit = (formData: any) => {
    updateMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- HELPERS ---
  const userData = data?.data?.user;
  const userRoles = data?.data?.roles || [];
  const primaryRole = userRoles.length > 0 ? userRoles[0] : "user";

  const isAdmin = primaryRole === "admin";
  const hasUploadedKtp = !!userData?.profile?.ktp_url;
  const isKtpRequired = !isAdmin && !hasUploadedKtp;
  const isEmailVerified = !!userData?.email_verified_at;

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="font-bold">Memuat data profil Anda...</p>
      </div>
    );
  }

  if (isError || !userData) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p className="font-bold">Gagal mengambil data profil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserCircle className="h-7 w-7 text-primary-500" /> Profil &
          Pengaturan Akun
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi pribadi, kontak darurat, dan dokumen identitas Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* --- KOLOM KIRI: ID CARD SUMMARY --- */}
        <div className="xl:col-span-1 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-[#1e293b]/50">
            <div className="h-28 bg-linear-to-br from-primary-500 via-primary-600 to-blue-700"></div>

            <div className="px-6 pb-6 relative flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-[#1e293b] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-black text-slate-600 dark:text-slate-300 shadow-md -mt-12 mb-3">
                {getInitials(userData.profile?.full_name, userData.email)}
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {userData.profile?.full_name || "Tanpa Nama"}
              </h2>

              {/* STATUS EMAIL & TOMBOL VERIFIKASI */}
              <div className="mt-1 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5" /> {userData.email}
                </div>

                {isEmailVerified ? (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Email Terverifikasi
                  </span>
                ) : (
                  <div className="mt-1.5 flex flex-col items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3" /> Email Belum
                      Diverifikasi
                    </span>
                    <button
                      type="button"
                      onClick={() => resendEmailMutation.mutate()}
                      disabled={resendEmailMutation.isPending}
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 disabled:opacity-50 flex items-center gap-1 transition-all"
                    >
                      {resendEmailMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Kirim Link Verifikasi
                    </button>
                  </div>
                )}
              </div>

              {/* STATUS ROLE & KTP */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> {primaryRole}
                </span>
                {userData.profile?.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" /> KTP Valid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" /> KTP Menunggu
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-transparent p-5 space-y-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nomor Telepon
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {userData.profile?.phone_number || "-"}
                </p>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAdmin ? "Jabatan Sistem" : "Pekerjaan"}
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5 capitalize">
                  {isAdmin ? primaryRole : userData.profile?.occupation || "-"}
                </p>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bergabung Sejak
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {new Date(userData.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- KOLOM KANAN: FORM EDIT PROFIL DENGAN TABS --- */}
        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-[#1e293b]/50 overflow-hidden flex flex-col h-full">
            {/* TABS HEADER */}
            <div className="flex items-center overflow-x-auto border-b border-slate-100 dark:border-slate-700/50 custom-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`flex whitespace-nowrap items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === "basic"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-500/10"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                <UserCircle className="h-4 w-4" /> Informasi Dasar
              </button>

              {!isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("document")}
                    className={`flex whitespace-nowrap items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                      activeTab === "document"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-500/10"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> Dokumen & Alamat
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("emergency")}
                    className={`flex whitespace-nowrap items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                      activeTab === "emergency"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-500/10"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    <HeartPulse className="h-4 w-4" /> Kontak Darurat
                  </button>
                </>
              )}
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col flex-1"
            >
              <div className="p-6 md:p-8 flex-1">
                {/* CONTENT: INFORMASI DASAR */}
                {activeTab === "basic" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nama Lengkap Sesuai KTP
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan nama lengkap"
                          {...register("full_name", {
                            required: "Nama lengkap wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nama Panggilan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Aditya"
                          {...register("nickname")}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Nama ini akan ditampilkan di menu navigasi atas.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nomor Telepon / WA
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 081234567890"
                          {...register("phone_number", {
                            required: "Nomor telepon wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Jenis Kelamin
                        </label>
                        <select
                          {...register("gender", {
                            required: "Jenis kelamin wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        >
                          <option value="">Pilih Jenis Kelamin</option>
                          <option value="male">Laki-Laki</option>
                          <option value="female">Perempuan</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          {...register("birth_date", {
                            required: "Tanggal lahir wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b] scheme-light dark:scheme-dark"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTENT: DOKUMEN & ALAMAT */}
                {activeTab === "document" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          NIK (Nomor Induk Kependudukan)
                        </label>
                        <input
                          type="text"
                          placeholder="16 digit NIK"
                          {...register("nik", { required: "NIK wajib diisi" })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Pekerjaan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Mahasiswa, Karyawan Swasta"
                          {...register("occupation", {
                            required: "Pekerjaan wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Alamat Lengkap Sesuai KTP
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tulis alamat lengkap Anda..."
                        {...register("address", {
                          required: "Alamat wajib diisi",
                        })}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b] custom-scrollbar"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Foto Dokumen KTP
                        {isKtpRequired ? (
                          <span className="text-red-500 ml-1 normal-case font-bold">
                            * (Wajib diunggah)
                          </span>
                        ) : (
                          <span className="normal-case font-normal text-slate-400 ml-1">
                            (Opsional)
                          </span>
                        )}
                      </label>

                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1 w-full relative">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className={`w-full rounded-xl border ${
                              isKtpRequired && !selectedFile && !hasUploadedKtp
                                ? "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10"
                                : "border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-[#0f172a]"
                            } px-4 py-3 text-sm font-medium text-slate-500 outline-none transition-all focus:border-primary-500 cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400`}
                          />
                          <p className="text-[10px] text-slate-400 mt-2">
                            Format: JPG, PNG. Maksimal 2MB. Mengunggah gambar
                            baru akan menimpa data KTP lama Anda.
                          </p>
                        </div>

                        {/* PREVIEW KTP ATAU KTP DARI SERVER */}
                        {(previewUrl || ktpUrl) && (
                          <div className="shrink-0 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 w-full sm:w-48 aspect-video bg-slate-100 dark:bg-slate-800">
                            <img
                              src={previewUrl || ktpUrl || ""}
                              alt="KTP"
                              className="w-full h-full object-cover"
                            />

                            {previewUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFile(null);
                                  setPreviewUrl(null);
                                }}
                                className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}

                            {!previewUrl && ktpUrl && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-1 px-2 flex items-center justify-center gap-1.5">
                                <Lock className="h-3 w-3 text-white/80" />
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                                  Protected
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTENT: KONTAK DARURAT */}
                {activeTab === "emergency" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 mb-6">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Pastikan kontak ini
                        aktif dan mudah dihubungi saat keadaan darurat.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nama Kontak Darurat
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Budi Santoso (Ayah)"
                          {...register("emergency_contact_name", {
                            required: "Nama kontak darurat wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nomor Telepon Darurat
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 081987654321"
                          {...register("emergency_contact_phone", {
                            required: "No telepon darurat wajib diisi",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-white dark:focus:bg-[#1e293b]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER BUTTON */}
              <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Data yang Anda masukkan akan disimpan secara aman.
                </span>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-500/30"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
