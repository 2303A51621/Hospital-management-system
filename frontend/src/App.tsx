import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// Standard Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import EMRPage from './pages/EMRPage';
import BillingPage from './pages/BillingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PharmacyPage from './pages/PharmacyPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import EmergencyAdminPage from './pages/EmergencyAdminPage';
import AdminManagementPage from './pages/AdminManagementPage';
import StaffPage from './pages/StaffPage';
import WardsPage from './pages/WardsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VideoConsultationPage from './pages/VideoConsultationPage';
import EmergencyAmbulanceWidget from './components/EmergencyAmbulanceWidget';
import AIChatbotWidget from './components/AIChatbotWidget';

// Doctor Role Module Pages
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorConsultationsPage from './pages/doctor/DoctorConsultationsPage';
import DoctorPrescriptionsPage from './pages/doctor/DoctorPrescriptionsPage';
import DoctorMedicalReportsPage from './pages/doctor/DoctorMedicalReportsPage';
import DoctorPatientHistoryPage from './pages/doctor/DoctorPatientHistoryPage';
import DoctorReferralsPage from './pages/doctor/DoctorReferralsPage';
import DoctorMessagesPage from './pages/doctor/DoctorMessagesPage';
import DoctorAvailabilityPage from './pages/doctor/DoctorAvailabilityPage';
import DoctorAnalyticsPage from './pages/doctor/DoctorAnalyticsPage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import DoctorSettingsPage from './pages/doctor/DoctorSettingsPage';

export default function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return (
    <Router>
      <Toaster position="top-right" />
      <EmergencyAmbulanceWidget />
      <AIChatbotWidget />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            token ? (
              user?.role === 'doctor' ? (
                <Navigate to="/doctor/dashboard" />
              ) : (
                <Navigate to="/dashboard" />
              )
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            token ? (
              user?.role === 'doctor' ? (
                <Navigate to="/doctor/dashboard" />
              ) : (
                <Navigate to="/dashboard" />
              )
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            token ? (
              user?.role === 'doctor' ? (
                <Navigate to="/doctor/dashboard" />
              ) : (
                <Navigate to="/dashboard" />
              )
            ) : (
              <RegisterPage />
            )
          }
        />

        {/* Dynamic /dashboard router based on user role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'admin' ? (
                <AdminDashboardPage />
              ) : user?.role === 'doctor' ? (
                <DoctorDashboardPage />
              ) : (
                <DashboardPage />
              )}
            </ProtectedRoute>
          }
        />

        {/* Section 13: Dedicated Doctor Portal Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorPatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/consultations"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorConsultationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/prescriptions"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorPrescriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/reports"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorMedicalReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patient-history"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorPatientHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/referrals"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorReferralsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/messages"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorMessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/availability"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/analytics"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/settings"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin', 'super_admin']}>
              <DoctorSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Existing Hospital Console Routes */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <DoctorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-consultation"
          element={
            <ProtectedRoute>
              <VideoConsultationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emr"
          element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'patient']}>
              <EMRPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute requiredRoles={['admin', 'accountant', 'patient', 'receptionist']}>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute requiredRoles={['admin', 'accountant', 'patient', 'receptionist']}>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <DoctorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wards"
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <WardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-records"
          element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'patient']}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-admission"
          element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
              <EmergencyAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist', 'receptionist']}>
              <PharmacyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-admin"
          element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
              <EmergencyAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-management"
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <AdminManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
