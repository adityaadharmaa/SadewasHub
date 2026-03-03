import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";

// --- Auth Pages ---
import LoginPage from "./features/auth/LoginPage";
import AuthCallbackPage from "./features/auth/AuthCallbackPage";
import RegisterPage from "./features/auth/RegisterPage";
import VerifyEmailPage from "./features/auth/VerifyEmailPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";

// --- Layouts ---
import AdminLayout from "./components/layout/AdminLayout";
import TenantLayout from "./components/layout/TenantLayout";

// --- Admin Pages ---
import AdminDashboard from "./features/admin/AdminDashboard";
import RoomTypesPage from "./features/admin/room-types/RoomTypesPage";
import FacilitiesPage from "./features/admin/facilities/FacilitiesPage";
import RoomsPage from "./features/admin/rooms/RoomsPage";
import TenantsPage from "./features/admin/tenants/TenantsPage";
import BookingsPage from "./features/admin/bookings/BookingsPage";
import PromosPage from "./features/admin/promos/PromosPage";
import TicketsPage from "./features/admin/tickets/TicketPage";
import ExpensesPage from "./features/admin/expenses/ExpensePage";
import RolesPage from "./features/admin/roles/RolesPage";

// --- Tenant Pages ---
import TenantDashboard from "./features/tenant/TenantDashboard";
import RoomCatalogPage from "./features/tenant/RoomCatalogPage";
import BookingCreatePage from "./features/tenant/BookingCreatePage";
import InvoicesPage from "./features/tenant/InvoicesPage";
import InvoiceDetailPage from "./features/tenant/InvoiceDetailPage";
import TenantTicketsPage from "./features/tenant/TenantTicketsPage";
import TenantBookingDetailPage from "./features/tenant/TenantBookingDetail";

// --- Shared Pages ---
import ProfilePage from "./features/shared/profile/ProfilePage";
import NotificationsPage from "./features/notifications/NotificationPages";
import LandingPage from "./features/public/LandingPage";

// ==========================================
// 🛡️ KOMPONEN SATPAM (ROUTE GUARD)
// ==========================================
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user, token } = useAuthStore();

  // 1. Jika tidak ada token (belum login), lempar ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. NORMALISASI ROLE: Pastikan role selalu menjadi Array of Strings
  let rolesArray: string[] = [];

  if (user?.roles) {
    if (Array.isArray(user.roles)) {
      // Jika dari backend bentuknya array (misal: ['admin'] atau [{name: 'admin'}])
      rolesArray = user.roles.map((r: any) =>
        typeof r === "string" ? r : r.name,
      );
    } else if (typeof user.roles === "string") {
      // Jika dari backend bentuknya string (misal: "admin")
      rolesArray = [user.roles];
    }
  } else if (user?.roles && typeof user.roles === "string") {
    // Fallback ekstra jika backend menggunakan key 'role' (tanpa s)
    rolesArray = [user.roles];
  }

  // 3. Cek apakah role user saat ini ada di dalam daftar allowedRoles
  const hasAccess = rolesArray.some((role) => allowedRoles.includes(role));

  // 4. Jika tidak punya akses, arahkan ke rute yang benar
  if (!hasAccess) {
    if (rolesArray.includes("admin"))
      return <Navigate to="/admin/dashboard" replace />;
    if (rolesArray.includes("tenant"))
      return <Navigate to="/tenant/dashboard" replace />;

    // Fallback darurat jika role tidak dikenali
    return <Navigate to="/login" replace />;
  }

  // 5. Jika lolos, render halamannya
  return <Outlet />;
};

// ==========================================
// 🚀 APP COMPONENT
// ==========================================
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          className:
            "rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 font-sans",
        }}
      />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 🛡️ ADMIN ROUTES (Terlindungi) */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* Menggunakan format asal Anda agar tidak error TypeScript */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/room-types"
            element={
              <AdminLayout>
                <RoomTypesPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/facilities"
            element={
              <AdminLayout>
                <FacilitiesPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <AdminLayout>
                <RoomsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminLayout>
                <TenantsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminLayout>
                <BookingsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/promos"
            element={
              <AdminLayout>
                <PromosPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <AdminLayout>
                <TicketsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/expenses"
            element={
              <AdminLayout>
                <ExpensesPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <AdminLayout>
                <RolesPage />
              </AdminLayout>
            }
          />

          {/* Halaman Shared yang diakses dari Admin */}
          <Route
            path="/admin/profile"
            element={
              <AdminLayout>
                <ProfilePage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminLayout>
                <NotificationsPage />
              </AdminLayout>
            }
          />
        </Route>

        {/* 🛡️ TENANT ROUTES (Terlindungi) */}
        <Route element={<ProtectedRoute allowedRoles={["tenant"]} />}>
          <Route path="/tenant/*" element={<TenantLayout />}>
            <Route
              index
              element={<Navigate to="/tenant/dashboard" replace />}
            />
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="rooms" element={<RoomCatalogPage />} />
            <Route path="bookings/:id" element={<TenantBookingDetailPage />} />
            <Route path="bookings/create/:id" element={<BookingCreatePage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="tickets" element={<TenantTicketsPage />} />
          </Route>
        </Route>

        {/* CATCH ALL (404) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
