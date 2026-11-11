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

// Patient Role Module Pages
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import PatientFindDoctorsPage from './pages/patient/PatientFindDoctorsPage';
import PatientBookAppointmentPage from './pages/patient/PatientBookAppointmentPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientMedicalRecordsPage from './pages/patient/PatientMedicalRecordsPage';
import PatientPrescriptionsPage from './pages/patient/PatientPrescriptionsPage';
import PatientMedicalReportsPage from './pages/patient/PatientMedicalReportsPage';
import PatientPaymentsPage from './pages/patient/PatientPaymentsPage';
import PatientTelemedicinePage from './pages/patient/PatientTelemedicinePage';
import PatientMessagesPage from './pages/patient/PatientMessagesPage';
import PatientFollowUpsPage from './pages/patient/PatientFollowUpsPage';
import PatientFamilyPage from './pages/patient/PatientFamilyPage';
import PatientFeedbackPage from './pages/patient/PatientFeedbackPage';
import PatientHealthTipsPage from './pages/patient/PatientHealthTipsPage';
import PatientEmergencyPage from './pages/patient/PatientEmergencyPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import PatientHealthOverviewPage from './pages/patient/PatientHealthOverviewPage';
import PatientSettingsPage from './pages/patient/PatientSettingsPage';

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
              ) : user?.role === 'patient' ? (
                <PatientDashboardPage />
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

        {/* Section 20: Dedicated Patient Portal Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/doctors"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientFindDoctorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/book-appointment"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientBookAppointmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/records"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientMedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientPrescriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/reports"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientMedicalReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/payments"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/telemedicine"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientTelemedicinePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/messages"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientMessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/follow-ups"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientFollowUpsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/family"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientFamilyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/feedback"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientFeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/health-tips"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientHealthTipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/emergency"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientEmergencyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/health-overview"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientHealthOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/settings"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin', 'super_admin']}>
              <PatientSettingsPage />
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
