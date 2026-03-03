import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api"; // Sesuaikan path ini dengan struktur folder Anda
import {
  MapPin,
  ArrowRight,
  LogIn,
  UserPlus,
  Home,
  CheckCircle2,
  Loader2,
  Wifi,
  Wind,
  ShieldCheck,
  Car,
  Tv,
  Coffee,
  BedDouble,
  Droplets,
} from "lucide-react";
import React from "react";

// --- HELPER UNTUK MAP IKON DARI STRING KE LUCIDE ICON ---
// Karena di database icon berupa string (misal: 'wifi', 'wind'), kita perlu me-mappingnya
const IconMapper = ({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) => {
  const icons: Record<string, React.ReactNode> = {
    wifi: <Wifi className={className} />,
    wind: <Wind className={className} />, // untuk AC
    shield: <ShieldCheck className={className} />,
    car: <Car className={className} />, // untuk Parkiran
    tv: <Tv className={className} />,
    coffee: <Coffee className={className} />, // untuk Dapur/Cafe
    bed: <BedDouble className={className} />,
    droplet: <Droplets className={className} />, // untuk Kamar Mandi/Water Heater
    // Fallback jika ikon tidak ditemukan
    default: <CheckCircle2 className={className} />,
  };

  const normalizedIcon = iconName?.toLowerCase() || "default";
  return <>{icons[normalizedIcon] || icons["default"]}</>;
};

export default function LandingPage() {
  const navigate = useNavigate();

  // --- FETCH DATA FASILITAS DARI DATABASE ---
  const { data: facilitiesData, isLoading } = useQuery({
    queryKey: ["publicFacilities"],
    queryFn: async () => {
      // Memanggil endpoint publik yang baru saja kita buat
      const response = await api.get("/public/facilities");
      return response.data.data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary-500 selection:text-white flex flex-col">
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-b from-primary-600 to-blue-800 text-white shadow-lg shadow-primary-500/30">
              <Home className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Sadewas<span className="text-primary-600">Hub</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors"
            >
              <LogIn className="h-4 w-4" /> Masuk
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30"
            >
              <UserPlus className="h-4 w-4" /> Daftar Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white pt-16 sm:pt-24 lg:pt-32 pb-16">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            ></div>
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary-600 ring-1 ring-primary-500/20 mb-6 animate-fade-in">
                <MapPin className="h-3 w-3" /> Berlokasi Strategis di Bali
              </span>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl mb-6 animate-in slide-in-from-bottom-4 duration-500">
                Kenyamanan Ekstra, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-blue-600">
                  Layaknya Rumah Sendiri.
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 mb-10 animate-in slide-in-from-bottom-5 duration-700">
                Sadewas Coliving menawarkan hunian kos eksklusif dengan
                fasilitas lengkap, aman, dan nyaman. Cocok untuk mahasiswa,
                pekerja, dan digital nomad yang menginginkan ketenangan di
                tengah aktivitas padat.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-6 duration-1000">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary-500/30 transition-all hover:-translate-y-1 hover:bg-primary-700 active:scale-95"
                >
                  Pesan Kamar Sekarang <ArrowRight className="h-5 w-5" />
                </button>
                <a
                  href="#fasilitas"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Lihat Fasilitas
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION (DINAMIS DARI DATABASE) --- */}
        <section id="fasilitas" className="bg-slate-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Fasilitas Premium Kami
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Semua yang Anda butuhkan sudah kami sediakan. Tinggal bawa koper
                dan nikmati kenyamanan Sadewas Coliving.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              </div>
            ) : facilitiesData && facilitiesData.length > 0 ? (
              // Desain Grid yang lebih rapat karena tidak ada deskripsi
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {facilitiesData.map((facility: any) => (
                  <div
                    key={facility.id}
                    className="flex flex-col items-center justify-center text-center rounded-[28px] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 hover:border-primary-100 group"
                  >
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      {/* Panggil komponen IconMapper yang kita buat di atas */}
                      <IconMapper
                        iconName={facility.icon}
                        className="h-7 w-7"
                      />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                      {facility.name}
                    </h3>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-10">
                Belum ada data fasilitas yang diinputkan.
              </div>
            )}
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="bg-slate-900 py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
            <h2 className="text-3xl font-black text-white sm:text-4xl mb-6">
              Siap Menjadi Bagian dari Sadewas?
            </h2>
            <p className="text-lg text-slate-300 mb-10">
              Pesan kamar impian Anda secara online sekarang. Tanpa ribet, tanpa
              antre. Sistem kami melayani Anda 24 jam.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-primary-500/20 transition-all hover:bg-primary-400 hover:scale-105 active:scale-95"
            >
              Buat Akun Penghuni
            </button>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Home className="h-5 w-5 text-slate-400" />
          <span className="text-lg font-black text-slate-800">
            Sadewas<span className="text-primary-600">Hub</span>
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} Sadewas Coliving Bali. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
