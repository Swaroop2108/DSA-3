const http = require('http');
const assert = require('assert');
const express = require('express');

// Import app components
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const { getDbStatus } = require('../config/db');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    server: 'MediSchedule API',
    database: getDbStatus(),
    status: 'healthy',
    timestamp: new Date()
  });
});

app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/patients', require('../routes/patientRoutes'));
app.use('/api/beds', require('../routes/bedRoutes'));
app.use('/api/ors', require('../routes/orRoutes'));
app.use('/api/staff', require('../routes/staffRoutes'));
app.use('/api/surgeries', require('../routes/surgeryRoutes'));
app.use('/api/scheduling', require('../routes/schedulingRoutes'));
app.use('/api/dashboard', require('../routes/dashboardRoutes'));
app.use('/api/reports', require('../routes/reportRoutes'));
app.use('/api/audit', require('../routes/auditRoutes'));
app.use(errorHandler);

let server;
let port;
let adminToken = '';
let createdPatientId = '';
let allocatedBedId = 'GEN-05';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (dataStr) {
      options.headers['Content-Length'] = Buffer.byteLength(dataStr);
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting MediSchedule Backend Integration Test Suite...\n');

  // Initialize DB & Seed Data
  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });

  try {
    // TEST 1: Health Check Endpoint
    console.log('1. Testing GET /api/health ...');
    const healthRes = await request('GET', '/api/health');
    assert.strictEqual(healthRes.status, 200, 'Health check status should be 200');
    assert.strictEqual(healthRes.body.status, 'healthy', 'Status should be healthy');
    console.log('   ✅ GET /api/health PASSED');

    // TEST 2: Admin Login
    console.log('2. Testing POST /api/auth/login (Admin) ...');
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: 'admin@medischedule.com',
      password: 'admin123',
      role: 'admin'
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
    assert.strictEqual(adminLoginRes.body.success, true, 'Admin login should succeed');
    assert.ok(adminLoginRes.body.token, 'Token should be returned');
    adminToken = adminLoginRes.body.token;
    console.log('   ✅ Admin Login PASSED');

    // TEST 3: Staff Login
    console.log('3. Testing POST /api/auth/login (Staff) ...');
    const staffLoginRes = await request('POST', '/api/auth/login', {
      email: 'staff@medischedule.com',
      password: 'staff123',
      role: 'staff'
    });
    assert.strictEqual(staffLoginRes.status, 200, 'Staff login should return 200');
    assert.strictEqual(staffLoginRes.body.user.role, 'staff', 'Role should be staff');
    console.log('   ✅ Staff Login PASSED');

    // TEST 4: Invalid Login
    console.log('4. Testing POST /api/auth/login (Invalid Credentials) ...');
    const invalidLoginRes = await request('POST', '/api/auth/login', {
      email: 'admin@medischedule.com',
      password: 'wrongpassword'
    });
    assert.strictEqual(invalidLoginRes.status, 401, 'Invalid login should return 401');
    assert.strictEqual(invalidLoginRes.body.success, false, 'Success should be false');
    console.log('   ✅ Invalid Login Check PASSED');

    // TEST 5: Get Patients List
    console.log('5. Testing GET /api/patients ...');
    const patientsRes = await request('GET', '/api/patients', null, adminToken);
    assert.strictEqual(patientsRes.status, 200, 'Get patients should return 200');
    assert.ok(Array.isArray(patientsRes.body.patients), 'Patients list should be an array');
    console.log(`   ✅ GET /api/patients PASSED (${patientsRes.body.patients.length} patients found)`);

    // TEST 6: Create Patient
    console.log('6. Testing POST /api/patients (Register Patient) ...');
    const newPatRes = await request('POST', '/api/patients', {
      name: 'Test Verification Patient',
      age: 42,
      gender: 'Male',
      diagnosis: 'Acute Gastritis',
      priority: 3
    }, adminToken);
    assert.strictEqual(newPatRes.status, 201, 'Patient creation should return 201');
    assert.ok(newPatRes.body.patient.patientId, 'Patient ID should be generated');
    createdPatientId = newPatRes.body.patient.patientId;
    console.log(`   ✅ POST /api/patients PASSED (Created: ${createdPatientId})`);

    // TEST 7: Get Beds
    console.log('7. Testing GET /api/beds ...');
    const bedsRes = await request('GET', '/api/beds', null, adminToken);
    assert.strictEqual(bedsRes.status, 200, 'Get beds should return 200');
    assert.ok(Array.isArray(bedsRes.body.beds), 'Beds list should be an array');
    console.log(`   ✅ GET /api/beds PASSED (${bedsRes.body.beds.length} beds found)`);

    // TEST 8: Allocate Bed
    console.log(`8. Testing POST /api/beds/${allocatedBedId}/allocate ...`);
    const allocRes = await request('POST', `/api/beds/${allocatedBedId}/allocate`, {
      patientId: createdPatientId
    }, adminToken);
    assert.strictEqual(allocRes.status, 200, 'Bed allocation should return 200');
    assert.strictEqual(allocRes.body.bed.status, 'OCCUPIED', 'Bed status should be OCCUPIED');
    console.log('   ✅ Bed Allocation PASSED');

    // TEST 9: Release Bed
    console.log(`9. Testing POST /api/beds/${allocatedBedId}/release ...`);
    const releaseRes = await request('POST', `/api/beds/${allocatedBedId}/release`, null, adminToken);
    assert.strictEqual(releaseRes.status, 200, 'Bed release should return 200');
    assert.strictEqual(releaseRes.body.bed.status, 'AVAILABLE', 'Bed status should be AVAILABLE');
    console.log('   ✅ Bed Release PASSED');

    // TEST 10: Get Operating Rooms
    console.log('10. Testing GET /api/ors ...');
    const orsRes = await request('GET', '/api/ors', null, adminToken);
    assert.strictEqual(orsRes.status, 200, 'Get ORs should return 200');
    assert.ok(Array.isArray(orsRes.body.ors), 'ORs should be an array');
    console.log(`   ✅ GET /api/ors PASSED (${orsRes.body.ors.length} ORs found)`);

    // TEST 11: Conflict Detection
    console.log('11. Testing GET /api/scheduling/conflicts ...');
    const conflictsRes = await request('GET', '/api/scheduling/conflicts', null, adminToken);
    assert.strictEqual(conflictsRes.status, 200, 'Conflicts check should return 200');
    assert.ok(Array.isArray(conflictsRes.body.conflicts), 'Conflicts should be an array');
    console.log('   ✅ Conflict Detection PASSED');

    // TEST 12: DSA Demo Simulation
    console.log('12. Testing POST /api/scheduling/dsa-demo ...');
    const dsaDemoRes = await request('POST', '/api/scheduling/dsa-demo', {}, adminToken);
    assert.strictEqual(dsaDemoRes.status, 200, 'DSA Demo should return 200');
    assert.ok(Array.isArray(dsaDemoRes.body.demoSteps), 'Demo steps should be an array');
    console.log(`   ✅ DSA Engine Simulation PASSED (${dsaDemoRes.body.demoSteps.length} steps visualizer verified)`);

    // TEST 13: Dashboard Stats
    console.log('13. Testing GET /api/dashboard/stats ...');
    const statsRes = await request('GET', '/api/dashboard/stats', null, adminToken);
    assert.strictEqual(statsRes.status, 200, 'Dashboard stats should return 200');
    assert.ok(statsRes.body.stats.totalPatients > 0, 'Total patients should be > 0');
    console.log('   ✅ Dashboard Stats API PASSED');

    // TEST 14: Reports & Analytics
    console.log('14. Testing GET /api/reports ...');
    const reportsRes = await request('GET', '/api/reports?timeframe=week', null, adminToken);
    assert.strictEqual(reportsRes.status, 200, 'Reports should return 200');
    assert.ok(reportsRes.body.report, 'Report data should exist');
    console.log('   ✅ Reports API PASSED');

    console.log('\n========================================');
    console.log('🎉 ALL 14 AUTOMATED INTEGRATION TESTS PASSED!');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Integration test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
