const http = require('http');
const { app } = require('../server');
const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🏥 KUSHAL HOSPITALS BACKEND REST API VALIDATION SUITE');
  console.log('===============================================================');

  await connectDB();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const status = res.status;
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status, data };
  }

  const results = [];

  function record(id, moduleName, description, expected, actual, passed) {
    results.push({ id, moduleName, description, expected, actual, passed });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${mark} [${id}] ${moduleName} - ${description} (HTTP ${actual})`);
  }

  let adminToken = null;
  let doctorToken = null;
  let patientToken = null;

  console.log('--- 1. SYSTEM & HEALTH CHECKS ---');
  {
    const res = await request('GET', '/health');
    record('TC-SYS-01', 'System', 'GET /health returns 200 OK', '200', res.status, res.status === 200 && res.data?.status === 'OK');
  }
  {
    const res = await request('GET', '/api/health');
    record('TC-SYS-02', 'System', 'GET /api/health returns 200 OK', '200', res.status, res.status === 200 && res.data?.success === true);
  }

  console.log('\n--- 2. AUTHENTICATION & RBAC ---');
  {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@kushalhospitals.com',
      password: 'Admin@123456',
    });
    adminToken = res.data?.token || res.data?.data?.token;
    record('TC-AUTH-01', 'Authentication', 'Admin login with valid credentials', '200', res.status, res.status === 200 && !!adminToken);
  }
  {
    const res = await request('POST', '/api/auth/login', {
      email: 'doctor@kushalhospitals.com',
      password: 'Doctor@123456',
    });
    doctorToken = res.data?.token || res.data?.data?.token;
    record('TC-AUTH-02', 'Authentication', 'Doctor login with valid credentials', '200', res.status, res.status === 200 && !!doctorToken);
  }
  {
    const res = await request('POST', '/api/auth/login', {
      email: 'patient@kushalhospitals.com',
      password: 'Patient@123456',
    });
    patientToken = res.data?.token || res.data?.data?.token;
    record('TC-AUTH-03', 'Authentication', 'Patient login with valid credentials', '200', res.status, res.status === 200 && !!patientToken);
  }
  {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@kushalhospitals.com',
      password: 'WrongPassword999',
    });
    record('TC-AUTH-04', 'Authentication', 'Reject invalid password with 401', '401', res.status, res.status === 401);
  }

  console.log('\n--- 3. DOCTOR MODULE ---');
  {
    const res = await request('GET', '/api/doctors', null, adminToken);
    record('TC-DOC-01', 'Doctor', 'List active doctors directory', '200', res.status, res.status === 200 && (Array.isArray(res.data) || Array.isArray(res.data?.data)));
  }
  {
    const res = await request('GET', '/api/doctor-portal/dashboard', null, doctorToken);
    record('TC-DOC-02', 'Doctor Portal', 'Fetch doctor dashboard metrics & appointments', '200', res.status, res.status === 200);
  }

  console.log('\n--- 4. PATIENT PORTAL MODULE ---');
  {
    const res = await request('GET', '/api/patient-portal/dashboard', null, patientToken);
    record('TC-PAT-01', 'Patient Portal', 'Fetch patient dashboard metrics & stats', '200', res.status, res.status === 200);
  }
  {
    const res = await request('GET', '/api/patient-portal/appointments', null, patientToken);
    record('TC-PAT-02', 'Patient Portal', 'Fetch patient appointments list', '200', res.status, res.status === 200);
  }

  console.log('\n--- 5. APPOINTMENTS MODULE ---');
  {
    const res = await request('GET', '/api/appointments', null, adminToken);
    record('TC-APT-01', 'Appointments', 'Admin lists all hospital appointments', '200', res.status, res.status === 200);
  }

  console.log('\n--- 6. WARDS & BED MANAGEMENT ---');
  {
    const res = await request('GET', '/api/wards', null, adminToken);
    record('TC-WRD-01', 'Wards & Beds', 'Fetch hospital wards and bed statuses', '200', res.status, res.status === 200);
  }

  console.log('\n--- 7. PHARMACY & MEDICINES ---');
  {
    const res = await request('GET', '/api/medicines', null, adminToken);
    record('TC-PHM-01', 'Pharmacy', 'Fetch pharmacy medicine inventory', '200', res.status, res.status === 200);
  }

  console.log('\n--- 8. BILLING & INVOICES ---');
  {
    const res = await request('GET', '/api/billing', null, adminToken);
    record('TC-BIL-01', 'Billing', 'Admin fetches billing records and revenue stats', '200', res.status, res.status === 200);
  }

  console.log('\n--- 9. EMERGENCY & DISPATCH ---');
  {
    const res = await request('GET', '/api/emergency/admin/requests', null, adminToken);
    record('TC-EMG-01', 'Emergency', 'Fetch active emergency requests and triage', '200', res.status, res.status === 200);
  }

  console.log('\n--- 10. AI ASSISTANT CONVERSATION & AUDIT ---');
  {
    const res = await request('POST', '/api/ai-chat/message', {
      message: 'Hello, what cardiology services are offered at Kushal Hospitals?',
    }, patientToken);
    record('TC-AI-01', 'AI Assistant', 'AI clinical conversation endpoint returns structured reply', '200', res.status, res.status === 200 && res.data?.success === true);
  }

  console.log('\n===============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`🏁 API SUITE COMPLETE: ${passedCount}/${totalCount} PASSED | ${totalCount - passedCount} FAILED`);
  console.log('===============================================================');

  server.close();
  await mongoose.connection.close();
  process.exit(totalCount === passedCount ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
