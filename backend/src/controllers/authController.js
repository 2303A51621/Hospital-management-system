const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const User = require('../models/User');
const { asyncHandler } = require('./_helpers');

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (user) => user.toObject({ transform: (_, value) => {
  delete value.password;
  delete value.mfaSecret;
  value.id = value._id.toString();
  return value;
} });

exports.register = asyncHandler(async (req, res) => {
  const { email, password, role = 'patient', ...details } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role).trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }
  if (!['patient', 'doctor', 'admin'].includes(normalizedRole)) {
    return res.status(403).json({ message: 'This account role can only be assigned by an administrator' });
  }
  const user = await User.create({
    ...details,
    email: normalizedEmail,
    phone: String(details.phone || '').trim() || undefined,
    password,
    role: normalizedRole,
  });

  if (normalizedRole === 'patient') {
    const Patient = require('../models/Patient');
    await Patient.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        emergencyContact: details.emergencyContact || undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (normalizedRole === 'doctor') {
    const Doctor = require('../models/Doctor');
    await Doctor.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        licenseNumber: details.licenseNumber || `TEMP-${Date.now()}`,
        specialization: details.specialization || 'General Physician',
        experience: Number(details.experience) || 0,
        consultationFee: Number(details.consultationFee) || 0,
        department: details.department || 'General Medicine',
        qualification: details.qualification || [],
        bio: details.bio || 'New doctor profile created automatically.',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  res.status(201).json({ success: true, token: tokenFor(user), user: publicUser(user) });
});

exports.createAdmin = asyncHandler(async (req, res) => {
  const { email, password, ...details } = req.body;
  const user = await User.create({
    ...details,
    email: String(email || '').trim().toLowerCase(),
    phone: String(details.phone || '').trim() || undefined,
    password,
    role: 'admin',
  });

  res.status(201).json({ success: true, user: publicUser(user) });
});

exports.getStaff = asyncHandler(async (req, res) => {
  const allowedRoles = ['doctor', 'nurse', 'lab_technician', 'receptionist', 'pharmacist'];
  const users = await User.find({ role: { $in: allowedRoles } })
    .select('name firstName lastName email phone role status lastLogin createdAt')
    .sort({ role: 1, name: 1 });
  const Doctor = require('../models/Doctor');
  const doctors = await Doctor.find({ userId: { $in: users.map((user) => user._id) } })
    .select('userId specialization department availability availableDays availableSlots isActive');
  const doctorByUserId = new Map(doctors.map((doctor) => [String(doctor.userId), doctor]));
  const data = users.map((user) => ({ ...user.toObject(), doctorProfile: doctorByUserId.get(String(user._id)) || null }));
  const groups = {
    doctors: data.filter((staff) => staff.role === 'doctor'),
    nurses: data.filter((staff) => staff.role === 'nurse'),
    technicians: data.filter((staff) => staff.role === 'lab_technician'),
    erCare: data.filter((staff) => ['receptionist', 'pharmacist'].includes(staff.role)),
  };
  res.json({ success: true, data, count: data.length, groups });
});

exports.createStaff = asyncHandler(async (req, res) => {
  const { email, password, role, ...details } = req.body || {};
  const allowedRoles = ['doctor', 'nurse', 'lab_technician', 'receptionist', 'pharmacist'];
  if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid staff role' });
  const user = await User.create({ ...details, email: String(email || '').trim().toLowerCase(), phone: String(details.phone || '').trim() || undefined, password, role });
  if (role === 'doctor') {
    const Doctor = require('../models/Doctor');
    await Doctor.create({
      userId: user._id,
      licenseNumber: details.licenseNumber || `TEMP-${Date.now()}`,
      specialization: details.specialization || 'General Physician',
      experience: Number(details.experience) || 0,
      consultationFee: Number(details.consultationFee) || 0,
      department: details.department || 'General Medicine',
      qualification: details.qualification || [],
    });
  }
  res.status(201).json({ success: true, data: user.toObject() });
});

exports.login = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.phone;
  const user = await User.findOne({ $or: [{ email: String(identifier).toLowerCase() }, { phone: String(identifier) }] }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Invalid credentials' });
  user.lastLogin = new Date();
  await user.save();
  const token = tokenFor(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true, token, user: publicUser(user) });
});

exports.getMe = asyncHandler(async (req, res) => res.json({ success: true, user: publicUser(req.user) }));
exports.logout = asyncHandler(async (req, res) => { res.clearCookie('token'); res.json({ success: true, message: 'Logged out' }); });
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) { user.resetPasswordToken = crypto.randomBytes(20).toString('hex'); user.resetPasswordExpires = Date.now() + 600000; await user.save({ validateBeforeSave: false }); }
  res.json({ success: true, message: 'If the account exists, reset instructions have been issued' });
});
exports.resetPassword = asyncHandler(async (req, res) => res.status(501).json({ message: 'Password reset delivery is not configured' }));