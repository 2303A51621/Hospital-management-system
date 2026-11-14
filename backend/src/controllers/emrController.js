const EMR = require('../models/EMR');
const Prescription = require('../models/Prescription');
const { list, getById, create, updateById, asyncHandler } = require('./_helpers');
exports.getEMRs = list(EMR, { filter: (req) => req.user.role === 'patient' ? { patientId: req.user._id } : {} });
exports.getEMR = getById(EMR, { name: 'EMR' });
exports.createEMR = create(EMR);
exports.updateEMR = updateById(EMR, { name: 'EMR' });
exports.getPatientEMRHistory = list(EMR, { filter: (req) => ({ patientId: req.params.patientId }) });
exports.addPrescription = asyncHandler(async (req, res) => {
  const body = { ...req.body, emrId: req.params.id };
  if (Array.isArray(body.medicines)) {
    body.medicines = body.medicines.map((m) => {
      const medName = (m.medicineName || m.name || '').trim();
      return {
        ...m,
        medicineName: medName || 'Prescribed Medication',
        name: medName || 'Prescribed Medication',
      };
    });
  }
  const prescription = await Prescription.create(body);
  res.status(201).json({ success: true, data: prescription });
});
exports.getEMRVersions = asyncHandler(async (req, res) => { const record = await EMR.findById(req.params.id); res.json({ success: true, data: record?.versions || [] }); });