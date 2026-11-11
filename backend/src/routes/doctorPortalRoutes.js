const express = require('express');
const {
  getDoctorDashboard,
  getDoctorPatients,
  getPatientFullProfile,
  getPatientTimeline,
  addClinicalNote,
  addPatientAllergy,
  acceptAppointment,
  rejectAppointment,
  markAppointmentNoShow,
  getConsultations,
  getConsultationById,
  saveConsultationDraft,
  completeConsultation,
  getDoctorPrescriptions,
  createDoctorPrescription,
  checkClinicalSafety,
  getDoctorReports,
  orderDiagnosticTest,
  reviewReport,
  getReferrals,
  createReferral,
  updateReferralStatus,
  getDoctorMessages,
  sendDoctorMessage,
  markMessageAsRead,
  getDoctorLeaveRequests,
  applyDoctorLeave,
  updateDoctorAvailability,
  getDoctorAnalytics,
  aiClinicalAssist,
  getDoctorProfile,
  updateDoctorProfile,
} = require('../controllers/doctorPortalController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// Require authentication and doctor/admin role
router.use(protect);
router.use(authorize('doctor', 'admin', 'super_admin'));

// Dashboard
router.get('/dashboard', logActivity('doctor', 'view'), getDoctorDashboard);

// Patients
router.get('/patients', logActivity('patient', 'view'), getDoctorPatients);
router.get('/patients/:patientId/full-profile', logActivity('patient', 'view'), getPatientFullProfile);
router.get('/patients/:patientId/timeline', logActivity('patient', 'view'), getPatientTimeline);
router.post('/patients/:patientId/clinical-notes', logActivity('patient', 'update'), addClinicalNote);
router.post('/patients/:patientId/allergies', logActivity('patient', 'update'), addPatientAllergy);

// Appointments quick actions
router.put('/appointments/:id/accept', logActivity('appointment', 'update'), acceptAppointment);
router.put('/appointments/:id/reject', logActivity('appointment', 'update'), rejectAppointment);
router.put('/appointments/:id/no-show', logActivity('appointment', 'update'), markAppointmentNoShow);

// Consultations
router.get('/consultations', logActivity('emr', 'view'), getConsultations);
router.get('/consultations/:id', logActivity('emr', 'view'), getConsultationById);
router.post('/consultations/draft', logActivity('emr', 'create'), saveConsultationDraft);
router.post('/consultations/complete', logActivity('emr', 'create'), completeConsultation);

// Prescriptions
router.get('/prescriptions', logActivity('prescription', 'view'), getDoctorPrescriptions);
router.post('/prescriptions', logActivity('prescription', 'create'), createDoctorPrescription);
router.post('/prescriptions/safety-check', logActivity('prescription', 'view'), checkClinicalSafety);

// Medical Reports / Diagnostics
router.get('/reports', logActivity('lab-test', 'view'), getDoctorReports);
router.post('/reports/order', logActivity('lab-test', 'create'), orderDiagnosticTest);
router.put('/reports/:id/review', logActivity('lab-test', 'update'), reviewReport);

// Referrals
router.get('/referrals', logActivity('doctor', 'view'), getReferrals);
router.post('/referrals', logActivity('doctor', 'create'), createReferral);
router.put('/referrals/:id/status', logActivity('doctor', 'update'), updateReferralStatus);

// Messages / Communication
router.get('/messages', logActivity('notification', 'view'), getDoctorMessages);
router.post('/messages', logActivity('notification', 'create'), sendDoctorMessage);
router.patch('/messages/:id/read', logActivity('notification', 'update'), markMessageAsRead);

// Leave & Availability
router.get('/leave', logActivity('doctor', 'view'), getDoctorLeaveRequests);
router.post('/leave', logActivity('doctor', 'create'), applyDoctorLeave);
router.put('/availability', logActivity('doctor', 'update'), updateDoctorAvailability);

// Analytics
router.get('/analytics', logActivity('report', 'view'), getDoctorAnalytics);

// AI Clinical Support
router.post('/ai-assist', logActivity('ai-chat', 'create'), aiClinicalAssist);

// Doctor Profile
router.get('/profile', logActivity('doctor', 'view'), getDoctorProfile);
router.put('/profile', logActivity('doctor', 'update'), updateDoctorProfile);

module.exports = router;
