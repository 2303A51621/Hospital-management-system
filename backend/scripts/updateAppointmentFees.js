require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
require('../src/models/index');
const Appointment = require('../src/models/Appointment');
const Billing = require('../src/models/Billing');

const fixZeroFees = async () => {
  await connectDB();
  
  // Find appointments with consultationFee <= 0
  const apts = await Appointment.find({
    $or: [
      { consultationFee: { $lte: 0 } },
      { consultationFee: null },
      { consultationFee: { $exists: false } },
    ],
  });
  console.log(`Found ${apts.length} appointments with 0 or missing fee.`);
  for (const apt of apts) {
    apt.consultationFee = 600;
    await apt.save();
    console.log(`Updated Appointment ${apt._id} consultationFee to 600`);
    
    // Also update any linked billing with totalAmount 0
    if (apt.billingId) {
      const bill = await Billing.findById(apt.billingId);
      if (bill && (!bill.summary?.totalAmount || bill.summary.totalAmount === 0)) {
        bill.billItems = [{
          itemType: 'consultation',
          description: 'Consultation Fee',
          quantity: 1,
          unitPrice: 600,
          total: 600,
        }];
        bill.summary = {
          subtotal: 600,
          gstRate: 0,
          gstAmount: 0,
          totalAmount: 600,
        };
        await bill.save();
        console.log(`  -> Updated Billing ${bill._id} totalAmount to 600`);
      }
    }
  }

  // Also check any standalone billings with totalAmount <= 0
  const zeroBills = await Billing.find({
    $or: [
      { 'summary.totalAmount': { $lte: 0 } },
      { 'summary.totalAmount': null },
    ],
  });
  console.log(`Found ${zeroBills.length} zero bills.`);
  for (const bill of zeroBills) {
    bill.summary = {
      subtotal: 600,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 600,
    };
    if (bill.billItems && bill.billItems.length > 0) {
      bill.billItems[0].unitPrice = 600;
      bill.billItems[0].total = 600;
    }
    await bill.save();
    console.log(`Updated Billing ${bill._id} to 600`);
  }

  await mongoose.connection.close();
  console.log('Done!');
  process.exit(0);
};

fixZeroFees().catch((err) => {
  console.error(err);
  process.exit(1);
});
