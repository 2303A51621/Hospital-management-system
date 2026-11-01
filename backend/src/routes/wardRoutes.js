const express = require('express');
const { protect, authorize, logActivity } = require('../middleware/auth');
const { getWardDashboard, updateBedStatus } = require('../controllers/wardController');

const router = express.Router();
router.use(protect, authorize('admin', 'super_admin'));
router.get('/', logActivity('wards', 'view'), getWardDashboard);
router.patch('/beds/:id/status', logActivity('wards', 'update'), updateBedStatus);

module.exports = router;
