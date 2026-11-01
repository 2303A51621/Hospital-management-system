require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Medicine = require('../models/Medicine');

const medicines = [
  ['Amoxicillin 500mg', 'Amoxicillin', 'capsule', '500mg', 'Cipla', 'AMX-500-26', 21, 'strips', 10, 200],
  ['Paracetamol 500mg', 'Paracetamol', 'tablet', '500mg', 'Sun Pharma', 'PCM-500-26', 94, 'strips', 20, 15],
  ['Ibuprofen 400mg', 'Ibuprofen', 'tablet', '400mg', 'Abbott', 'IBU-400-26', 70, 'strips', 10, 20],
  ['Azithromycin 250mg', 'Azithromycin', 'tablet', '250mg', 'Alkem', 'AZI-250-26', 38, 'strips', 10, 85],
  ['Ceftriaxone 1g', 'Ceftriaxone', 'injection', '1g', 'Mankind', 'CEF-1G-26', 8, 'vials', 10, 145],
  ['Insulin Regular', 'Human insulin', 'injection', '100 IU/ml', 'Biocon', 'INS-R-26', 16, 'vials', 5, 420],
  ['Ondansetron 4mg', 'Ondansetron', 'injection', '4mg/2ml', 'Zydus', 'OND-4-26', 24, 'vials', 8, 55],
  ['Pantoprazole 40mg', 'Pantoprazole', 'tablet', '40mg', 'Dr Reddy’s', 'PAN-40-26', 62, 'strips', 15, 110],
  ['ORS Orange', 'Oral rehydration salts', 'powder', '21g', 'Electral', 'ORS-O-26', 45, 'boxes', 10, 25],
  ['Salbutamol Syrup', 'Salbutamol', 'syrup', '100ml', 'Cipla', 'SAL-100-26', 18, 'bottles', 8, 95],
  ['Mupirocin Cream', 'Mupirocin', 'cream', '2%', 'Glenmark', 'MUP-2-26', 29, 'pieces', 8, 125],
  ['Cetirizine 10mg', 'Cetirizine', 'tablet', '10mg', 'Hetero', 'CET-10-26', 55, 'strips', 15, 35],
  ['Vitamin D3 Drops', 'Cholecalciferol', 'drops', '400 IU/ml', 'Meyer', 'VIT-D-26', 12, 'bottles', 5, 165],
  ['Lidocaine 2%', 'Lidocaine', 'injection', '2%', 'Nirlife', 'LID-2-26', 14, 'vials', 5, 75],
  ['Dextrose 5% 500ml', 'Dextrose', 'injection', '5% 500ml', 'B Braun', 'DEX-5-26', 20, 'bottles', 6, 90],
];

const seed = async () => {
  await connectDB();
  const expiryDate = (index) => {
    const date = new Date();
    date.setMonth(date.getMonth() + (index === 4 ? 2 : 12 + index));
    return date;
  };
  for (const [medicineName, genericName, medicineType, strength, manufacturer, batchNumber, quantity, unit, minThreshold, sellingPrice] of medicines) {
    await Medicine.findOneAndUpdate(
      { medicineName },
      {
        medicineName, genericName, medicineType, strength, manufacturer, batchNumber,
        expiryDate: expiryDate(medicines.findIndex((item) => item[0] === medicineName)),
        cost: { purchasePrice: Math.round(sellingPrice * 0.7), sellingPrice },
        stock: { quantity, unit, minThreshold, maxThreshold: quantity * 3 },
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Medicine seed complete: ${medicines.length} inventory items`);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error('Medicine seed failed:', error.message);
  await mongoose.connection.close();
  process.exitCode = 1;
});
