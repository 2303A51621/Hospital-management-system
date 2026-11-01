const { Bed, Ward } = require('../models/Ward');
const { asyncHandler, validId } = require('./_helpers');

const bedPrefix = (wardName) => wardName.replace(/\s+Ward$/, '').replace(/\s+/g, '-').toUpperCase();

const ensureBeds = async (ward) => {
  const existing = await Bed.find({ wardId: ward._id }).sort({ bedNumber: 1 });
  if (existing.length >= ward.totalBeds) return existing;
  const prefix = bedPrefix(ward.wardName);
  const beds = [...existing];
  for (let index = existing.length + 1; index <= ward.totalBeds; index += 1) {
    beds.push(await Bed.create({
      bedNumber: `${prefix}-${String(index).padStart(3, '0')}`,
      wardId: ward._id,
      bedType: ward.wardType === 'icu' ? 'premium' : 'standard',
      status: 'available',
      costPerDay: ward.averageCostPerDay || 0,
    }));
  }
  return beds;
};

exports.getWardDashboard = asyncHandler(async (req, res) => {
  const wards = await Ward.find({ isActive: true }).sort({ wardName: 1 });
  const data = [];
  for (const ward of wards) {
    const beds = await ensureBeds(ward);
    const occupiedBeds = beds.filter((bed) => bed.status === 'occupied').length;
    const availableBeds = beds.filter((bed) => bed.status === 'available').length;
    const updatedWard = await Ward.findByIdAndUpdate(
      ward._id,
      { occupiedBeds, availableBeds, beds: beds.map((bed) => bed._id) },
      { new: true }
    );
    data.push({ ward: updatedWard, beds });
  }
  const summary = data.reduce((result, item) => {
    result.totalBeds += item.beds.length;
    result.occupiedBeds += item.beds.filter((bed) => bed.status === 'occupied').length;
    result.availableBeds += item.beds.filter((bed) => bed.status === 'available').length;
    result.maintenanceBeds += item.beds.filter((bed) => bed.status === 'maintenance').length;
    return result;
  }, { totalBeds: 0, occupiedBeds: 0, availableBeds: 0, maintenanceBeds: 0 });
  res.json({ success: true, data, summary });
});

exports.updateBedStatus = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid bed id' });
  const allowedStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid bed status' });
  const bed = await Bed.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!bed) return res.status(404).json({ message: 'Bed not found' });
  res.json({ success: true, data: bed });
});
