const Doctor = require('../models/Doctor');
require('../models/User'); // Ensure User schema is registered for populate
const { getById, create, updateById, asyncHandler } = require('./_helpers');

const listDoctors = (filter) => asyncHandler(async (req, res) => {
  const query = filter(req);
  const doctors = await Doctor.find(query).populate('userId').sort({ createdAt: -1 });
  res.json({ success: true, data: doctors, count: doctors.length });
});

exports.getDoctors = listDoctors((req) => {
  const filter = {};
  if (req.query.specialization && req.query.specialization.toLowerCase() !== 'all' && req.query.specialization.toLowerCase() !== 'all specializations') {
    filter.specialization = req.query.specialization;
  }
  if (req.query.department) {
    filter.department = req.query.department;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { specialization: searchRegex },
      { department: searchRegex },
      { bio: searchRegex },
    ];
  }
  return filter;
});

exports.getDoctorsBySpecialization = listDoctors((req) => ({ specialization: req.params.specialization }));
exports.getDoctor = getById(Doctor, { name: 'Doctor', populate: 'userId' });
exports.createDoctor = create(Doctor);
exports.updateDoctor = updateById(Doctor, { name: 'Doctor' });
exports.getDoctorByUserId = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await Doctor.findOne({ userId: req.params.userId }).populate('userId') })
);
exports.getDoctorReviews = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).select('reviews averageRating rating totalReviews');
  res.json({
    success: true,
    data: doctor?.reviews || [],
    reviews: doctor?.reviews || [],
    doctor: {
      rating: doctor?.rating || doctor?.averageRating || 0,
      totalReviews: doctor?.totalReviews || (doctor?.reviews?.length || 0),
    },
    averageRating: doctor?.averageRating || doctor?.rating || 0,
  });
});
