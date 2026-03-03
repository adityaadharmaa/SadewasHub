import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Home,
  X,
  BedDouble,
  Wifi,
  Tag,
  CalendarDays,
  Ticket,
  ShieldAlert,
} from "lucide-react";
import Logo from "../../assets/logo.png";
import { useUIStore } from "../../store/uiStore";

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, closeSidebar } = useUIStore();

  // Struktur Menu yang sudah dikelompokkan
  const menuGroups = [
    {
      title: "Main Menu",
      items: [
        { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Data Booking", path: "/admin/bookings", icon: CalendarDays },
        { name: "Keuangan & Beban", path: "/admin/expenses", icon: Receipt },
        { name: "Tiket Bantuan", path: "/admin/tickets", icon: Ticket },
      ],
    },
    {
      title: "Master Data",
      items: [
        { name: "Manajemen Role", path: "/admin/roles", icon: ShieldAlert },
        { name: "Manajemen Kamar", path: "/admin/rooms", icon: Home },
        { name: "Tipe Kamar", path: "/admin/room-types", icon: BedDouble },
        { name: "Fasilitas Kamar", path: "/admin/facilities", icon: Wifi },
        { name: "Data Penghuni", path: "/admin/users", icon: Users },
        { name: "Promo & Diskon", path: "/admin/promos", icon: Tag },
      ],
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Header Sidebar */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-transparent">
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          {/* Wadah Lingkaran Tanpa Absolute */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-md bg-black">
            <img
              src={Logo}
              alt="Sadewas Coliving"
              // Cukup gunakan scale-110 (110%) agar pas di garis emas
              className="h-full w-full object-cover scale-110"
            />
          </div>

          <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            SadewasHub
          </span>
        </Link>

        {/* Tombol Close (Hanya muncul di Mobile) */}
        <button
          onClick={closeSidebar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 custom-scrollbar">
        {menuGroups.map((group, index) => (
          <div key={index}>
            {/* Judul Kategori (Main Menu / Master Data) */}
            <h3 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.title}
            </h3>

            {/* Daftar Link di dalam kategori */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      // Otomatis tutup sidebar di mobile saat menu diklik
                      if (window.innerWidth < 1024) closeSidebar();
                    }}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 transition-colors ${
                        isActive
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
