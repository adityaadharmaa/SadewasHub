import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Tag,
  CheckCircle2,
  Clock,
  Percent,
  DollarSign,
  Calendar,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

// --- TYPES ---
interface Promo {
  id: string | number;
  code: string;
  type: "percentage" | "fixed";
  reward_amount: number;
  start_date: string;
  end_date: string;
  limit: number | null;
  is_active: boolean;
}

export default function PromosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // State untuk Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Promo | null>(null);

  // Form Handling
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();
  const selectedType = watch("type", "fixed");

  // --- FETCH DATA ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["promos", page, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/admin/promos`, {
        params: { search: searchTerm, per_page: 10, page },
      });
      return response.data;
    },
  });

  // --- MUTATIONS ---
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const finalPayload = {
        ...payload,
        code: payload.code.toUpperCase(),
        limit: payload.limit === "" ? null : parseInt(payload.limit),
      };

      if (editingData) {
        const res = await api.put(
          `/admin/promos/${editingData.id}`,
          finalPayload,
        );
        return res.data;
      } else {
        const res = await api.post(`/admin/promos`, finalPayload);
        return res.data;
      }
    },
    onSuccess: (res) => {
      toast.success(res.message || "Promo berhasil disimpan!");
      setIsModalOpen(false);
      reset();
      setEditingData(null);
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (error: any) => {
      const msgs = error.response?.data?.errors;
      if (msgs && msgs.code) toast.error(msgs.code[0]);
      else
        toast.error(error.response?.data?.message || "Gagal menyimpan promo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/admin/promos/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Promo berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
  });

  // --- HANDLERS ---
  const openModalForCreate = () => {
    setEditingData(null);
    reset({
      code: "",
      type: "fixed",
      reward_amount: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      limit: "",
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (promo: Promo) => {
    setEditingData(promo);
    reset({
      code: promo.code,
      type: promo.type,
      reward_amount: promo.reward_amount,
      start_date: promo.start_date,
      end_date: promo.end_date,
      limit: promo.limit === null ? "" : promo.limit,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kode promo ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (formData: any) => {
    saveMutation.mutate(formData);
  };

  // --- SMART DATA EXTRACTOR ---
  let promosList: Promo[] = [];
  if (Array.isArray(data?.data)) promosList = data.data;

  // Helper Format Nominal
  const formatReward = (amount: number, type: "percentage" | "fixed") => {
    if (type === "percentage") return `${amount}%`;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper Format Tanggal
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  // --- SMART STATUS CALCULATOR ---
  const getPromoStatus = (promo: Promo) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Nol-kan jam agar perbandingan tanggal akurat

    const startDate = new Date(promo.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(promo.end_date);
    endDate.setHours(0, 0, 0, 0);

    if (promo.limit !== null && promo.limit <= 0) return "HABIS";
    if (today < startDate) return "UPCOMING";
    if (today > endDate) return "EXPIRED";
    return "AKTIF";
  };

  const renderStatusBadge = (promo: Promo) => {
    const status = getPromoStatus(promo);

    switch (status) {
      case "AKTIF":
        return (
          <span className="flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> AKTIF
          </span>
        );
      case "UPCOMING":
        return (
          <span className="flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
            <CalendarClock className="h-3 w-3" /> AKAN DATANG
          </span>
        );
      case "HABIS":
      case "EXPIRED":
        return (
          <span className="flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <Clock className="h-3 w-3" />{" "}
            {status === "HABIS" ? "KUOTA HABIS" : "EXPIRED"}
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
            <Tag className="h-6 w-6 text-primary-500" /> Promo & Diskon
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola kode voucher dan potongan harga untuk penyewaan kamar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex w-full max-w-xs items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode promo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-slate-200"
            />
          </div>
          <button
            onClick={openModalForCreate}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Tambah Promo
          </button>
        </div>
      </div>

      {/* --- TABLE DATA --- */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/50 dark:bg-[#0f172a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700/80 dark:bg-[#1e293b]/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Kode Voucher</th>
                <th className="px-6 py-4 font-extrabold">Besaran Diskon</th>
                <th className="px-6 py-4 font-extrabold">Masa Berlaku</th>
                <th className="px-6 py-4 font-extrabold">Kuota</th>
                <th className="px-6 py-4 font-extrabold">Status</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/80">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-3" />
                    Memuat data promo...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-red-500">
                    <AlertCircle className="mx-auto h-8 w-8 mb-3" />
                    Gagal memuat data.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && promosList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Tag className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">
                      Belum ada promo
                    </p>
                  </td>
                </tr>
              ) : (
                promosList.map((item: Promo) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1e293b]/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-widest bg-slate-100 dark:bg-slate-800/80 w-fit px-3 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/50">
                        {item.code}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {item.type === "percentage" ? (
                          <Percent className="h-3.5 w-3.5" />
                        ) : (
                          <DollarSign className="h-3.5 w-3.5" />
                        )}
                        {formatReward(item.reward_amount, item.type)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(item.start_date)} -{" "}
                        {formatDate(item.end_date)}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {item.limit === null ? (
                        <span className="text-xl">∞</span>
                      ) : (
                        `${item.limit}x Pakai`
                      )}
                    </td>

                    {/* STATUS YANG SUDAH CERDAS */}
                    <td className="px-6 py-4">{renderStatusBadge(item)}</td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModalForEdit(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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

      {/* --- MODAL FORM PROMO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-lg scale-100 flex-col overflow-hidden rounded-[24px] bg-white p-7 shadow-2xl ring-1 ring-slate-100 animate-in zoom-in-95 dark:bg-[#0f172a] dark:ring-slate-800 sm:max-h-[90vh]">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary-500" />
                {editingData ? "Edit Kode Promo" : "Buat Promo Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-[#1e293b] dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="custom-scrollbar flex flex-col space-y-5 overflow-y-auto pr-2"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Kode Voucher (Unik)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: MERDEKA50"
                  style={{ textTransform: "uppercase" }}
                  {...register("code", { required: "Kode promo wajib diisi" })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                />
                {errors.code && (
                  <span className="mt-1 block text-xs font-bold text-red-500">
                    {errors.code.message as string}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tipe Diskon
                  </label>
                  <select
                    {...register("type", { required: "Pilih tipe diskon" })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                  >
                    <option value="fixed">Nominal (Rp)</option>
                    <option value="percentage">Persentase (%)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Besaran Diskon
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 text-sm font-bold">
                      {selectedType === "fixed" ? "Rp" : "%"}
                    </span>
                    <input
                      type="number"
                      placeholder={selectedType === "fixed" ? "50000" : "15"}
                      {...register("reward_amount", {
                        required: "Besaran diskon wajib diisi",
                        min: 1,
                      })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                    />
                  </div>
                  {errors.reward_amount && (
                    <span className="mt-1 block text-xs font-bold text-red-500">
                      {errors.reward_amount.message as string}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    {...register("start_date", {
                      required: "Tanggal mulai wajib diisi",
                    })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    {...register("end_date", {
                      required: "Tanggal akhir wajib diisi",
                    })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Batas Kuota Pemakaian
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] dark:bg-slate-800">
                    Opsional
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="Kosongkan jika kuota tak terbatas (Unlimited)"
                  {...register("limit", { min: 1 })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                />
              </div>

              <div className="mt-6 flex shrink-0 justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Simpan Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
