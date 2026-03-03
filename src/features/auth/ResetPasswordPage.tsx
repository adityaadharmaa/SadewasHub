import { useForm } from "react-hook-form";
import { Lock, Mail, CheckCircle2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../services/api";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  // Menangkap token dari path URL (misal: /reset-password/123xyz)
  const { token } = useParams();
  // Menangkap query email (misal: ?email=user@email.com) bawaan dari Laravel
  const [searchParams] = useSearchParams();
  const defaultEmail = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { email: defaultEmail },
  });

  const password = watch("password", "");

  const resetMutation = useMutation({
    // Ubah mutationFn agar langsung menerima payload yang sudah utuh
    mutationFn: async (payload: any) => {
      const response = await api.post("/auth/reset-password", payload);
      return response.data;
    },
    onSuccess: (responseData) => {
      toast.success(responseData.message || "Password berhasil diubah!");
      navigate("/login");
    },
    onError: (error: any) => {
      // Menangkap error validasi dari Laravel agar lebih spesifik
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        const firstError = Object.values(serverErrors)[0] as string[];
        toast.error(firstError[0]);
      } else {
        toast.error(error.response?.data?.message || "Gagal mereset password.");
      }
    },
  });

  const onSubmit = (data: any) => {
    // 1. Tangkap ulang token secara langsung dari URL saat tombol ditekan
    const urlToken = searchParams.get("token");

    if (!urlToken) {
      toast.error(
        "Token tidak ditemukan di URL. Silakan klik ulang link dari email Anda.",
      );
      return;
    }

    // 2. Susun payload secara eksplisit agar tidak ada data yang tertinggal
    const payload = {
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      token: urlToken, // <- INI YANG TADI HILANG
    };

    // 3. Kirim ke backend
    resetMutation.mutate(payload);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[420px] animate-fade-in py-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary-600">
              Buat Password Baru
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Silakan masukkan password baru Anda di bawah ini.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Input Email (Readonly jika sudah dapat dari URL) */}
            <div>
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                readOnly={!!defaultEmail}
                className={
                  defaultEmail
                    ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                    : ""
                }
                {...register("email", { required: "Email wajib diisi" })}
              />
            </div>

            {/* Input Password Baru */}
            <div>
              <Input
                label="Password Baru"
                type="password"
                icon={Lock}
                placeholder="Minimal 8 karakter"
                {...register("password", {
                  required: "Password wajib diisi",
                  minLength: { value: 8, message: "Minimal 8 karakter" },
                })}
              />
              {errors.password && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium">
                  {errors.password.message as string}
                </p>
              )}
            </div>

            {/* Input Konfirmasi Password */}
            <div>
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                icon={Lock}
                placeholder="Ulangi password"
                {...register("password_confirmation", {
                  required: "Konfirmasi password wajib diisi",
                  validate: (value) =>
                    value === password || "Password tidak cocok",
                })}
              />
              {errors.password_confirmation && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium">
                  {errors.password_confirmation.message as string}
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" isLoading={resetMutation.isPending}>
                Simpan Password <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
