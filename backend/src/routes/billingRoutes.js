const express = require('express');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  recordPayment,
  getPatientBillingHistory,
  getFinancialReport,
  processRefund,
  createOnlinePaymentOrder,
  verifyOnlinePayment,
  handleRazorpayWebhook,
} = require('../controllers/billingController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// All billing routes require authentication
router.use(protect);

// GET routes
router.get(
  '/',
  authorize('admin', 'accountant', 'receptionist'),
  logActivity('billing', 'view'),
  getInvoices
);
router.get('/:id', authorize('admin', 'accountant', 'patient'), logActivity('billing', 'view'), getInvoice);
router.get('/invoice/:id', authorize('admin', 'accountant', 'patient'), logActivity('billing', 'view'), getInvoice);
router.get(
  '/patient/:patientId',
  authorize('admin', 'accountant', 'patient'),
  logActivity('billing', 'view'),
  getPatientBillingHistory
);

router.get(
  '/patient/:patientId/history',
  authorize('admin', 'accountant', 'patient'),
  logActivity('billing', 'view'),
  getPatientBillingHistory
);

router.get(
  '/report/financial',
  authorize('admin', 'accountant'),
  logActivity('billing', 'view'),
  getFinancialReport
);

// POST routes
router.post('/', authorize('admin', 'receptionist', 'accountant'), logActivity('billing', 'create'), createInvoice);
router.post('/:id/payment/order', authorize('admin', 'patient'), logActivity('billing', 'create'), createOnlinePaymentOrder);
router.post('/:id/payment/verify', authorize('admin', 'patient'), logActivity('billing', 'update'), verifyOnlinePayment);

// PUT routes
router.put('/:id/payment', authorize('admin', 'receptionist', 'accountant'), logActivity('billing', 'update'), recordPayment);
router.put('/:id/refund', authorize('admin', 'accountant'), logActivity('billing', 'update'), processRefund);

module.exports = router;
