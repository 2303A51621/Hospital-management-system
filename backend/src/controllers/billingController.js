const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const { list, getById, asyncHandler } = require('./_helpers');
const { buildInvoicePayload } = require('../services/billingService');
const Appointment = require('../models/Appointment');
const { createOrder, verifyPaymentSignature } = require('../services/paymentGatewayService');
const crypto = require('node:crypto');

exports.getInvoices = asyncHandler(async (req, res) => {
	const filter = {};
	if (req.user.role === 'patient') {
		const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
		if (!patient) return res.json({ success: true, data: [], count: 0 });
		filter.patientId = patient._id;
	}
	const invoices = await Billing.find(filter).populate('appointmentId').sort({ createdAt: -1 });
	res.json({ success: true, data: invoices, count: invoices.length });
});
exports.getInvoice = asyncHandler(async (req, res) => {
	const invoice = await Billing.findById(req.params.id).populate('appointmentId');
	if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
	if (req.user.role === 'patient') {
		const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
		if (!patient || String(invoice.patientId) !== String(patient._id)) return res.status(403).json({ message: 'Not authorized to view this invoice' });
	}
	res.json({ success: true, data: invoice });
});

exports.createOnlinePaymentOrder = asyncHandler(async (req, res) => {
	const invoice = await Billing.findById(req.params.id);
	if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
	if (req.user.role === 'patient') {
		const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
		if (!patient || String(invoice.patientId) !== String(patient._id)) return res.status(403).json({ message: 'Not authorized to pay this invoice' });
	}
	if (invoice.paymentDetails?.paymentStatus === 'completed') {
		return res.status(409).json({ message: 'This invoice has already been paid' });
	}
	const order = await createOrder(invoice);
	invoice.paymentDetails.gatewayOrderId = order.id;
	invoice.paymentDetails.paymentStatus = 'processing';
	await invoice.save();
	res.json({
		success: true,
		data: {
			orderId: order.id,
			amount: order.amount,
			currency: order.currency,
			keyId: process.env.RAZORPAY_KEY_ID,
			paymentId: invoice.paymentDetails.paymentId,
		},
	});
});

exports.verifyOnlinePayment = asyncHandler(async (req, res) => {
	const invoice = await Billing.findById(req.params.id);
	if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
	if (req.user.role === 'patient') {
		const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
		if (!patient || String(invoice.patientId) !== String(patient._id)) return res.status(403).json({ message: 'Not authorized to verify this invoice' });
	}
	const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
	if (invoice.paymentDetails.gatewayOrderId !== orderId || !verifyPaymentSignature({ orderId, paymentId, signature })) {
		invoice.paymentDetails.paymentStatus = 'failed';
		await invoice.save();
		return res.status(400).json({ message: 'Payment signature verification failed' });
	}
	if (invoice.paymentDetails.paymentStatus === 'completed') {
		return res.json({ success: true, data: invoice, alreadyProcessed: true });
	}
	invoice.paymentDetails.transactionId = paymentId;
	invoice.paymentDetails.paymentStatus = 'completed';
	invoice.paymentDetails.signatureVerified = true;
	invoice.paymentDetails.paymentDate = new Date();
	invoice.paymentDetails.paymentGateway = 'razorpay';
	invoice.status = 'paid';
	invoice.auditTrail.push({ action: 'online_payment_verified', userId: req.user._id, previousStatus: 'processing', newStatus: 'completed' });
	await invoice.save();
	if (invoice.appointmentId) {
		await Appointment.findByIdAndUpdate(invoice.appointmentId, { status: 'confirmed' });
	}
	res.json({ success: true, data: invoice });
});

exports.handleRazorpayWebhook = asyncHandler(async (req, res) => {
	const signature = req.get('x-razorpay-signature');
	const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
	if (!secret || !signature || !Buffer.isBuffer(req.body)) return res.status(400).json({ message: 'Invalid webhook configuration or payload' });
	const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
	if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
		return res.status(400).json({ message: 'Invalid webhook signature' });
	}
	const event = JSON.parse(req.body.toString('utf8'));
	if (!['payment.captured', 'order.paid'].includes(event.event)) return res.json({ success: true, ignored: true });
	const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
	const transactionId = event.payload?.payment?.entity?.id;
	const invoice = await Billing.findOne({ 'paymentDetails.gatewayOrderId': orderId });
	if (!invoice) return res.status(404).json({ message: 'Invoice for webhook not found' });
	if (invoice.paymentDetails.paymentStatus === 'completed') return res.json({ success: true, alreadyProcessed: true });
	invoice.paymentDetails.paymentStatus = 'completed';
	invoice.paymentDetails.transactionId = transactionId;
	invoice.paymentDetails.signatureVerified = true;
	invoice.paymentDetails.paymentGateway = 'razorpay';
	invoice.paymentDetails.paymentDate = new Date();
	invoice.status = 'paid';
	invoice.auditTrail.push({ action: 'online_payment_webhook_verified', previousStatus: 'processing', newStatus: 'completed' });
	await invoice.save();
	if (invoice.appointmentId) await Appointment.findByIdAndUpdate(invoice.appointmentId, { status: 'confirmed' });
	res.json({ success: true });
});

exports.createInvoice = asyncHandler(async (req, res) => {
	const payload = buildInvoicePayload(req.body || {});
	const invoice = await Billing.create(payload);
	res.status(201).json({ success: true, data: invoice });
});

exports.recordPayment = asyncHandler(async (req, res) => {
	const invoice = await Billing.findById(req.params.id);
	if (!invoice) {
		return res.status(404).json({ message: 'Invoice not found' });
	}

	const paymentData = req.body || {};
	const previousStatus = invoice.paymentDetails?.paymentStatus || 'pending';
	if (invoice.paymentDetails?.paymentStatus === 'completed') {
		return res.json({ success: true, data: invoice, alreadyProcessed: true });
	}
	if (paymentData.paymentMethod === 'pay_at_hospital' && Number(paymentData.amount) !== Number(invoice.summary.totalAmount)) {
		return res.status(400).json({ message: 'Collected amount must match the invoice total' });
	}
	invoice.paymentDetails = {
		...invoice.paymentDetails.toObject ? invoice.paymentDetails.toObject() : invoice.paymentDetails,
		paymentMethod: paymentData.paymentMethod || invoice.paymentDetails?.paymentMethod || 'cash',
		transactionId: paymentData.transactionId || invoice.paymentDetails?.transactionId,
		paymentGateway: paymentData.paymentGateway || invoice.paymentDetails?.paymentGateway,
		gatewayOrderId: paymentData.gatewayOrderId || invoice.paymentDetails?.gatewayOrderId,
		signatureVerified: paymentData.signatureVerified === true,
		paymentDate: paymentData.paymentDate || new Date(),
		paymentStatus: paymentData.paymentStatus || 'completed',
		collectedBy: req.user._id,
		collectedAt: new Date(),
	};

	invoice.status = paymentData.paymentStatus === 'failed' ? invoice.status : 'paid';
	invoice.auditTrail.push({
		action: 'payment_recorded',
		userId: req.user._id,
		previousStatus,
		newStatus: invoice.paymentDetails.paymentStatus,
	});

	if (paymentData.insuranceProvider || paymentData.policyNumber || paymentData.coverage) {
		invoice.insurance = {
			...invoice.insurance.toObject ? invoice.insurance.toObject() : invoice.insurance,
			insuranceProvider: paymentData.insuranceProvider || invoice.insurance?.insuranceProvider,
			policyNumber: paymentData.policyNumber || invoice.insurance?.policyNumber,
			coverage: paymentData.coverage || invoice.insurance?.coverage,
			claimStatus: 'pending',
		};
	}

	await invoice.save();
	res.json({ success: true, data: invoice });
});

exports.processRefund = asyncHandler(async (req, res) => {
	const invoice = await Billing.findById(req.params.id);
	if (!invoice) {
		return res.status(404).json({ message: 'Invoice not found' });
	}

	const refund = req.body || {};
	invoice.refund = {
		isRefunded: true,
		refundAmount: Number(refund.refundAmount || 0),
		refundReason: refund.refundReason || 'Manual refund request',
		refundDate: refund.refundDate || new Date(),
	};

	invoice.status = 'cancelled';
	await invoice.save();
	res.json({ success: true, data: invoice });
});
exports.getPatientBillingHistory = asyncHandler(async (req, res) => {
	let patientId = req.params.patientId;
	if (req.user.role === 'patient') {
		const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
		if (!patient || String(patient._id) !== String(patientId)) return res.status(403).json({ message: 'Not authorized to view this billing history' });
		patientId = patient._id;
	}
	const invoices = await Billing.find({ patientId }).sort({ createdAt: -1 });
	res.json({ success: true, data: invoices, count: invoices.length });
});
exports.getFinancialReport = asyncHandler(async (req, res) => {
	const totals = await Billing.aggregate([
		{
			$group: {
				_id: null,
				totalBilled: { $sum: '$summary.totalAmount' },
				totalInvoices: { $sum: 1 },
				paidInvoices: {
					$sum: {
						$cond: [{ $eq: ['$status', 'paid'] }, 1, 0],
					},
				},
			},
		},
	]);

	res.json({
		success: true,
		data: totals[0] || { totalBilled: 0, totalInvoices: 0, paidInvoices: 0 },
	});
});