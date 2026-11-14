const express = require('express');
const {
  getNurseDashboard,
  getNursePatients,
  getPatientCareDetail,
  getPatientVitals,
  recordPatientVitals,
  getMedicationSchedules,
  administerMedication,
  getNursingTasks,
  createNursingTask,
  updateNursingTaskStatus,
  getNursingNotes,
  createNursingNote,
  amendNursingNote,
  getAssignedDoctors,
  getDoctorCommunication,
  sendDoctorCommunication,
  getNurseWardsAndBeds,
  getNurseCareSchedule,
  getEmergencyAlerts,
  triggerEmergencyAlert,
  resolveEmergencyAlert,
  getShiftStatusAndAttendance,
  clockInOut,
  getShiftHandovers,
  createShiftHandover,
  acknowledgeShiftHandover,
  getNurseNotifications,
  markNurseNotificationRead,
  markAllNurseNotificationsRead,
  getNurseProfile,
  updateNurseProfile,
  getNurseReports,
} = require('../controllers/nursePortalController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// Strict Role-Based Access Control: require authentication and nurse/admin role
router.use(protect);
router.use(authorize('nurse', 'admin', 'super_admin'));

// 1. Dashboard
router.get('/dashboard', logActivity('nurse', 'view'), getNurseDashboard);

// 2. Patient Management
router.get('/patients', logActivity('patient', 'view'), getNursePatients);
router.get('/patients/:patientId', logActivity('patient', 'view'), getPatientCareDetail);

// 3. Vital Signs Monitoring
router.get('/vitals/:patientId', logActivity('patient', 'view'), getPatientVitals);
router.post('/vitals', logActivity('patient', 'create'), recordPatientVitals);

// 4. Medication Administration (eMAR)
router.get('/medications', logActivity('pharmacy', 'view'), getMedicationSchedules);
router.post('/medications/administer', logActivity('pharmacy', 'create'), administerMedication);

// 5. Nursing Tasks
router.get('/tasks', logActivity('nurse', 'view'), getNursingTasks);
router.post('/tasks', logActivity('nurse', 'create'), createNursingTask);
router.put('/tasks/:id/status', logActivity('nurse', 'update'), updateNursingTaskStatus);

// 6. Nursing Notes & Clinical Documentation
router.get('/notes/:patientId', logActivity('emr', 'view'), getNursingNotes);
router.post('/notes', logActivity('emr', 'create'), createNursingNote);
router.post('/notes/:id/amend', logActivity('emr', 'update'), amendNursingNote);

// 7. Doctor Communication
router.get('/doctors', logActivity('doctor', 'view'), getAssignedDoctors);
router.get('/communication', logActivity('communication', 'view'), getDoctorCommunication);
router.post('/communication', logActivity('communication', 'create'), sendDoctorCommunication);

// 8. Ward & Bed Management
router.get('/wards-beds', logActivity('wards', 'view'), getNurseWardsAndBeds);

// 9. Patient Care Schedule
router.get('/schedule', logActivity('nurse', 'view'), getNurseCareSchedule);

// 10. Emergency Management
router.get('/emergency/alerts', logActivity('emergency', 'view'), getEmergencyAlerts);
router.post('/emergency/alerts', logActivity('emergency', 'create'), triggerEmergencyAlert);
router.put('/emergency/alerts/:id/resolve', logActivity('emergency', 'update'), resolveEmergencyAlert);

// 11. Shift Management & Handover
router.get('/shifts/status', logActivity('nurse', 'view'), getShiftStatusAndAttendance);
router.post('/shifts/clock', logActivity('nurse', 'update'), clockInOut);
router.get('/shifts/handovers', logActivity('nurse', 'view'), getShiftHandovers);
router.post('/shifts/handovers', logActivity('nurse', 'create'), createShiftHandover);
router.put('/shifts/handovers/:id/acknowledge', logActivity('nurse', 'update'), acknowledgeShiftHandover);

// 12. Notifications
router.get('/notifications', getNurseNotifications);
router.put('/notifications/:id/read', markNurseNotificationRead);
router.put('/notifications/read-all', markAllNurseNotificationsRead);

// 13. Profile Management
router.get('/profile', logActivity('nurse', 'view'), getNurseProfile);
router.put('/profile', logActivity('nurse', 'update'), updateNurseProfile);

// 14. Reports & Analytics
router.get('/reports', logActivity('nurse', 'view'), getNurseReports);

module.exports = router;

