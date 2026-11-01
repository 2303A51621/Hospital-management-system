const express = require('express');
const { protect, authorize, logActivity } = require('../middleware/auth');
const { getMedicines, createMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');

const router = express.Router();
router.use(protect, authorize('admin', 'pharmacist', 'receptionist'));
router.get('/', logActivity('pharmacy', 'view'), getMedicines);
router.post('/', logActivity('pharmacy', 'create'), createMedicine);
router.put('/:id', logActivity('pharmacy', 'update'), updateMedicine);
router.delete('/:id', logActivity('pharmacy', 'update'), deleteMedicine);

module.exports = router;
