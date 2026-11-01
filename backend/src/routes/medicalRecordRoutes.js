const express = require('express');
const multer = require('multer');
const { protect, authorize, logActivity } = require('../middleware/auth');
const { getMedicalRecords, uploadMedicalRecord, downloadMedicalRecord } = require('../controllers/medicalRecordController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
    return callback(new Error('Only PDF, JPEG, PNG, and WebP files are supported'));
  },
});
router.use(protect);
router.get('/', authorize('admin', 'doctor', 'patient'), logActivity('emr', 'view'), getMedicalRecords);
router.post('/upload', authorize('admin', 'doctor'), upload.single('file'), uploadMedicalRecord);
router.get('/:id/file', authorize('admin', 'doctor', 'patient'), logActivity('medical-record', 'view'), downloadMedicalRecord);

module.exports = router;
