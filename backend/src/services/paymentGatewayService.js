const crypto = require('node:crypto');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Online payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    error.statusCode = 503;
    throw error;
  }
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createOrder = async (invoice) => {
  const razorpay = getRazorpay();
  return razorpay.orders.create({
    amount: Math.round(Number(invoice.summary.totalAmount) * 100),
    currency: 'INR',
    receipt: invoice.invoiceNumber,
    notes: { paymentId: invoice.paymentDetails.paymentId },
  });
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const received = Buffer.from(String(signature || ''));
  const expectedBuffer = Buffer.from(expected);
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, received);
};

module.exports = { createOrder, verifyPaymentSignature };
