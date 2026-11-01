const EmergencyRequest = require('../models/EmergencyRequest');
const AmbulanceUnit = require('../models/AmbulanceUnit');
const { asyncHandler } = require('./_helpers');
const emergencyPhone = process.env.EMERGENCY_PHONE || '+919999999999';

exports.createEmergencyRequest = asyncHandler(async (req, res) => {
	const request = await EmergencyRequest.create({
		...req.body,
		requesterUserId: req.user?._id || null,
	});

	res.status(201).json({
		success: true,
		message: 'Emergency request submitted successfully.',
		request,
		ambulance: null,
		liveTracking: null,
		emergencyPhone,
	});
});

exports.getNearestAvailability = asyncHandler(async (req, res) => {
	const availableUnits = await AmbulanceUnit.find({ status: 'available' }).sort({ createdAt: 1 });
	const nearestUnit = availableUnits[0];

	res.json({
		success: true,
		availableCount: availableUnits.length,
		nearest: nearestUnit
			? {
					ambulanceId: nearestUnit._id,
					unitCode: nearestUnit.unitCode,
					driverName: nearestUnit.driverName,
					distanceKm: 0,
					etaMinutes: 0,
				}
			: null,
		emergencyPhone,
	});
});

exports.getEmergencyTracking = asyncHandler(async (req, res) => {
	const request = await EmergencyRequest.findOne({ requestCode: req.params.requestId }).populate('assignedAmbulance');
	res.json({ success: true, request, emergencyPhone });
});
exports.getAdminRequests = asyncHandler(async (req, res) => {
	const requests = await EmergencyRequest.find()
		.populate('assignedAmbulance')
		.sort({ createdAt: -1 });
	res.json({ success: true, requests, data: requests, count: requests.length });
});
exports.getAdminAmbulances = asyncHandler(async (req, res) => {
	const ambulances = await AmbulanceUnit.find().sort({ createdAt: -1 });
	res.json({ success: true, ambulances, data: ambulances, count: ambulances.length });
});
exports.updateEmergencyStatus = asyncHandler(async (req, res) => res.json({ success: true, data: await EmergencyRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }) }));
exports.reassignAmbulance = asyncHandler(async (req, res) => res.json({ success: true, data: await EmergencyRequest.findByIdAndUpdate(req.params.id, { ambulanceUnitId: req.body.ambulanceUnitId }, { new: true }) }));
exports.seedAmbulances = asyncHandler(async (req, res) => res.json({ success: true, data: await AmbulanceUnit.insertMany(req.body.ambulances || []) }));