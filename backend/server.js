const path = require('node:path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { connectDB } = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const { handleRazorpayWebhook } = require('./src/controllers/billingController');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const port = Number(process.env.PORT || 5000);
const host = '0.0.0.0';
const configuredOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/+$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  ...configuredOrigins,
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by the API CORS policy'));
  },
  credentials: true,
}));
app.post('/api/billing/webhook/razorpay', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => res.json({
  status: 'OK',
  message: 'Hospital backend is running',
}));
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/doctors', require('./src/routes/doctorRoutes'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/billing', require('./src/routes/billingRoutes'));
app.use('/api/medicines', require('./src/routes/medicineRoutes'));
app.use('/api/wards', require('./src/routes/wardRoutes'));
app.use('/api/medical-records', require('./src/routes/medicalRecordRoutes'));
app.use('/api/emr', require('./src/routes/emrRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/emergency', require('./src/routes/emergencyRoutes'));
app.use('/api/ai/chat', require('./src/routes/aiChatRoutes'));

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  const server = app.listen(port, host, () => {
    console.log(`Hospital backend running on http://${host}:${port}`);
  });
  server.on('error', (error) => {
    console.error('Backend server failed to listen:', error.message || error);
    process.exitCode = 1;
  });
  return server;
};

if (require.main === module) {
  start().catch((error) => {
    console.error('Backend startup failed:', error.message || error);
    process.exit(1);
  });
}

module.exports = { app, start };