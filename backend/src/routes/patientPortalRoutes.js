const express = require('express');
const {
  getPatientDashboard,
  getDoctorsDirectory,
  getDoctorAvailableSlots,
  bookAppointment,
  getPatientAppointments,
  rescheduleAppointment,
  cancelAppointment,
  getPatientMedicalRecords,
  uploadPatientDocument,
  getPatientPrescriptions,
  getPatientMedicalReports,
  getPatientBilling,
  processOnlinePayment,
  getPatientTelemedicineSessions,
  getPatientNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPatientMessages,
  sendMessageToDoctor,
  getPatientFollowUps,
  getPatientProfile,
  updatePatientProfile,
  getFamilyMembers,
  addFamilyMember,
  deleteFamilyMember,
  getPatientFeedback,
  submitDoctorReview,
  submitHospitalFeedback,
  getEmergencyInfo,
  getHealthTips,
  getPatientHealthOverview,
} = require('../controllers/patientPortalController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All patient portal endpoints require authentication and patient or admin roles
router.use(protect);
router.use(authorize('patient', 'admin', 'super_admin'));

// 1. Dashboard
router.get('/dashboard', getPatientDashboard);

// 2. Doctor discovery & slots
router.get('/doctors', getDoctorsDirectory);
router.get('/doctors/slots', getDoctorAvailableSlots);

// 3. Appointments
router.post('/appointments/book', bookAppointment);
router.get('/appointments', getPatientAppointments);
router.put('/appointments/:id/reschedule', rescheduleAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);

// 5. Medical records & document upload
router.get('/medical-records', getPatientMedicalRecords);
router.post('/medical-records/upload', uploadPatientDocument);

// 6. Prescriptions (read-only)
router.get('/prescriptions', getPatientPrescriptions);

// 7. Medical Reports (investigations)
router.get('/reports', getPatientMedicalReports);

// 8. Billing & Payments
router.get('/billing', getPatientBilling);
router.post('/billing/pay', processOnlinePayment);

// 9. Telemedicine
router.get('/telemedicine', getPatientTelemedicineSessions);

// Notifications
router.get('/notifications', getPatientNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

// 10. Messages with doctors
router.get('/messages', getPatientMessages);
router.post('/messages', sendMessageToDoctor);

// 11. Follow-ups
router.get('/follow-ups', getPatientFollowUps);

// 16. Profile
router.get('/profile', getPatientProfile);
router.put('/profile', updatePatientProfile);

// 12. Family Members
router.get('/family', getFamilyMembers);
router.post('/family', addFamilyMember);
router.delete('/family/:id', deleteFamilyMember);

// 13. Feedback & Reviews
router.get('/feedback', getPatientFeedback);
router.post('/feedback/doctor', submitDoctorReview);
router.post('/feedback/hospital', submitHospitalFeedback);

// 14 & 15. Emergency & Health Tips
router.get('/emergency', getEmergencyInfo);
router.get('/health-tips', getHealthTips);

// 17. Health Overview & Vital Trends
router.get('/health-overview', getPatientHealthOverview);

module.exports = router;

