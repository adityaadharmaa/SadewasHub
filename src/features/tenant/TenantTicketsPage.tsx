import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Plus,
  MessageSquare,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  Send,
  Ticket as TicketIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  photo_url: string | null;
  admin_note: string | null;
  created_at_humans: string;
}

export default function TenantTicketsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    data: tickets,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["myTickets"],
    queryFn: async () => {
      const res = await api.get("/tenant/tickets");
      return res.data.data as Ticket[];
    },
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Validasi file di frontend sebelum dikirim
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Format foto tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.",
        );
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 5MB.");
        e.target.value = "";
        return;
      }

      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("priority", formData.priority);

      if (selectedImage) {
        payload.append("photo", selectedImage);
      }

      // Jika api.ts Anda memaksa application/json, kita timpa di sini agar multipart berjalan
      const res = await api.post("/tenant/tickets", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Komplain Anda berhasil terkirim!");
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
    },
    onError: (err: any) => {
      const serverErrors = err.response?.data?.errors;
      const message =
        serverErrors?.room?.[0] ||
        serverErrors?.photo?.[0] ||
        err.response?.data?.message ||
        "Gagal mengirim laporan.";
      toast.error(message);
    },
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":
        return {
          bg: "bg-amber-100 dark:bg-amber-500/20",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-500/30",
        };
      case "in_progress":
        return {
          bg: "bg-blue-100 dark:bg-blue-500/20",
          text: "text-blue-700 dark:text-blue-400",
          border: "border-blue-200 dark:border-blue-500/30",
        };
      case "resolved":
        return {
          bg: "bg-emerald-100 dark:bg-emerald-500/20",
          text: "text-emerald-700 dark:text-emerald-400",
          border: "border-emerald-200 dark:border-emerald-500/30",
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-slate-800",
          text: "text-slate-700 dark:text-slate-300",
          border: "border-slate-200 dark:border-slate-700",
        };
    }
  };

  if ((fetchError as any)?.response?.status === 403) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-24 w-24 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border-8 border-rose-100 dark:border-rose-500/20">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Akses Terbatas
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          Akun Anda belum diverifikasi atau tidak memiliki izin. Pastikan email
          Anda sudah aktif di database dan Anda memiliki kamar yang sedang
          disewa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 text-white">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pusat Bantuan
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Pantau status laporan dan sampaikan kendala fasilitas Anda.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-6 py-3.5 text-sm font-bold text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Buat Laporan Baru
        </button>
      </div>

      {/* TICKET LISTING */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          <p className="text-sm font-bold text-slate-400 animate-pulse">
            Memuat data tiket...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tickets?.length === 0 ? (
            <div className="lg:col-span-2 py-24 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm rounded-4xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
                <TicketIcon className="h-10 w-10 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white mb-2">
                Semuanya Berjalan Lancar! 🎉
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center">
                Anda belum pernah membuat laporan. Jika ada fasilitas yang perlu
                diperbaiki, jangan ragu untuk melapor.
              </p>
            </div>
          ) : (
            tickets?.map((ticket) => {
              const statusStyle = getStatusStyle(ticket.status);

              return (
                <div
                  key={ticket.id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/5 hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-900 flex flex-col h-full overflow-hidden"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-5">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <History className="h-3 w-3" />{" "}
                        {ticket.created_at_humans}
                      </div>
                    </div>

                    <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {ticket.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3 grow">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${ticket.priority === "high" ? "bg-rose-50 dark:bg-rose-500/10" : "bg-slate-50 dark:bg-slate-800"}`}
                        >
                          {ticket.priority === "high" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Urgensi: {ticket.priority}
                        </span>
                      </div>

                      {ticket.photo_url && (
                        <div
                          className="h-10 w-10 rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md cursor-pointer transition-transform hover:scale-110 hover:rotate-3"
                          onClick={() =>
                            window.open(ticket.photo_url!, "_blank")
                          }
                        >
                          <img
                            src={ticket.photo_url}
                            className="w-full h-full object-cover"
                            alt="Lampiran"
                          />
                        </div>
                      )}
                    </div>

                    {ticket.admin_note && (
                      <div className="mt-5 p-4 rounded-2xl rounded-tl-sm bg-linear-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-l-4 border-primary-500 relative">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                          <span className="text-[10px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-wider">
                            Tanggapan Admin
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          "{ticket.admin_note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL LAPORAN YANG DIPERBAIKI SCROLL-NYA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleCloseModal}
          />

          {/* PERBAIKAN: flex-col dan max-h-[90vh] agar tidak bablas */}
          <div className="relative w-full max-w-xl flex flex-col max-h-[90vh] bg-white dark:bg-slate-900 rounded-4xl overflow-hidden shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header Modal - shrink-0 agar tidak ikut ter-scroll */}
            <div className="shrink-0 p-6 sm:p-8 bg-linear-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Form Laporan 📝
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Sampaikan keluhan Anda dengan detail.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Area - PERBAIKAN: overflow-y-auto agar bisa digulir */}
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Judul Keluhan
                </label>
                <input
                  {...register("title", { required: "Judul wajib diisi" })}
                  placeholder="Contoh: AC Kamar Tidak Dingin"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-400"
                />
                {errors.title && (
                  <p className="text-xs font-bold text-rose-500 mt-1">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tingkat Urgensi
                </label>
                <div className="relative">
                  <select
                    {...register("priority")}
                    className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option value="low">🟡 Rendah (Bisa Menunggu)</option>
                    <option value="medium">🟠 Sedang (Butuh Diperbaiki)</option>
                    <option value="high">🔴 Darurat (Segera!)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Detail Kendala
                </label>
                <textarea
                  {...register("description", {
                    required: "Ceritakan kendalanya",
                  })}
                  rows={4}
                  placeholder="Ceritakan dengan detail kendala yang Anda alami..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 resize-none placeholder:text-slate-400"
                />
                {errors.description && (
                  <p className="text-xs font-bold text-rose-500 mt-1">
                    {errors.description.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Foto Bukti (Opsional)</span>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                        setSelectedImage(null);
                      }}
                      className="text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Hapus Foto
                    </button>
                  )}
                </label>
                <label className="group relative w-full h-36 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 overflow-hidden">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          Ganti Foto
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-primary-500 transition-colors">
                      <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-full flex items-center justify-center mb-2 transition-colors">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        Klik Untuk Upload
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">
                        JPG, PNG, WEBP (Maks 5MB)
                      </span>
                    </div>
                  )}
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="relative w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all flex items-center justify-center gap-2 overflow-hidden group active:scale-[0.98]"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      Kirim Laporan Sekarang
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
