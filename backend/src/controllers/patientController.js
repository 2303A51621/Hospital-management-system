const Patient = require('../models/Patient');
const { list, getById, create, updateById, removeById, asyncHandler } = require('./_helpers');
exports.getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find().populate('userId', 'name firstName lastName email phone').sort({ createdAt: -1 });
  res.json({ success: true, data: patients, patients, count: patients.length });
});
exports.getPatient = getById(Patient, { name: 'Patient' });
exports.createPatient = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const existing = await Patient.findOne({ userId: payload.userId || req.user._id });

  if (existing) {
    return res.json({ success: true, data: existing, message: 'Patient profile already exists' });
  }

  const patient = await Patient.create({
    userId: payload.userId || req.user._id,
    ...payload,
  });

  res.status(201).json({ success: true, data: patient });
});
exports.updatePatient = updateById(Patient, { name: 'Patient' });
exports.deletePatient = removeById(Patient, { name: 'Patient' });
exports.getPatientByUserId = asyncHandler(async (req, res) => {
  const data = await Patient.findOne({ userId: req.params.userId });
  res.json({ success: true, data });
});
exports.addMedicalHistory = asyncHandler(async (req, res) => res.json({ success: true, data: await Patient.findByIdAndUpdate(req.params.id, { $push: { medicalHistory: req.body } }, { new: true }) }));
exports.addAllergy = asyncHandler(async (req, res) => res.json({ success: true, data: await Patient.findByIdAndUpdate(req.params.id, { $push: { allergies: req.body } }, { new: true }) }));