const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { asyncHandler, validId } = require('./_helpers');

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 8 * 1024 * 1024;

const getPatientForUser = (userId) => Patient.findOne({ userId }).select('_id userId').lean();

exports.getMedicalRecords = asyncHandler(async (req, res) => {
  let patientId = req.query.patientId;
  let patientRecordIds;
  if (req.user.role === 'patient') {
    const patient = await getPatientForUser(req.user._id);
    if (!patient) return res.json({ success: true, data: [], count: 0 });
    patientId = patient._id;
    patientRecordIds = [patient._id, req.user._id];
  } else if (patientId && !validId(patientId)) {
    return res.status(400).json({ message: 'Invalid patient id' });
  }

  const filter = patientRecordIds ? { patientId: { $in: patientRecordIds } } : (patientId ? { patientId } : {});
  const records = await MedicalRecord.find(filter)
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } })
    .sort({ createdAt: -1 })
    .select('-fileData');
  res.json({ success: true, data: records, count: records.length });
});

exports.uploadMedicalRecord = asyncHandler(async (req, res) => {
  if (!['doctor', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Only doctors or administrators can upload medical records' });
  const { patientId, title, notes, recordType = 'prescription' } = req.body || {};
  if (!validId(patientId)) return res.status(400).json({ message: 'A valid patient is required' });
  if (!title || !req.file) return res.status(400).json({ message: 'Title and file are required' });
  const fileType = req.file.mimetype;
  if (!allowedTypes.includes(fileType)) return res.status(400).json({ message: 'Only PDF, JPEG, PNG, and WebP files are supported' });
  if (req.file.size > maxFileSize) return res.status(400).json({ message: 'Files must be 8 MB or smaller' });
  const doctor = req.user.role === 'doctor' ? await Doctor.findOne({ userId: req.user._id }).select('_id') : await Doctor.findOne().select('_id');
  if (!doctor) return res.status(400).json({ message: 'Doctor profile not found' });
  const patient = await Patient.findOne({
    $or: [{ _id: patientId }, { userId: patientId }],
  }).select('_id');
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  const fileData = `data:${fileType};base64,${req.file.buffer.toString('base64')}`;
  const record = await MedicalRecord.create({ patientId: patient._id, doctorId: doctor._id, recordType, title, notes, fileName: req.file.originalname, fileType, fileData });
  const populated = await MedicalRecord.findById(record._id)
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } })
    .select('-fileData');
  res.status(201).json({ success: true, data: populated });
});

exports.downloadMedicalRecord = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid record id' });
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ message: 'Medical record not found' });
  if (req.user.role === 'patient') {
    const patient = await getPatientForUser(req.user._id);
    if (!patient || String(patient._id) !== String(record.patientId)) {
      return res.status(403).json({ message: 'Not authorized to access this record' });
    }
  }
  res.json({ success: true, data: { fileName: record.fileName, fileType: record.fileType, fileData: record.fileData } });
});
