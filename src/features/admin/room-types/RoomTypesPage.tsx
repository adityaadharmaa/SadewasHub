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
  BedDouble,
  Check,
  icons,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../services/api";

const DynamicIcon = ({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) => {
  if (!name) return null;
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const LucideIcon =
    icons[formattedName as keyof typeof icons] ||
    icons[name as keyof typeof icons];
  if (!LucideIcon) return null;
  return <LucideIcon className={className} />;
};

// --- UPDATE TYPES ---
interface RoomType {
  id: string | number;
  name: string;
  description: string;
  price_per_day?: number; // <--- Baru
  price_per_week?: number; // <--- Baru
  price_per_month: number;
  facilities?: any[];
}

interface Facility {
  id: number;
  name: string;
  icon: string | null;
}

export default function RoomTypesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<RoomType | null>(null);
  const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);

  const [expandedFacilities, setExpandedFacilities] = useState<
    Record<string | number, boolean>
  >({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["roomTypes", page, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/admin/room-types`, {
        params: { search: searchTerm, per_page: 10, page },
      });
      return response.data;
    },
  });

  const { data: facilitiesData } = useQuery({
    queryKey: ["allFacilities"],
    queryFn: async () => {
      const response = await api.get(`/admin/facilities`, {
        params: { per_page: 100 },
      });
      return response.data.data as Facility[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const finalPayload = { ...payload, facilities: selectedFacilities };

      if (editingData) {
        const res = await api.put(
          `/admin/room-types/${editingData.id}`,
          finalPayload,
        );
        return res.data;
      } else {
        const res = await api.post(`/admin/room-types`, finalPayload);
        return res.data;
      }
    },
    onSuccess: (res) => {
      toast.success(res.message || "Data berhasil disimpan!");
      setIsModalOpen(false);
      reset();
      setSelectedFacilities([]);
      queryClient.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan data.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/admin/room-types/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Data berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: () => {
      toast.error(
        "Gagal menghapus data. Pastikan tipe kamar ini tidak sedang digunakan.",
      );
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // --- RESET FORM TERMASUK HARGA BARU ---
  const openModalForCreate = () => {
    setEditingData(null);
    reset({
      name: "",
      price_per_day: "",
      price_per_week: "",
      price_per_month: "",
      description: "",
    });
    setSelectedFacilities([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (roomType: RoomType) => {
    setEditingData(roomType);
    reset({
      name: roomType.name,
      price_per_day: roomType.price_per_day || "",
      price_per_week: roomType.price_per_week || "",
      price_per_month: roomType.price_per_month,
      description: roomType.description || "",
    });

    if (roomType.facilities) {
      const facilityIds = roomType.facilities.map((f: any) => f.id);
      setSelectedFacilities(facilityIds);
    } else {
      setSelectedFacilities([]);
    }

    setIsModalOpen(true);
  };

  const toggleFacility = (id: number) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id],
    );
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus tipe kamar ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (formData: any) => {
    // Perbaikan: Pastikan string kosong / nilai 0 diubah menjadi null
    const cleanData = {
      ...formData,
      price_per_day:
        formData.price_per_day && Number(formData.price_per_day) > 0
          ? Number(formData.price_per_day)
          : null,
      price_per_week:
        formData.price_per_week && Number(formData.price_per_week) > 0
          ? Number(formData.price_per_week)
          : null,
      price_per_month: Number(formData.price_per_month),
    };
    saveMutation.mutate(cleanData);
  };

  const toggleRowFacilities = (id: string | number) => {
    setExpandedFacilities((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // --- HELPER FORMAT RUPIAH ---
  const formatRupiah = (angka?: number | null) => {
    if (!angka) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <BedDouble className="h-6 w-6 text-primary-500" /> Tipe Kamar
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Kelola jenis kamar, harga, dan fasilitas pendukungnya.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex w-full max-w-xs items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tipe kamar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
          <button
            onClick={openModalForCreate}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Tambah Tipe
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Nama Tipe</th>
                <th className="px-6 py-4 font-extrabold">Harga Sewa</th>
                <th className="px-6 py-4 font-extrabold">Fasilitas</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" />
                    Memuat data...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                    Gagal memuat data.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center font-medium text-slate-500"
                  >
                    Belum ada tipe kamar yang ditambahkan.
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: RoomType) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white align-top pt-5">
                      {item.name}
                    </td>

                    {/* KOLOM HARGA BARU */}
                    <td className="px-6 py-4 align-top pt-5 min-w-[200px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Harian:
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatRupiah(item.price_per_day)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Mingguan:
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatRupiah(item.price_per_week)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            Bulanan:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.price_per_month)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-[300px] align-top pt-5">
                      <div className="flex flex-wrap items-center gap-1.5 transition-all">
                        {item.facilities && item.facilities.length > 0 ? (
                          <>
                            {(expandedFacilities[item.id]
                              ? item.facilities
                              : item.facilities.slice(0, 3)
                            ).map((fac: any) => (
                              <span
                                key={fac.id}
                                className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              >
                                <DynamicIcon
                                  name={fac.icon}
                                  className="h-3 w-3 opacity-70"
                                />
                                <span className="truncate max-w-[100px]">
                                  {fac.name}
                                </span>
                              </span>
                            ))}

                            {item.facilities.length > 3 && (
                              <button
                                onClick={() => toggleRowFacilities(item.id)}
                                className="flex items-center gap-1 rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-300 active:scale-95 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                              >
                                {expandedFacilities[item.id]
                                  ? "Sembunyikan"
                                  : `+${item.facilities.length - 3} Lainnya`}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs italic text-slate-400">
                            Belum diset
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right align-top pt-5">
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
          {/* Diperlebar max-w-lg menjadi max-w-2xl agar grid harga lega */}
          <div className="flex w-full max-w-2xl scale-100 flex-col overflow-hidden rounded-[24px] bg-white p-7 shadow-2xl ring-1 ring-slate-100 animate-in zoom-in-95 dark:bg-slate-900 dark:ring-slate-800 sm:max-h-[90vh]">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingData ? "Edit Tipe Kamar" : "Tambah Tipe Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="custom-scrollbar flex flex-col space-y-5 overflow-y-auto pr-2"
            >
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nama Tipe
                </label>
                <input
                  type="text"
                  placeholder="Contoh: VIP Plus"
                  {...register("name", { required: "Nama tipe wajib diisi" })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.name && (
                  <span className="mt-1 block text-xs font-bold text-red-500">
                    {errors.name.message as string}
                  </span>
                )}
              </div>

              {/* GRID HARGA SEWA (HARIAN, MINGGUAN, BULANAN) */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  Skema Harga Sewa (Rp)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Harian{" "}
                      <span className="font-normal text-slate-400">
                        (Opsional)
                      </span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 150000"
                      {...register("price_per_day", { min: 0 })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mingguan{" "}
                      <span className="font-normal text-slate-400">
                        (Opsional)
                      </span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 850000"
                      {...register("price_per_week", { min: 0 })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bulanan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 1500000"
                      {...register("price_per_month", {
                        required: "Harga bulanan wajib diisi",
                        min: 0,
                      })}
                      className="w-full rounded-xl border border-primary-300 bg-primary-50/30 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-primary-500/50 dark:bg-primary-900/10 dark:text-white"
                    />
                    {errors.price_per_month && (
                      <span className="mt-1 block text-xs font-bold text-red-500">
                        {errors.price_per_month.message as string}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan detail tipe kamar ini..."
                  {...register("description")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Pilih Fasilitas
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {facilitiesData?.map((facility) => {
                    const isSelected = selectedFacilities.includes(facility.id);
                    return (
                      <label
                        key={facility.id}
                        className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${isSelected ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => toggleFacility(facility.id)}
                        />
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"}`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-xs font-bold leading-tight">
                            {facility.name}
                          </span>
                        </div>
                        <DynamicIcon
                          name={facility.icon}
                          className={`h-4 w-4 transition-colors ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500"}`}
                        />
                      </label>
                    );
                  })}
                </div>
                {facilitiesData?.length === 0 && (
                  <p className="text-xs italic text-slate-500">
                    Anda belum membuat Master Data Fasilitas.
                  </p>
                )}
              </div>

              <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
