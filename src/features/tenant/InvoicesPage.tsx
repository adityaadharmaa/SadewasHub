import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  CalendarDays,
  CreditCard,
  XCircle,
  Download,
  Eye, // Icon untuk tombol detail
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate(); // Hook untuk navigasi halaman

  // --- FETCH DATA BOOKING ---
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myBookings", page],
    queryFn: async () => {
      const response = await api.get("/tenant/bookings", {
        params: { per_page: 10, page },
      });
      return response.data;
    },
  });

  const bookings = responseData?.data || [];
  const meta = responseData?.meta;

  // --- HELPER FORMAT ---
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // --- FUNGSI GENERATE PDF ---
  const generatePDF = (booking: any) => {
    const doc = new jsPDF();
    const invoiceId =
      booking.payments?.external_id ||
      `SC-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoiceStatus =
      booking.payments?.status === "paid"
        ? "LUNAS"
        : booking.payments?.status === "expired"
          ? "KEDALUWARSA / BATAL"
          : "BELUM DIBAYAR";

    // Header Perusahaan
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SADEWAS COLIVING", 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Pondok Sadewas, Perumahan Bumi Jimbaran Asri", 14, 28);
    doc.text("Badung, Bali - Indonesia", 14, 33);

    // Garis Pembatas
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Info Invoice
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE TAGIHAN", 14, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`No. Invoice : ${invoiceId}`, 14, 55);
    doc.text(`Tanggal     : ${formatDate(booking.created_at)}`, 14, 61);
    doc.text(`Status      : ${invoiceStatus}`, 14, 67);

    // Info Tenant (Penyewa)
    doc.setFont("helvetica", "bold");
    doc.text("Tagihan Kepada:", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(
      booking.user?.profile?.full_name || booking.user?.email || "Penghuni",
      120,
      61,
    );
    doc.text(booking.user?.email || "-", 120, 67);

    // Tabel Rincian Tagihan
    autoTable(doc, {
      startY: 75,
      head: [["Deskripsi", "Tipe Sewa", "Periode", "Total"]],
      body: [
        [
          `Sewa Kamar ${booking.room?.room_number || "-"}`,
          (booking.rent_type || "monthly").toUpperCase(),
          `${formatDate(booking.check_in_date)} s/d ${formatDate(booking.check_out_date)}`,
          formatRupiah(booking.total_amount),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42] }, // Warna header tabel (Slate 900)
    });

    // Total Akhir
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `TOTAL PEMBAYARAN: ${formatRupiah(booking.total_amount)}`,
      14,
      finalY,
    );

    // Footer Catatan
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Terima kasih telah mempercayakan kenyamanan Anda di Sadewas Coliving.",
      14,
      finalY + 15,
    );
    if (booking.notes) {
      doc.text(`Catatan Pemesan: ${booking.notes}`, 14, finalY + 20);
    }

    // Save File
    doc.save(`Invoice_${invoiceId}.pdf`);
  };

  const activeInvoices = bookings.filter(
    (b: any) => b.payments?.status === "pending" || b.status === "pending",
  );
  const historyInvoices = bookings.filter(
    (b: any) => b.payments?.status !== "pending" && b.status !== "pending",
  );

  if (isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="font-bold">Memuat daftar tagihan...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p className="font-bold">Gagal memuat data tagihan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Receipt className="h-7 w-7 text-primary-500" /> Tagihan Pembayaran
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Pantau dan bayar tagihan sewa kamar Anda di sini.
        </p>
      </div>

      {/* SECTION 1: TAGIHAN AKTIF (PENDING) */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" /> Menunggu Pembayaran
        </h2>

        {activeInvoices.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada tagihan aktif
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Semua tagihan Anda sudah lunas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInvoices.map((booking: any) => (
              <div
                key={booking.id}
                className="relative overflow-hidden rounded-[24px] border border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10 p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  <Clock className="h-3 w-3" /> Pending
                </div>

                <div className="mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sewa{" "}
                    {booking.rent_type === "daily"
                      ? "Harian"
                      : booking.rent_type === "weekly"
                        ? "Mingguan"
                        : "Bulanan"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    Kamar {booking.room?.room_number || "-"}
                  </h3>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" /> Periode
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatDate(booking.check_in_date)} -{" "}
                      {formatDate(booking.check_out_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Total Tagihan
                    </span>
                    <span className="font-black text-base text-primary-600 dark:text-primary-400">
                      {formatRupiah(booking.total_amount)}
                    </span>
                  </div>
                </div>

                {/* TOMBOL AKSI: DETAIL, BAYAR & DOWNLOAD */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/tenant/invoices/${booking.id}`)}
                    className="flex shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 p-3 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Lihat Detail Invoice"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={booking.payments?.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-xs font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-500/20"
                  >
                    Bayar <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => generatePDF(booking)}
                    className="flex shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 p-3 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: RIWAYAT TRANSAKSI */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
          Riwayat Transaksi
        </h2>

        <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#1e293b]/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">ID & Tanggal</th>
                  <th className="px-6 py-4">Kamar</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historyInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-xs font-medium text-slate-500"
                    >
                      Belum ada riwayat transaksi.
                    </td>
                  </tr>
                ) : (
                  historyInvoices.map((booking: any) => (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-900 dark:text-white">
                          #
                          {booking.payments?.external_id?.split("-")[1] ||
                            booking.id.substring(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(booking.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-700 dark:text-slate-300">
                          Kamar {booking.room?.room_number}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {booking.rent_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">
                        {formatRupiah(booking.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        {booking.status === "confirmed" ||
                        booking.payments?.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Lunas
                          </span>
                        ) : booking.status === "cancelled" ||
                          booking.payments?.status === "expired" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <XCircle className="h-3 w-3" /> Dibatalkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {booking.status}
                          </span>
                        )}
                      </td>

                      {/* TOMBOL AKSI DI RIWAYAT */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/tenant/invoices/${booking.id}`)
                            }
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] uppercase tracking-wider transition-colors dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => generatePDF(booking)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                            title="Download Invoice PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hal {meta.current_page} dari {meta.last_page}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === meta.last_page}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
