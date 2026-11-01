const calculateLineTotal = (item) => {
  const quantity = Number(item.quantity || 1);
  const unitPrice = Number(item.unitPrice || 0);
  const discount = Number(item.discount || 0);
  const raw = quantity * unitPrice;
  const discounted = Math.max(raw - discount, 0);

  return {
    quantity,
    unitPrice,
    discount,
    total: Number(discounted.toFixed(2)),
  };
};

const calculateBillingSummary = (billItems = [], gstRate = 18) => {
  const normalizedItems = (billItems || []).map((item) => {
    const lineTotal = calculateLineTotal(item);
    return {
      ...item,
      ...lineTotal,
      total: lineTotal.total,
    };
  });

  const subtotal = normalizedItems.reduce((total, item) => total + Number(item.total || 0), 0);
  const gstAmount = Number(((subtotal * gstRate) / 100).toFixed(2));
  const totalAmount = Number((subtotal + gstAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    gstRate,
    gstAmount,
    discountAmount: normalizedItems.reduce((total, item) => total + Number(item.discount || 0), 0),
    totalAmount,
    lineItems: normalizedItems,
  };
};

const prepareInsuranceClaim = ({ providerName, policyNumber, coverage, claimAmount = 0, totalAmount = 0 }) => {
  const hasInsurance = Boolean(providerName && policyNumber && coverage);
  const amount = Number(claimAmount || 0);

  return {
    insuranceProvider: providerName || null,
    policyNumber: policyNumber || null,
    coverage: coverage || null,
    claimAmount: amount,
    claimStatus: hasInsurance ? 'pending' : 'na',
    approvedAmount: hasInsurance ? Math.min(amount, Number(totalAmount || amount || 0)) : 0,
  };
};

const buildInvoicePayload = (payload = {}) => {
  const items = Array.isArray(payload.billItems) ? payload.billItems : [];
  const summary = calculateBillingSummary(items, payload.gstRate ?? 18);
  const insurance = prepareInsuranceClaim({
    providerName: payload.insurance?.insuranceProvider,
    policyNumber: payload.insurance?.policyNumber,
    coverage: payload.insurance?.coverage,
    claimAmount: payload.insurance?.claimAmount,
    totalAmount: summary.totalAmount,
  });

  return {
    ...payload,
    billItems: items.map((item) => ({
      ...item,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      discount: Number(item.discount || 0),
      total: Number(calculateLineTotal(item).total),
    })),
    summary: {
      subtotal: summary.subtotal,
      gstRate: summary.gstRate,
      gstAmount: summary.gstAmount,
      discountAmount: summary.discountAmount,
      totalAmount: summary.totalAmount,
    },
    insurance: {
      insuranceProvider: insurance.insuranceProvider,
      policyNumber: insurance.policyNumber,
      claimAmount: insurance.claimAmount,
      claimStatus: insurance.claimStatus,
      coverage: insurance.coverage,
    },
    paymentDetails: {
      ...payload.paymentDetails,
      paymentMethod: payload.paymentDetails?.paymentMethod || 'cash',
      paymentStatus: payload.paymentDetails?.paymentStatus || 'pending',
    },
    status: payload.status || 'issued',
  };
};

module.exports = {
  calculateLineTotal,
  calculateBillingSummary,
  prepareInsuranceClaim,
  buildInvoicePayload,
};
