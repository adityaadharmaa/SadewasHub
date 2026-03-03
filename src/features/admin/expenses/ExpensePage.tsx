import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Wallet,
  Receipt,
  Calendar,
  FileText,
  Image as ImageIcon,
  DoorClosed,
  ArrowDownCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

// --- TYPES ---
interface Attachment {
  id: string;
  file_url: string;
  file_type: string;
}

interface Expense {
  id: string | number;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  category: "operational" | "maintenance" | "salary" | "tax" | "other";
  room?: {
    id: string;
    room_number: string;
  };
  attachments?: Attachment[];
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State Modal Bukti Struk
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // --- FETCH DATA (Keuangan & Beban) ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["expenses", page, searchTerm, categoryFilter],
    queryFn: async () => {
      const response = await api.get(`/admin/expenses`, {
        params: {
          search: searchTerm,
          category: categoryFilter || undefined,
          per_page: 10,
          page,
        },
      });
      return response.data;
    },
  });

  // --- FETCH ROOMS (Untuk Dropdown Pilihan Kamar di Form) ---
  const { data: roomsData } = useQuery({
    queryKey: ["roomsListForExpense"],
    queryFn: async () => {
      const res = await api.get("/admin/rooms", { params: { per_page: 100 } });
      return res.data;
    },
  });

  // --- MUTATIONS ---
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Karena ada file upload, kita WAJIB menggunakan FormData, bukan JSON biasa
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("amount", payload.amount);
      formData.append("expense_date", payload.expense_date);
      formData.append("category", payload.category);

      if (payload.description)
        formData.append("description", payload.description);
      if (payload.room_id) formData.append("room_id", payload.room_id);

      // Lampirkan file struk jika user memilih file
      if (selectedFile) {
        formData.append("receipt", selectedFile);
      }

      // Endpoint API POST Expense
      const res = await api.post(`/admin/expenses`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Pengeluaran berhasil dicatat!");
      setIsModalOpen(false);
      reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal menyimpan data pengeluaran.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/admin/expenses/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Data pengeluaran berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // --- HANDLERS ---
  const onSubmit = (formData: any) => {
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: string | number) => {
    if (
      window.confirm(
        "Yakin ingin menghapus catatan pengeluaran ini beserta struknya?",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  // --- HELPERS ---
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "operational":
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            Operasional
          </span>
        );
      case "maintenance":
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
            Perbaikan/Maintenance
          </span>
        );
      case "salary":
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            Gaji Staf
          </span>
        );
      case "tax":
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            Pajak / Iuran
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Lainnya
          </span>
        );
    }
  };

  let expensesList: Expense[] = [];
  if (Array.isArray(data?.data)) expensesList = data.data;

  // Hitung Total Pengeluaran di Halaman Ini
  const totalExpenseOnPage = expensesList.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary-500" /> Keuangan & Beban
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Catat dan pantau seluruh pengeluaran operasional (Listrik, Air,
            Gaji, Perbaikan).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-8 text-sm font-bold text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-slate-200"
          >
            <option value="">Semua Kategori</option>
            <option value="operational">
              Operasional (Listrik/Air/Internet)
            </option>
            <option value="maintenance">Perbaikan (Maintenance)</option>
            <option value="salary">Gaji Karyawan</option>
            <option value="tax">Pajak</option>
          </select>

          <button
            onClick={() => {
              reset({
                expense_date: new Date().toISOString().split("T")[0],
                category: "operational",
              });
              setSelectedFile(null);
              setIsModalOpen(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* --- SUMMARY WIDGET --- */}
      <div className="bg-white dark:bg-[#1e293b]/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
            <ArrowDownCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Beban (Halaman Ini)
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(totalExpenseOnPage)}
            </p>
          </div>
        </div>

        <div className="relative hidden sm:flex w-64 items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul beban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#0f172a] dark:text-slate-200"
          />
        </div>
      </div>

      {/* --- TABLE DATA --- */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/50 dark:bg-[#0f172a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700/80 dark:bg-[#1e293b]/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Tanggal & Judul</th>
                <th className="px-6 py-4 font-extrabold">Kategori & Terkait</th>
                <th className="px-6 py-4 font-extrabold">Total Biaya</th>
                <th className="px-6 py-4 font-extrabold">Bukti Struk</th>
                <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/80">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-3" />
                    Memuat data pengeluaran...
                  </td>
                </tr>
              )}

              {!isLoading && !isError && expensesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Wallet className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">
                      Catatan Bersih!
                    </p>
                    <p className="text-sm mt-1 text-slate-400">
                      Tidak ada pengeluaran yang tercatat.
                    </p>
                  </td>
                </tr>
              ) : (
                expensesList.map((item: Expense) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1e293b]/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.expense_date).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        {getCategoryBadge(item.category)}
                        {item.room && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <DoorClosed className="h-3 w-3" /> Kamar{" "}
                            {item.room.room_number}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-black text-red-500">
                        - {formatRupiah(item.amount)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.attachments && item.attachments.length > 0 ? (
                        <button
                          onClick={() =>
                            setSelectedReceipt(item.attachments![0].file_url)
                          }
                          className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20"
                        >
                          <Receipt className="h-3.5 w-3.5" /> Lihat Nota
                        </button>
                      ) : (
                        <span className="text-xs italic text-slate-400">
                          Tanpa Nota
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 ml-auto"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* --- MODAL FORM TAMBAH PENGELUARAN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-lg scale-100 flex-col overflow-hidden rounded-[24px] bg-white p-7 shadow-2xl ring-1 ring-slate-100 animate-in zoom-in-95 dark:bg-[#0f172a] dark:ring-slate-800 sm:max-h-[90vh]">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary-500" />
                Catat Pengeluaran Baru
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
                  Judul Pengeluaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Token Listrik Bulanan"
                  {...register("title", { required: "Judul wajib diisi" })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                />
                {errors.title && (
                  <span className="mt-1 block text-xs font-bold text-red-500">
                    {errors.title.message as string}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="500000"
                    {...register("amount", {
                      required: "Nominal wajib diisi",
                      min: 1,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                  />
                  {errors.amount && (
                    <span className="mt-1 block text-xs font-bold text-red-500">
                      {errors.amount.message as string}
                    </span>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    {...register("expense_date", {
                      required: "Tanggal wajib diisi",
                    })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kategori
                  </label>
                  <select
                    {...register("category")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                  >
                    <option value="operational">
                      Operasional (Listrik/Air)
                    </option>
                    <option value="maintenance">Perbaikan / Maintenance</option>
                    <option value="salary">Gaji Karyawan</option>
                    <option value="tax">Pajak / Iuran Lingkungan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kamar Terkait
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] dark:bg-slate-800">
                      OPSIONAL
                    </span>
                  </label>
                  <select
                    {...register("room_id")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white"
                  >
                    <option value="">-- Bukan untuk kamar --</option>
                    {roomsData?.data?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        Kamar {r.room_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Upload Struk / Nota (Gambar/PDF)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 outline-none transition-all focus:border-primary-500 dark:border-slate-700 dark:bg-[#1e293b]/50 dark:text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  {...register("description")}
                  placeholder="Opsional: Tulis detail pengeluaran..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white custom-scrollbar"
                />
              </div>

              <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700/50">
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
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LIHAT NOTA --- */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Tampilkan gambar atau link PDF */}
            {selectedReceipt.endsWith(".pdf") ? (
              <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                <FileText className="h-16 w-16 text-primary-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Dokumen Nota (PDF)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Nota ini disimpan dalam format PDF dan tidak dapat dipratinjau
                  secara langsung di sini.
                </p>
                <a
                  href={selectedReceipt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                >
                  Buka Dokumen PDF
                </a>
              </div>
            ) : (
              <img
                src={selectedReceipt}
                alt="Bukti Nota Pengeluaran"
                className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML =
                    '<div class="bg-white dark:bg-[#0f172a] p-8 rounded-2xl text-center"><p class="text-slate-500 font-medium">Gambar nota tidak dapat dimuat atau path Storage Link belum diatur.</p></div>';
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
