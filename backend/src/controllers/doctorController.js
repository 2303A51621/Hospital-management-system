const Doctor = require('../models/Doctor');
const { getById, create, updateById, asyncHandler } = require('./_helpers');
const listDoctors = (filter) => asyncHandler(async (req, res) => {
	const doctors = await Doctor.find(filter(req)).populate('userId').sort({ createdAt: -1 });
	res.json({ success: true, data: doctors, count: doctors.length });
});
exports.getDoctors = listDoctors((req) => (req.query.specialization ? { specialization: req.query.specialization } : {}));
exports.getDoctorsBySpecialization = listDoctors((req) => ({ specialization: req.params.specialization }));
exports.getDoctor = getById(Doctor, { name: 'Doctor', populate: 'userId' });
exports.createDoctor = create(Doctor);
exports.updateDoctor = updateById(Doctor, { name: 'Doctor' });
exports.getDoctorByUserId = asyncHandler(async (req, res) => res.json({ success: true, data: await Doctor.findOne({ userId: req.params.userId }).populate('userId') }));
exports.getDoctorReviews = asyncHandler(async (req, res) => { const doctor = await Doctor.findById(req.params.id).select('reviews averageRating'); res.json({ success: true, data: doctor?.reviews || [], averageRating: doctor?.averageRating || 0 }); });