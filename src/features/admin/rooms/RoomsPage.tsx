import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Home,
  CheckCircle2,
  XCircle,
  Wrench,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../services/api";

// --- TYPES ---
interface RoomImage {
  id: number;
  url: string;
}

interface Room {
  id: string | number;
  room_number: string;
  status: "available" | "occupied" | "maintenance";
  status_label: string;
  images?: RoomImage[];
  type?: {
    id: string;
    name: string;
    price_per_day?: number;
    price_per_week?: number;
    price_per_month: number;
  };
}

interface RoomType {
  id: string;
  name: string;
}

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Room | null>(null);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<RoomImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewingGallery, setViewingGallery] = useState<{
    roomNumber: string;
    images: RoomImage[];
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rooms", page, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/admin/rooms`, {
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

  const { data: roomTypesData } = useQuery({
    queryKey: ["allRoomTypesDropdown"],
    queryFn: async () => {
      const response = await api.get(`/admin/room-types`, {
        params: { per_page: 100 },
      });
      return response.data.data as RoomType[];
    },
  });

  // --- PERBAIKAN MUTATION ---
  const saveMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const url = editingData
        ? `/admin/rooms/${editingData.id}/update`
        : `/admin/rooms`;

      const res = await api.post(url, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Data kamar berhasil disimpan!");
      setIsModalOpen(false);
      resetFormState();
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error: any) => {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors && serverErrors.room_number) {
        toast.error(serverErrors.room_number[0]);
      } else {
        toast.error(error.response?.data?.message || "Gagal menyimpan data.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/admin/rooms/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Kamar berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus kamar.");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const resetFormState = () => {
    reset({ room_number: "", room_type_id: "", status: "available" });
    setNewFiles([]);
    setPreviewUrls([]);
    setExistingImages([]);
    setEditingData(null);
  };

  const openModalForCreate = () => {
    resetFormState();
    setIsModalOpen(true);
  };

  const openModalForEdit = (room: Room) => {
    resetFormState();
    setEditingData(room);
    reset({
      room_number: room.room_number,
      room_type_id: room.type?.id || "",
      status: room.status,
    });

    if (room.images && room.images.length > 0) {
      setExistingImages(room.images);
    }

    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArray]);
      const newUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (id: number) => {
    if (
      window.confirm(
        "Hapus foto ini? (Foto akan terhapus setelah Anda menekan Simpan Data)",
      )
    ) {
      setExistingImages((prev) => prev.filter((img) => img.id !== id));
    }
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kamar ini?")) {
      deleteMutation.mutate(id);
    }
  };

  // --- PERBAIKAN PAYLOAD ONSUBMIT ---
  const onSubmit = (formData: any) => {
    const payload = new FormData();
    payload.append("room_number", formData.room_number);
    payload.append("room_type_id", formData.room_type_id);
    payload.append("status", formData.status);

    // Kunci perbaikan: Looping files harus ditambahkan satu per satu ke array
    if (newFiles.length > 0) {
      newFiles.forEach((file) => {
        payload.append("images[]", file);
      });
    }

    if (editingData) {
      if (existingImages.length > 0) {
        existingImages.forEach((img) => {
          payload.append("retained_images[]", img.id.toString());
        });
      }
    }

    saveMutation.mutate(payload);
  };

  const formatRupiah = (angka?: number | null) => {
    if (!angka) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Tersedia
          </span>
        );
      case "occupied":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" /> Terisi
          </span>
        );
      case "maintenance":
        return (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            <Wrench className="h-3.5 w-3.5" /> Perbaikan
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold text-slate-500">{status}</span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <Home className="h-6 w-6 text-primary-500" /> Daftar Kamar
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Kelola data fisik kamar, tipe, dan status ketersediaannya.
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
              onClick={() => setStatusFilter("available")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "available" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Tersedia
            </button>
            <button
              onClick={() => setStatusFilter("occupied")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === "occupied" ? "bg-white text-red-600 shadow-sm dark:bg-slate-700 dark:text-red-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
            >
              Terisi
            </button>
          </div>
          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block"></div>
          <div className="flex items-center gap-3">
            <div className="relative flex w-full items-center sm:w-48">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. Kamar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <button
              onClick={openModalForCreate}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Kamar Baru
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="w-24 px-6 py-4 font-extrabold">Foto Utama</th>
                <th className="px-6 py-4 font-extrabold">No. Kamar</th>
                <th className="px-6 py-4 font-extrabold">Tipe Kamar</th>
                <th className="px-6 py-4 font-extrabold">Harga</th>
                <th className="px-6 py-4 font-extrabold">Status</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" />
                    Memuat data kamar...
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center font-medium text-slate-500"
                  >
                    Belum ada data kamar.
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: Room) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-3 align-top pt-5">
                      {item.images && item.images.length > 0 ? (
                        <div
                          onClick={() =>
                            setViewingGallery({
                              roomNumber: item.room_number,
                              images: item.images!,
                            })
                          }
                          className="relative h-10 w-14 group cursor-pointer overflow-hidden rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                          title="Klik untuk melihat semua foto kamar"
                        >
                          <img
                            src={item.images[0].url}
                            alt={`Kamar ${item.room_number}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {item.images.length > 1 && (
                            <div className="absolute bottom-0 right-0 flex items-center justify-center rounded-tl-lg bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md transition-colors group-hover:bg-primary-600">
                              +{item.images.length - 1}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/0 transition-colors group-hover:bg-slate-900/30 flex items-center justify-center">
                            <Search className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-md" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
                          <ImageIcon className="h-5 w-5 opacity-50" />
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-base font-black text-slate-900 dark:text-white align-top pt-5">
                      {item.room_number}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 align-top pt-5">
                      {item.type?.name || (
                        <span className="font-normal italic text-slate-400">
                          Tidak ada tipe
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top pt-5 min-w-50">
                      {item.type ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Harian:
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {formatRupiah(item.type.price_per_day)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Mingguan:
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {formatRupiah(item.type.price_per_week)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                            <span className="text-slate-500 dark:text-slate-400">
                              Bulanan:
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(item.type.price_per_month)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-normal italic text-slate-400">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top pt-5">
                      {getStatusBadge(item.status)}
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

      {/* MODAL GALERI GAMBAR */}
      {viewingGallery && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 max-h-[90vh] animate-in zoom-in-95">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-primary-500" />
                Galeri Kamar {viewingGallery.roomNumber}
              </h2>
              <button
                onClick={() => setViewingGallery(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {viewingGallery.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <img
                      src={img.url}
                      alt={`Kamar ${viewingGallery.roomNumber} - Foto ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-lg bg-slate-900/70 px-2 py-1 text-xs font-bold text-white backdrop-blur-md">
                      Foto {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM KAMAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-lg scale-100 flex-col overflow-hidden rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-slate-100 animate-in zoom-in-95 dark:bg-slate-900 dark:ring-slate-800 sm:max-h-[90vh]">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingData ? "Edit Data Kamar" : "Tambah Kamar Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="custom-scrollbar flex flex-col space-y-5 overflow-y-auto pr-2"
            >
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>
                    Galeri Foto Kamar{" "}
                    <span className="text-xs font-normal text-slate-400">
                      (Opsional)
                    </span>
                  </span>
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {existingImages.map((img) => (
                    <div
                      key={`old-${img.id}`}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <img
                        src={img.url}
                        alt="Foto Lama"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {previewUrls.map((url, index) => (
                    <div
                      key={`new-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-xl border-2 border-emerald-500/50"
                    >
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-1 top-1 rounded bg-emerald-500 px-1 text-[8px] font-bold text-white shadow-sm">
                        Baru
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-all hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Tambah</span>
                  </button>
                </div>
              </div>

              <div className="my-1 h-px bg-slate-100 dark:bg-slate-800/50"></div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nomor Kamar
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 101, 102A"
                  {...register("room_number", {
                    required: "Nomor kamar wajib diisi",
                  })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.room_number && (
                  <span className="mt-1 block text-xs font-bold text-red-500">
                    {errors.room_number.message as string}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tipe Kamar
                </label>
                <select
                  {...register("room_type_id", {
                    required: "Silakan pilih tipe kamar",
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">-- Pilih Tipe --</option>
                  {roomTypesData?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.room_type_id && (
                  <span className="mt-1 block text-xs font-bold text-red-500">
                    {errors.room_type_id.message as string}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Status Awal
                </label>
                <select
                  {...register("status")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="available">Tersedia (Bisa Dipesan)</option>
                  <option value="occupied">Terisi (Ada Penghuni)</option>
                  <option value="maintenance">
                    Perbaikan (Rusak/Renovasi)
                  </option>
                </select>
              </div>

              <div className="mt-6 flex shrink-0 justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
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
