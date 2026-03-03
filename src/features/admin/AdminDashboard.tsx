import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  Ticket,
  Home,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import api from "../../services/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatCompactNumber = (number: number) => {
  if (number < 1000) return number.toString();
  if (number >= 1000 && number < 1000000)
    return (number / 1000).toFixed(1) + "K";
  if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
  return number.toString();
};

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const response = await api.get("/admin/dashboard");
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary-500" />
        <p className="font-medium animate-pulse">
          Menyiapkan ruang kerja Anda...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-red-400">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p className="font-medium">
          Gagal memuat data. Silakan muat ulang halaman.
        </p>
      </div>
    );
  }

  const chartLabels = data.charts.financial_trend.labels;
  const revenueData = data.charts.financial_trend.revenue_data;
  const expenseData = data.charts.financial_trend.expense_data;
  const profitData = data.charts.financial_trend.profit_data;

  const rechartsData = chartLabels.map((label: string, index: number) => ({
    name: label,
    Pendapatan: revenueData[index],
    Pengeluaran: expenseData[index],
    Laba: profitData[index],
  }));

  // Style Tooltip Kustom yang lebih Mewah (Glassmorphism)
  const customTooltipStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    fontWeight: 600,
    padding: "12px 16px",
    color: "#0f172a",
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* HEADER */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Ringkasan performa bisnis Sadewas Coliving hari ini.
        </p>
      </div>

      {/* STAT CARDS - Desain Premium dengan Ambient Background */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Revenue */}
        <div className="group relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900 dark:ring-slate-800">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20 dark:bg-emerald-500/5"></div>

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Pendapatan Bulan Ini
            </p>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10 mt-6 flex items-end gap-2">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.financials.formatted_revenue}
            </h3>
          </div>
        </div>

        {/* Card 2: Active Tenants */}
        <div className="group relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900 dark:ring-slate-800">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-all group-hover:bg-blue-500/20 dark:bg-blue-500/5"></div>

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Penyewa Aktif
            </p>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10 mt-6 flex items-end gap-2">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.tenants.active_now}
            </h3>
            <span className="mb-1 text-sm font-bold text-slate-400">
              Penghuni
            </span>
          </div>
        </div>

        {/* Card 3: Occupancy Rate */}
        <div className="group relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900 dark:ring-slate-800">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-all group-hover:bg-purple-500/20 dark:bg-purple-500/5"></div>

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Okupansi Kamar
            </p>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Home className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10 mt-6 flex items-end gap-3">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.rooms.occupancy_rate_percentage}%
            </h3>
            <div className="mb-1 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <ArrowUpRight className="h-3 w-3" />
              {data.rooms.occupied}/{data.rooms.total} Terisi
            </div>
          </div>
        </div>

        {/* Card 4: Pending Tickets */}
        <div className="group relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900 dark:ring-slate-800">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20 dark:bg-amber-500/5"></div>

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Tiket Terbuka
            </p>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Ticket className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10 mt-6 flex items-end gap-3">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.tickets.requires_action}
            </h3>
            {data.tickets.requires_action > 0 ? (
              <span className="mb-1.5 flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle className="h-3 w-3" /> Perlu Tindakan
              </span>
            ) : (
              <span className="mb-1 text-sm font-bold text-slate-400">
                Tiket
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart 1: Revenue Area Chart */}
        <div className="rounded-[24px] bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-8">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tren Pendapatan
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Pergerakan uang masuk 6 bulan terakhir
            </p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rechartsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Grid dibuat lebih transparan agar terlihat bersih */}
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#f1f5f9"
                  className="dark:stroke-slate-800"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600 }}
                  tickFormatter={formatCompactNumber}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  itemStyle={{ color: "#0ea5e9", fontWeight: "800" }}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Area
                  type="monotone"
                  dataKey="Pendapatan"
                  stroke="#0ea5e9"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Profit vs Expense Bar Chart */}
        <div className="rounded-[24px] bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-8">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Laba & Pengeluaran
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Perbandingan bersih antara laba dan beban kos
            </p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rechartsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#f1f5f9"
                  className="dark:stroke-slate-800"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600 }}
                  tickFormatter={formatCompactNumber}
                />
                <Tooltip
                  cursor={{ fill: "rgba(241, 245, 249, 0.4)" }}
                  contentStyle={customTooltipStyle}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "14px",
                    fontWeight: 700,
                    paddingTop: "20px",
                    color: "#64748b",
                  }}
                />
                {/* Radius dibesarkan agar sangat membulat, gaya modern */}
                <Bar
                  dataKey="Pengeluaran"
                  fill="#cbd5e1"
                  radius={[8, 8, 4, 4]}
                  barSize={14}
                  className="dark:fill-slate-700"
                />
                <Bar
                  dataKey="Laba"
                  fill="#6366f1"
                  radius={[8, 8, 4, 4]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
