const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  bookOnlineConsultation,
  getPatientConsultations,
  getDoctorConsultations,
  updateConsultationStatus,
  getRoomDetails,
  completeConsultation,
  getAdminConsultations,
  getDoctorAvailableSlots,
} = require('../controllers/onlineConsultationController');

// All online consultation routes require authentication
router.use(protect);

// 1. Patient booking & list
router.post('/book', bookOnlineConsultation);
router.get('/patient/my-consultations', getPatientConsultations);

// 2. Doctor list & management
router.get('/doctor/my-consultations', authorize('doctor', 'admin', 'super_admin'), getDoctorConsultations);
router.patch('/:id/status', authorize('doctor', 'admin', 'super_admin'), updateConsultationStatus);
router.post('/:id/complete', authorize('doctor', 'admin', 'super_admin'), completeConsultation);

// 3. Room details & WebRTC authorization
router.get('/room/:roomId', getRoomDetails);

// 4. Slots lookup
router.get('/slots', getDoctorAvailableSlots);

// 5. Admin management & monitoring
router.get('/admin/all', authorize('admin', 'super_admin'), getAdminConsultations);

module.exports = router;
