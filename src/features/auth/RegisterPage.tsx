import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

// Import komponen kustom kita
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";

export default function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  // Memantau nilai password untuk validasi konfirmasi password
  const password = watch("password", "");

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/auth/register", data);
      return response.data;
    },
    onSuccess: (responseData) => {
      const { user, token } = responseData.data;
      setAuth(user, token);

      // Karena register otomatis menjadi 'tenant', arahkan ke dashboard tenant
      navigate("/tenant/dashboard");
    },
    onError: (error: any) => {
      // Menangkap error validasi dari Laravel (misal: Email sudah digunakan)
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        // Ambil pesan error pertama dari object errors
        const firstError = Object.values(serverErrors)[0] as string[];
        setErrorMessage(firstError[0]);
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Registrasi gagal. Silakan coba lagi.",
        );
      }
    },
  });

  const onSubmit = (data: any) => {
    setErrorMessage("");
    registerMutation.mutate(data);
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${baseUrl}/auth/${provider}/redirect`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-105 animate-fade-in py-8">
        <div className="rounded-4xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary-600">
              Daftar Sadewas
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Buat akun untuk mulai mencari hunian
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-600 ring-1 ring-red-100 animate-in fade-in zoom-in-95">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Input Nama Lengkap */}
            <div>
              <Input
                label="Nama Lengkap"
                type="text"
                icon={User}
                placeholder="John Doe"
                {...register("full_name", {
                  required: "Nama lengkap wajib diisi",
                })}
              />
              {errors.full_name && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.full_name.message as string}
                </p>
              )}
            </div>

            {/* Input Email */}
            <div>
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="nama@contoh.com"
                {...register("email", {
                  required: "Email wajib diisi",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email tidak valid",
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div>
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="Minimal 8 karakter"
                {...register("password", {
                  required: "Password wajib diisi",
                  minLength: {
                    value: 8,
                    message: "Password minimal 8 karakter",
                  },
                })}
              />
              {errors.password && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.password.message as string}
                </p>
              )}
            </div>

            {/* Input Konfirmasi Password */}
            <div>
              <Input
                label="Konfirmasi Password"
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
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.password_confirmation.message as string}
                </p>
              )}
            </div>

            {/* Tombol Daftar */}
            <div className="pt-2">
              <Button type="submit" isLoading={registerMutation.isPending}>
                Daftar Sekarang{" "}
                {!registerMutation.isPending && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <hr className="flex-1 border-slate-100" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Atau daftar dengan
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin("google")}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="18"
                  viewBox="0 0 488 512"
                  className="fill-current text-slate-700"
                >
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                </svg>
              }
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin("github")}
              icon={<Github className="h-4 w-4" />}
            >
              GitHub
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <a
            href="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            Masuk sekarang
          </a>
        </p>
      </div>
    </div>
  );
}
