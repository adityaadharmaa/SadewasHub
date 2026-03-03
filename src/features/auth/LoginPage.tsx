import { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

// Import komponen kustom kita
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (responseData) => {
      const { user, token } = responseData.data;
      setAuth(user, token);
      navigate(
        user.roles === "admin" ? "/admin/dashboard" : "/tenant/dashboard",
      );
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || "Koneksi gagal. Silakan coba lagi.",
      );
    },
  });

  const onSubmit = (data: any) => {
    setErrorMessage("");
    loginMutation.mutate(data);
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${baseUrl}/auth/${provider}/redirect`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-105 animate-fade-in">
        <div className="rounded-4xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary-600">
              SadewasColiving
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Masuk untuk mengelola akun Anda
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-600 ring-1 ring-red-100">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Menggunakan Komponen Reusable Input */}
            <div>
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="nama@contoh.com"
                {...register("email", { required: "Email wajib diisi" })}
              />
              {errors.email && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                {...register("password", { required: "Password wajib diisi" })}
              />
              {errors.password && (
                <p className="mt-1 ml-1 text-xs text-red-500 font-medium">
                  {errors.password.message as string}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                Ingat saya
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Lupa password?
              </a>
            </div>

            {/* Menggunakan Komponen Reusable Button */}
            <Button type="submit" isLoading={loginMutation.isPending}>
              Masuk{" "}
              {!loginMutation.isPending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <hr className="flex-1 border-slate-100" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Atau masuk dengan
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          {/* Menggunakan Komponen Reusable Button untuk Social */}
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
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>
  );
}
