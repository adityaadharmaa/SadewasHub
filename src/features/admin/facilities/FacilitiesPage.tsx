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
  Wifi,
  ShieldCheck,
  icons, // <-- Impor daftar seluruh ikon Lucide
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../services/api";

// --- KOMPONEN PENERJEMAH IKON (DynamicIcon) ---
// Letakkan di sini agar bisa dipakai langsung oleh komponen di bawahnya
const DynamicIcon = ({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) => {
  if (!name) return null;
  // Cari komponen ikon berdasarkan namanya (misal: "Wifi", "Tv")
  const LucideIcon = icons[name as keyof typeof icons];
  // Jika nama ikon salah/tidak ditemukan, kembalikan null agar aplikasi tidak error/crash
  if (!LucideIcon) return null;
  return <LucideIcon className={className} />;
};

// --- TYPES ---
interface Facility {
  id: string | number;
  name: string;
  icon: string | null;
  created_at: string;
}

export default function FacilitiesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Facility | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["facilities", page, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/admin/facilities`, {
        params: { search: searchTerm, per_page: 10, page },
      });
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingData) {
        const res = await api.put(
          `/admin/facilities/${editingData.id}`,
          payload,
        );
        return res.data;
      } else {
        const res = await api.post(`/admin/facilities`, payload);
        return res.data;
      }
    },
    onSuccess: (res) => {
      toast.success(res.message || "Data fasilitas berhasil disimpan!");
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
    onError: (error: any) => {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors && serverErrors.name) {
        toast.error(serverErrors.name[0]);
      } else {
        toast.error(error.response?.data?.message || "Gagal menyimpan data.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/admin/facilities/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Fasilitas berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
    onError: () => {
      toast.error(
        "Gagal menghapus data. Fasilitas ini mungkin sedang digunakan oleh Tipe Kamar.",
      );
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const openModalForCreate = () => {
    setEditingData(null);
    reset({ name: "", icon: "" });
    setIsModalOpen(true);
  };

  const openModalForEdit = (facility: Facility) => {
    setEditingData(facility);
    reset({
      name: facility.name,
      icon: facility.icon || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus fasilitas ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (formData: any) => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <Wifi className="h-6 w-6 text-primary-500" /> Fasilitas Kamar
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Kelola daftar fasilitas yang tersedia untuk ditambahkan ke tipe
            kamar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex w-full max-w-xs items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari fasilitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <button
            onClick={openModalForCreate}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Tambah Fasilitas
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Nama Fasilitas</th>
                <th className="px-6 py-4 font-extrabold">Kode Ikon</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" />
                    Memuat data...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                    Gagal memuat data.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-10 text-center font-medium text-slate-500"
                  >
                    Belum ada fasilitas yang ditambahkan.
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: Facility) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="flex items-center gap-3 px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      {item.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {item.icon ? (
                        <div className="flex items-center gap-3">
                          {/* Render Ikon Lucide secara dinamis di sini */}
                          <DynamicIcon
                            name={item.icon}
                            className="h-5 w-5 text-primary-500"
                          />
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-mono dark:bg-slate-800">
                            {item.icon}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">
                          -
                        </span>
                      )}
                    </td>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm scale-100 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100 animate-in zoom-in-95 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingData ? "Edit Fasilitas" : "Tambah Fasilitas"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nama Fasilitas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AC, WiFi, TV"
                  {...register("name", {
                    required: "Nama fasilitas wajib diisi",
                  })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.name && (
                  <span className="mt-1 block text-xs font-bold text-red-500">
                    {errors.name.message as string}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Kode Ikon Lucide (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Wifi, Tv, Wind, Monitor"
                  {...register("icon")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                  Gunakan format PascalCase. Referensi:{" "}
                  <a
                    href="https://lucide.dev/icons/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-500 hover:underline"
                  >
                    lucide.dev/icons
                  </a>
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
