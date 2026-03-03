import { useForm } from "react-hook-form";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../services/api";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const forgotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/auth/forgot-password", data);
      return response.data;
    },
    onSuccess: (responseData) => {
      toast.success(
        responseData.message ||
          "Link reset password telah dikirim ke email Anda!",
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal mengirim link reset password.",
      );
    },
  });

  const onSubmit = (data: any) => {
    forgotMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[420px] animate-fade-in">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary-600">
              Lupa Password?
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Masukkan email Anda dan kami akan mengirimkan link untuk mereset
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                <p className="mt-1 ml-1 text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={forgotMutation.isPending}>
                Kirim Link Reset <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="mt-8 flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </button>
      </div>
    </div>
  );
}
