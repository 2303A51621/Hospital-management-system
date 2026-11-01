const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Billing = require('../models/Billing');
const { buildInvoicePayload } = require('../services/billingService');
const { list, getById, create, updateById, asyncHandler } = require('./_helpers');

const toMinutes = (time) => {
	const [hours, minutes] = String(time).split(':').map(Number);
	return hours * 60 + minutes;
};

const getAvailableSlots = (doctor, date, appointments) => {
	const [year, month, day] = String(date).split('-').map(Number);
	const dayName = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
		weekday: 'long',
		timeZone: 'UTC',
	});
	const schedule = doctor.availability?.find((item) => item.day === dayName)
		|| (doctor.availableDays?.includes(dayName) ? doctor.availableSlots : null)
		|| (!doctor.availability?.length
			? { startTime: '00:00', endTime: '24:00', slotDuration: 30 }
			: null);
	if (!schedule) return [];

	const duration = Number(schedule.slotDuration || doctor.availableSlots?.slotDuration || 30);
	const slots = [];
	for (let start = toMinutes(schedule.startTime); start + duration <= toMinutes(schedule.endTime); start += duration) {
		const startTime = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
		const end = start + duration;
		const endTime = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
		if (!appointments.some((appointment) => appointment.startTime === startTime
			&& ['pending', 'confirmed', 'scheduled'].includes(appointment.status))) {
			slots.push({ startTime, endTime });
		}
	}
	return slots;
};

exports.getAppointments = asyncHandler(async (req, res) => {
	const filter = {};

	if (req.user.role === 'patient') {
		const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
		if (!patient) return res.json({ success: true, data: [], count: 0 });
		filter.patientId = patient._id;
	} else if (req.user.role === 'doctor') {
		const doctor = await Doctor.findOne({ userId: req.user._id }).select('_id');
		if (!doctor) return res.json({ success: true, data: [], count: 0 });
		filter.doctorId = doctor._id;
	} else if (req.query.patientId) {
		filter.patientId = req.query.patientId;
	} else if (req.query.doctorId) {
		filter.doctorId = req.query.doctorId;
	}

	const appointments = await Appointment.find(filter)
		.populate(['patientId', 'doctorId', 'userId'])
		.sort({ appointmentDate: 1, startTime: 1, createdAt: -1 });

	res.json({ success: true, data: appointments, count: appointments.length });
});
exports.getAppointment = getById(Appointment, { name: 'Appointment', populate: ['patientId', 'doctorId', 'userId'] });
exports.bookAppointment = asyncHandler(async (req, res) => {
	const body = req.body || {};
	if (!body.doctorId) {
		return res.status(400).json({ message: 'Doctor is required' });
	}

	let patientProfile = await Patient.findOne({ userId: req.user._id }).select('_id userId');
	if (!patientProfile) {
		patientProfile = await Patient.findOneAndUpdate(
			{ userId: req.user._id },
			{ userId: req.user._id },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
	}

	const patientId = req.user.role === 'patient' ? patientProfile?._id : (body.patientId || patientProfile?._id);
	if (!patientId) {
		return res.status(400).json({ message: 'Patient profile not found' });
	}

	const doctor = await Doctor.findById(body.doctorId).select('consultationFee availability availableDays availableSlots specialization department');
	if (!doctor || doctor.isActive === false) return res.status(404).json({ message: 'Doctor not found or unavailable' });
	const appointmentDate = new Date(body.appointmentDate);
	if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < new Date(new Date().toDateString())) {
		return res.status(400).json({ message: 'A valid future appointment date is required' });
	}
	const existing = await Appointment.find({
		doctorId: doctor._id,
		appointmentDate: { $gte: new Date(`${body.appointmentDate}T00:00:00`), $lt: new Date(`${body.appointmentDate}T23:59:59.999`) },
	}).select('startTime status');
	if (!getAvailableSlots(doctor, body.appointmentDate, existing).some((slot) => slot.startTime === body.startTime && slot.endTime === body.endTime)) {
		return res.status(409).json({ message: 'This appointment slot is unavailable' });
	}

	const paymentMethod = body.paymentMethod === 'online' ? 'upi' : 'pay_at_hospital';
	const isCash = paymentMethod === 'pay_at_hospital';
	let appointment;
	try {
		appointment = await Appointment.create({
			...body,
			patientId,
			userId: body.userId || req.user._id,
			appointmentDate,
			date: appointmentDate,
			consultationFee: Number(doctor.consultationFee || 0),
			status: isCash ? 'confirmed' : 'pending',
		});
	} catch (error) {
		if (error?.code === 11000) return res.status(409).json({ message: 'This appointment slot was just booked. Please choose another slot.' });
		throw error;
	}

	const invoice = await Billing.create(buildInvoicePayload({
		patientId,
		appointmentId: appointment._id,
		billItems: [{
			itemType: 'consultation',
			description: `${doctor.specialization} consultation`,
			quantity: 1,
			unitPrice: doctor.consultationFee,
		}],
		paymentDetails: {
			paymentMethod,
			paymentStatus: 'pending',
		},
		status: 'issued',
	}));
	appointment.billingId = invoice._id;
	await appointment.save();
	res.status(201).json({ success: true, data: appointment, billing: invoice, paymentRequired: !isCash });
});
exports.rescheduleAppointment = updateById(Appointment, { name: 'Appointment' });
exports.cancelAppointment = asyncHandler(async (req, res) => res.json({ success: true, data: await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true }) }));
exports.completeAppointment = asyncHandler(async (req, res) => res.json({ success: true, data: await Appointment.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true }) }));
exports.getDoctorAvailability = asyncHandler(async (req, res) => {
	const { date } = req.query;
	if (!date) return res.status(400).json({ message: 'Date is required' });
	const doctor = await Doctor.findById(req.params.doctorId);
	if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
	const appointments = await Appointment.find({
		doctorId: doctor._id,
		appointmentDate: { $gte: new Date(`${date}T00:00:00`), $lt: new Date(`${date}T23:59:59.999`) },
	}).select('startTime status');
	res.json({ success: true, data: getAvailableSlots(doctor, date, appointments), availableSlots: getAvailableSlots(doctor, date, appointments), doctorId: req.params.doctorId, date });
});
exports.submitAppointmentReview = asyncHandler(async (req, res) => res.json({ success: true, data: await Appointment.findByIdAndUpdate(req.params.id, { $set: { review: req.body } }, { new: true }) }));
exports.createVideoConsultationSession = asyncHandler(async (req, res) => res.json({ success: true, session: { provider: 'webrtc', appointmentId: req.params.id, roomId: `appointment-${req.params.id}` } }));