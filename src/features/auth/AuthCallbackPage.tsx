import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const urlError = searchParams.get("error");

    if (urlError) {
      setError(urlError);
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!token) {
      setError("Token autentikasi tidak ditemukan. Silakan login kembali.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    const fetchUserProfil = async () => {
      try {
        const response = await api.get("/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 1. Ambil data mentah dari API (/profile/me)
        const responseData = response.data.data;

        // 2. Rangkai data user agar sesuai dengan format authStore (gabungkan roles & permissions)
        const user = {
          ...responseData.user,
          roles: responseData.roles || [],
          permissions: responseData.permissions || [],
        };

        // 3. Simpan ke Global State
        setAuth(user, token);

        // 4. LOGIKA NAVIGASI YANG BENAR (Mengecek isi Array)
        if (user.roles.includes("tenant")) {
          navigate("/tenant/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch (error: any) {
        setError("Gagal memverifikasi sesi. Sesi mungkin kedaluwarsa.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    fetchUserProfil();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-100 animate-fade-in">
        <div className="flex flex-col items-center justify-center rounded-4xl bg-white p-10 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all">
          {error ? (
            <div className="flex flex-col items-center animate fade-in">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 ring-1 ring-red-100">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">
                Autentikasi Gagal
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">{error}</p>
              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                Mengarahkan kembali ke login...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">
                Autentikasi Berhasil
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Menyiapkan ruang kerja Anda dengan aman...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
