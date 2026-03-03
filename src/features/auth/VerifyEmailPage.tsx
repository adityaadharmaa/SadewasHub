import { useState, useEffect } from "react";
import { Mail, ArrowRight, LogOut, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner"; // <-- IMPORT TOAST
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/shared/Button";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, setAuth, token } = useAuthStore();

  const verificationUrl = searchParams.get("url");

  // Mutasi Verifikasi (Otomatis dari klik email)
  const verifyEmailMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await api.get(url);
      return response.data;
    },
    onSuccess: (responseData) => {
      setIsVerifying(false);

      // 1. Munculkan Toast Sukses
      toast.success(responseData.message || "Email berhasil diverifikasi!");

      // 2. Update status user di state
      if (user && token) {
        setAuth(
          { ...user, profile: { ...user.profile, is_verified: true } },
          token,
        );
      }

      // 3. Langsung arahkan ke Dashboard (Toast akan tetap terlihat di Dashboard)
      navigate(
        user?.roles === "admin" ? "/admin/dashboard" : "/tenant/dashboard",
        { replace: true },
      );
    },
    onError: (error: any) => {
      setIsVerifying(false);
      // Munculkan Toast Error
      toast.error(
        error.response?.data?.message ||
          "Link verifikasi tidak valid atau sudah kedaluwarsa.",
      );

      // Hapus URL dari address bar agar error tidak berulang saat di-refresh
      navigate("/verify-email", { replace: true });
    },
  });

  // Mutasi Kirim Ulang Link
  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/auth/email/resend");
      return response.data;
    },
    onSuccess: (responseData) => {
      toast.success(
        responseData.message ||
          "Link verifikasi baru telah dikirim ke email Anda!",
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal mengirim ulang email.",
      );
    },
  });

  useEffect(() => {
    if (verificationUrl && !isVerifying) {
      setIsVerifying(true);
      verifyEmailMutation.mutate(verificationUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationUrl]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[420px] animate-fade-in text-center py-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all">
          {isVerifying ? (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-4 ring-primary-50/50">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          ) : (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-4 ring-primary-50/50">
              <Mail className="h-10 w-10" />
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isVerifying ? "Memverifikasi Email..." : "Periksa Email Anda"}
          </h1>

          <p className="mt-3 mb-8 text-sm leading-relaxed text-slate-500">
            {isVerifying
              ? "Mohon tunggu sebentar, kami sedang mencocokkan data Anda."
              : `Kami telah mengirimkan link verifikasi ke ${user.email}`}
          </p>

          {!isVerifying && !verificationUrl && (
            <div className="space-y-4">
              <Button
                onClick={() => resendMutation.mutate()}
                isLoading={resendMutation.isPending}
              >
                Kirim Ulang Link Email
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    user.roles === "admin"
                      ? "/admin/dashboard"
                      : "/tenant/dashboard",
                  )
                }
              >
                Masuk ke Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {!isVerifying && (
          <button
            onClick={handleLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
            Gunakan akun lain
          </button>
        )}
      </div>
    </div>
  );
}
