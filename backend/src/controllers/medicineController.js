const Medicine = require('../models/Medicine');
const { asyncHandler, validId } = require('./_helpers');

const medicineFilter = (req) => {
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { medicineName: { $regex: req.query.search, $options: 'i' } },
      { genericName: { $regex: req.query.search, $options: 'i' } },
      { batchNumber: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.active !== undefined) filter.isActive = req.query.active !== 'false';
  return filter;
};

exports.getMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find(medicineFilter(req)).sort({ medicineName: 1, expiryDate: 1 });
  const now = new Date();
  const lowStock = medicines.filter((medicine) => medicine.stock.quantity <= (medicine.stock.minThreshold || 0)).length;
  const expiringSoon = medicines.filter((medicine) => {
    const days = (new Date(medicine.expiryDate) - now) / 86400000;
    return days >= 0 && days <= 90;
  }).length;
  res.json({ success: true, data: medicines, count: medicines.length, summary: { lowStock, expiringSoon } });
});

exports.createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ success: true, data: medicine });
});

exports.updateMedicine = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid medicine id' });
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
  res.json({ success: true, data: medicine });
});

exports.deleteMedicine = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid medicine id' });
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
  res.json({ success: true, data: medicine });
});
