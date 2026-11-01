const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateBillingSummary, prepareInsuranceClaim } = require('../services/billingService');

test('calculateBillingSummary totals consultation, lab, medicine and room charges with GST', () => {
  const summary = calculateBillingSummary([
    { itemType: 'consultation', description: 'Consultation', quantity: 1, unitPrice: 1500, discount: 100 },
    { itemType: 'lab-test', description: 'CBC test', quantity: 1, unitPrice: 850 },
    { itemType: 'medicine', description: 'Antibiotics', quantity: 2, unitPrice: 220 },
    { itemType: 'bed-charges', description: 'Ward room charge', quantity: 2, unitPrice: 900 },
  ]);

  assert.equal(summary.subtotal, 4490);
  assert.equal(summary.gstAmount, 808.2);
  assert.equal(summary.totalAmount, 5298.2);
});

test('prepareInsuranceClaim keeps claim as pending when a valid policy is supplied', () => {
  const claim = prepareInsuranceClaim({
    providerName: 'Star Health',
    policyNumber: 'POL-2025-118',
    coverage: 'General hospitalisation',
    claimAmount: 3400,
    totalAmount: 5400,
  });

  assert.equal(claim.claimStatus, 'pending');
  assert.equal(claim.claimAmount, 3400);
  assert.equal(claim.insuranceProvider, 'Star Health');
});