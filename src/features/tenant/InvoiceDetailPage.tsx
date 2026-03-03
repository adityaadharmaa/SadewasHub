import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  MapPin,
  CalendarDays,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenantBookingDetail", id],
    queryFn: async () => {
      const response = await api.get(`/tenant/bookings/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const booking = responseData;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- FUNGSI GENERATE PDF (Sama seperti halaman list) ---
  const generatePDF = () => {
    if (!booking) return;
    const doc = new jsPDF();
    const invoiceId =
      booking.payments?.external_id ||
      `SC-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoiceStatus =
      booking.payments?.status === "paid"
        ? "LUNAS"
        : booking.payments?.status === "expired"
          ? "BATAL"
          : "BELUM DIBAYAR";

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SADEWAS COLIVING", 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Pondok Sadewas, Perumahan Bumi Jimbaran Asri", 14, 28);
    doc.text("Badung, Bali - Indonesia", 14, 33);

    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE TAGIHAN", 14, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`No. Invoice : ${invoiceId}`, 14, 55);
    doc.text(`Tanggal     : ${formatDate(booking.created_at)}`, 14, 61);
    doc.text(`Status      : ${invoiceStatus}`, 14, 67);

    doc.setFont("helvetica", "bold");
    doc.text("Tagihan Kepada:", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(
      booking.user?.profile?.full_name || booking.user?.email || "Penghuni",
      120,
      61,
    );
    doc.text(booking.user?.email || "-", 120, 67);

    autoTable(doc, {
      startY: 75,
      head: [["Deskripsi", "Tipe Sewa", "Periode", "Total"]],
      body: [
        [
          `Sewa Kamar ${booking.room?.room_number || "-"}`,
          (booking.rent_type || "monthly").toUpperCase(),
          `${formatDate(booking.check_in_date)} s/d ${formatDate(booking.check_out_date)}`,
          formatRupiah(booking.total_amount + booking.discount_amount), // Harga sebelum diskon
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42] },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Jika ada diskon, tampilkan
    if (booking.discount_amount > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Diskon Promo: - ${formatRupiah(booking.discount_amount)}`,
        14,
        finalY,
      );
      finalY += 8;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `TOTAL PEMBAYARAN: ${formatRupiah(booking.total_amount)}`,
      14,
      finalY,
    );

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

    doc.save(`Invoice_${invoiceId}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="font-bold">Memuat rincian tagihan...</p>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p className="font-bold">Tagihan tidak ditemukan.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm font-bold text-primary-600 hover:underline"
        >
          Kembali ke Riwayat
        </button>
      </div>
    );
  }

  const isPending =
    booking.status === "pending" || booking.payments?.status === "pending";
  const isPaid =
    booking.status === "confirmed" || booking.payments?.status === "paid";
  const invoiceNumber =
    booking.payments?.external_id ||
    `INV-${booking.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6 pb-10 animate-fade-in max-w-4xl mx-auto">
      {/* HEADER NAVIGASI */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Detail Tagihan
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {invoiceNumber}
            </p>
          </div>
        </div>

        <button
          onClick={generatePDF}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
        >
          <Download className="h-4 w-4" /> Unduh PDF
        </button>
      </div>

      {/* KERTAS INVOICE */}
      <div className="rounded-[28px] bg-white dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden relative">
        {/* Pita Status Berwarna di Atas */}
        <div
          className={`h-2 w-full ${isPaid ? "bg-emerald-500" : isPending ? "bg-amber-500" : "bg-rose-500"}`}
        ></div>

        <div className="p-6 md:p-10">
          {/* HEADER INVOICE: Logo & Status */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-8 border-b border-dashed border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Building className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  SADEWAS
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed flex items-start gap-1">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Pondok Sadewas, Perumahan Bumi Jimbaran Asri, Badung, Bali.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Status Pembayaran
              </span>
              {isPaid ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" /> Lunas Terbayar
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 font-bold text-sm">
                  <Clock className="h-5 w-5" /> Menunggu Pembayaran
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 font-bold text-sm">
                  <XCircle className="h-5 w-5" /> Kedaluwarsa / Batal
                </div>
              )}
            </div>
          </div>

          {/* INFORMASI TRANSAKSI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tanggal Dibuat
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {formatDate(booking.created_at)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Metode Bayar
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                {booking.payments?.method || "Xendit Gateway"}
              </p>
            </div>
            <div className="col-span-2 md:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Ditagihkan Kepada
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {booking.user?.profile?.full_name}
              </p>
              <p className="text-xs text-slate-500">{booking.user?.email}</p>
            </div>
          </div>

          {/* TABEL ITEM */}
          <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden mb-8">
            <div className="px-5 py-3 border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-100/50 dark:bg-slate-800/50 grid grid-cols-12 gap-4">
              <div className="col-span-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Deskripsi Layanan
              </div>
              <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tipe Sewa
              </div>
              <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                Total
              </div>
            </div>
            <div className="p-5 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-6">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Sewa Kamar {booking.room?.room_number}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <CalendarDays className="h-3 w-3" />{" "}
                  {formatDate(booking.check_in_date)} -{" "}
                  {formatDate(booking.check_out_date)}
                </p>
              </div>
              <div className="col-span-3">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {booking.rent_type}
                </span>
              </div>
              <div className="col-span-3 text-right text-sm font-bold text-slate-900 dark:text-white">
                {formatRupiah(booking.total_amount + booking.discount_amount)}
              </div>
            </div>
          </div>

          {/* TOTAL & SUMMARY */}
          <div className="flex flex-col items-end gap-3 w-full md:w-1/2 ml-auto">
            {booking.discount_amount > 0 && (
              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-slate-500">Diskon Promo</span>
                <span className="font-bold text-red-500">
                  - {formatRupiah(booking.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between w-full border-t border-slate-200 dark:border-slate-700 pt-3">
              <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Total Akhir
              </span>
              <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                {formatRupiah(booking.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* AREA TOMBOL BAWAH */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center sm:text-left">
            {isPending
              ? "Silakan selesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak otomatis dibatalkan."
              : isPaid
                ? `Pembayaran telah kami terima pada ${formatDateTime(booking.payments?.paid_at)}.`
                : "Tagihan ini sudah tidak berlaku. Silakan buat pesanan baru."}
          </p>

          <div className="flex w-full sm:w-auto items-center gap-3">
            {/* Tombol Download muncul di HP juga di bawah sini */}
            <button
              onClick={generatePDF}
              className="flex-1 sm:flex-none flex justify-center items-center p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-300 sm:hidden"
            >
              <Download className="h-5 w-5" />
            </button>

            {isPending && booking.payments?.checkout_url && (
              <a
                href={booking.payments.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-500/20"
              >
                Bayar Sekarang <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
