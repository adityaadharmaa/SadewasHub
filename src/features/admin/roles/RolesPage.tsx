import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  CheckSquare,
  Square,
  Lock,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

// --- TYPES ---
interface Permission {
  id: string | number;
  name: string;
}

interface Role {
  id: string | number;
  name: string;
  permissions?: Permission[];
  created_at?: string;
}

export default function RolesPage() {
  const queryClient = useQueryClient();

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Role | null>(null);

  // Form Handling
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", permissions: [] as string[] },
  });

  const selectedPermissions = watch("permissions") || [];

  // --- FETCH DATA ---
  const {
    data: rolesData,
    isLoading: rolesLoading,
    isError: rolesError,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.get(`/admin/roles`);
      return response.data;
    },
  });

  const { data: permsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await api.get(`/admin/permissions`);
      return response.data;
    },
  });

  // --- MUTATIONS ---
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingData) {
        const res = await api.put(`/admin/roles/${editingData.id}`, payload);
        return res.data;
      } else {
        const res = await api.post(`/admin/roles`, payload);
        return res.data;
      }
    },
    onSuccess: (res) => {
      toast.success(res.message || "Role berhasil disimpan!");
      setIsModalOpen(false);
      reset();
      setEditingData(null);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      const msgs = error.response?.data?.errors;
      if (msgs && msgs.name) toast.error(msgs.name[0]);
      else
        toast.error(error.response?.data?.message || "Gagal menyimpan role.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/admin/roles/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Role berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus role.");
    },
  });

  // --- HANDLERS ---
  const openModalForCreate = () => {
    setEditingData(null);
    reset({ name: "", permissions: [] });
    setIsModalOpen(true);
  };

  const openModalForEdit = (role: Role) => {
    setEditingData(role);
    const rolePerms = role.permissions?.map((p) => p.name) || [];
    reset({ name: role.name, permissions: rolePerms });
    setIsModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (role.name === "admin" || role.name === "tenant") {
      toast.error("Role bawaan sistem tidak boleh dihapus!");
      return;
    }
    if (window.confirm(`Yakin ingin menghapus role '${role.name}'?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const onSubmit = (formData: any) => {
    saveMutation.mutate(formData);
  };

  const togglePermission = (permName: string) => {
    if (selectedPermissions.includes(permName)) {
      setValue(
        "permissions",
        selectedPermissions.filter((p: string) => p !== permName),
      );
    } else {
      setValue("permissions", [...selectedPermissions, permName]);
    }
  };

  // --- UI HELPERS ---
  // Fungsi untuk mengubah "manage-rooms" menjadi "Manage Rooms"
  const formatPermissionName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // --- DATA EXTRACTORS ---
  let rolesList: Role[] = [];
  if (Array.isArray(rolesData?.data)) rolesList = rolesData.data;

  let permissionsList: Permission[] = [];
  if (Array.isArray(permsData?.data)) permissionsList = permsData.data;

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white dark:bg-[#1e293b]/30 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl text-primary-600 dark:text-primary-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            Manajemen Role & Akses
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
            Tentukan peran pengguna dan batasi menu apa saja yang dapat mereka
            lihat atau ubah di dalam Sadewas Hub.
          </p>
        </div>

        <button
          onClick={openModalForCreate}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-md active:scale-95 shadow-primary-500/20"
        >
          <Plus className="h-4 w-4" /> Tambah Role Baru
        </button>
      </div>

      {/* --- CONTENT GRID --- */}
      {rolesLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-[#0f172a] rounded-4xl border border-slate-200/60 dark:border-slate-800/60">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
          <p className="font-bold">Membaca struktur otorisasi...</p>
        </div>
      ) : rolesError ? (
        <div className="py-24 flex flex-col items-center justify-center text-red-500 bg-white dark:bg-[#0f172a] rounded-4xl border border-slate-200/60 dark:border-slate-800/60">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p className="font-bold">Gagal memuat data role.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rolesList.map((role: Role) => {
            const isSystemRole =
              role.name === "admin" || role.name === "tenant";

            return (
              <div
                key={role.id}
                className="group flex flex-col h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-700/60 dark:bg-[#1e293b]/40 dark:hover:shadow-black/50 dark:hover:border-slate-600/80 relative"
              >
                {/* Efek Garis Atas Berwarna */}
                <div
                  className={`h-1.5 w-full ${role.name === "admin" ? "bg-red-500" : role.name === "tenant" ? "bg-blue-500" : "bg-primary-500"}`}
                />

                {/* Header Card */}
                <div className="flex items-start justify-between p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        role.name === "admin"
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : role.name === "tenant"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            : "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                      }`}
                    >
                      {isSystemRole ? (
                        <Lock className="h-6 w-6" />
                      ) : (
                        <ShieldCheck className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
                        {role.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Key className="h-3 w-3" />
                        {role.permissions?.length || 0} Izin Akses
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => openModalForEdit(role)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                      title="Edit Hak Akses"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!isSystemRole && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                        title="Hapus Role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 h-px bg-slate-100 dark:bg-slate-700/50" />

                {/* Body Card (Daftar Permissions) */}
                <div className="p-6 flex-1 bg-slate-50/30 dark:bg-transparent">
                  {role.permissions && role.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm.id}
                          className="inline-flex items-center rounded-lg bg-primary-50/80 px-2.5 py-1.5 text-[11px] font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300 ring-1 ring-inset ring-primary-500/20 dark:ring-primary-500/20 shadow-sm"
                        >
                          {formatPermissionName(perm.name)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60 py-4">
                      <ShieldCheck className="h-8 w-8 text-slate-400" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Belum Ada Akses
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#0f172a] ring-1 ring-slate-100 dark:ring-slate-800 max-h-[90vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-transparent">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary-500" />
                  {editingData ? "Edit Konfigurasi Role" : "Buat Role Baru"}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Centang kotak untuk memberikan izin akses fitur.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-[#1e293b] dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="overflow-y-auto custom-scrollbar flex-1 flex flex-col"
            >
              <div className="p-6 space-y-8">
                {/* Input Nama Role */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nama Role / Jabatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: marketing, finance, security"
                    disabled={
                      editingData?.name === "admin" ||
                      editingData?.name === "tenant"
                    }
                    {...register("name", { required: "Nama role wajib diisi" })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-[#1e293b] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed lowercase"
                  />
                  {errors.name && (
                    <span className="mt-1.5 block text-xs font-bold text-red-500">
                      {errors.name.message as string}
                    </span>
                  )}
                  {(editingData?.name === "admin" ||
                    editingData?.name === "tenant") && (
                    <p className="mt-2 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 w-fit px-2 py-1 rounded-md flex items-center gap-1.5">
                      <Lock className="h-3 w-3" /> Nama identifier role sistem
                      dikunci secara permanen.
                    </p>
                  )}
                </div>

                {/* Pemilihan Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <label className="block text-sm font-black tracking-tight text-slate-900 dark:text-white">
                      Delegasi Izin Fitur (Permissions)
                    </label>
                    <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg dark:bg-primary-500/10 dark:text-primary-400 ring-1 ring-primary-500/20">
                      {selectedPermissions.length} Dipilih
                    </span>
                  </div>

                  {permissionsList.length === 0 ? (
                    <div className="p-8 text-center text-sm font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      Memuat daftar struktur sistem...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissionsList.map((perm) => {
                        const isChecked = selectedPermissions.includes(
                          perm.name,
                        );
                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.name)}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
                              isChecked
                                ? "border-primary-500 bg-primary-50/80 dark:border-primary-500/50 dark:bg-primary-500/10 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1e293b]/50 dark:hover:border-slate-600 dark:hover:bg-[#1e293b]"
                            }`}
                          >
                            <div
                              className={`shrink-0 ${isChecked ? "text-primary-600 dark:text-primary-400" : "text-slate-300 dark:text-slate-600"}`}
                            >
                              {isChecked ? (
                                <CheckSquare className="h-5 w-5" />
                              ) : (
                                <Square className="h-5 w-5" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-bold leading-tight ${isChecked ? "text-primary-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                            >
                              {formatPermissionName(perm.name)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="mt-auto flex shrink-0 justify-end gap-3 border-t border-slate-100 p-6 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0f172a]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2.5 rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-500/30"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {editingData ? "Simpan Perubahan" : "Konfirmasi & Buat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
