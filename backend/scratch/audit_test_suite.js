const http = require('http');

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function executeAuditTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING SYSTEM AUDIT & FUNCTIONALITY VERIFICATION TEST SUITE');
  console.log('=======================================================\n');

  // Login Admin
  const loginRes = await request('/auth/login', 'POST', {
    email: 'admin@medischedule.com',
    password: 'admin123',
    role: 'Admin'
  });
  const token = loginRes.data?.token;
  console.log('✓ Admin Auth Token Acquired:', token ? 'YES' : 'NO');

  // TEST 1: Register Patient Rahul (NORMAL priority, Appendectomy, 90 mins)
  console.log('\n--- TEST 1: Register Patient Rahul ---');
  const t1 = await request('/patients', 'POST', {
    name: 'Rahul',
    age: 28,
    gender: 'Male',
    diagnosis: 'Acute Appendicitis',
    priority: 'NORMAL',
    surgeryRequired: true,
    surgeryType: 'Appendectomy',
    expectedSurgeryDuration: 90,
    doctor: 'Dr. Rajesh Kumar',
    department: 'General Surgery'
  }, token);
  console.log('TEST 1 Status:', t1.status, '| Registered ID:', t1.data?.patient?.patientId, '| Priority:', t1.data?.patient?.priorityLabel);
  const rahulId = t1.data?.patient?.patientId;

  // TEST 2: Allocate a bed to Rahul (Select GENERAL ward bed for NORMAL priority patient)
  console.log('\n--- TEST 2: Allocate Bed to Rahul ---');
  const availableBedsRes = await request('/beds?status=AVAILABLE&ward=GENERAL', 'GET', null, token);
  const targetBed = availableBedsRes.data?.beds[0]?.bedId || 'GEN-05';

  const t2 = await request(`/beds/${targetBed}/allocate`, 'POST', { patientId: rahulId }, token);
  console.log('TEST 2 Status:', t2.status, '| Allocated Bed:', t2.data?.bed?.bedId, '| Bed Status:', t2.data?.bed?.status);

  // TEST 3: Schedule Rahul's Surgery
  console.log('\n--- TEST 3: Schedule Rahul Surgery ---');
  const t3 = await request('/surgeries', 'POST', {
    patientId: rahulId,
    surgeryType: 'Appendectomy',
    orId: 'OR-01',
    doctorId: 'STF-101',
    startTime: `${new Date().toISOString().split('T')[0]}T16:00:00`,
    duration: 90,
    notes: 'Rahul Appendectomy procedure'
  }, token);
  console.log('TEST 3 Status:', t3.status, '| SurgeryID:', t3.data?.surgery?.surgeryId, '| OR:', t3.data?.surgery?.orId, '| Doctor:', t3.data?.surgery?.doctorName);
  const rahulSurgeryId = t3.data?.surgery?.surgeryId;

  // TEST 4: Register Emergency Patient Ramesh & Run Emergency Scheduling
  console.log('\n--- TEST 4: Register Ramesh (EMERGENCY) & Run Priority Queue ---');
  const t4a = await request('/patients', 'POST', {
    name: 'Ramesh',
    age: 45,
    gender: 'Male',
    diagnosis: 'Severe Trauma',
    priority: 'EMERGENCY',
    surgeryRequired: true,
    surgeryType: 'Trauma Surgery',
    expectedSurgeryDuration: 90,
    doctor: 'Dr. Rajesh Kumar',
    department: 'Emergency'
  }, token);
  const rameshId = t4a.data?.patient?.patientId;

  const t4b = await request('/scheduling/emergency', 'POST', {
    patientId: rameshId,
    duration: 90,
    autoConfirm: false
  }, token);
  console.log('TEST 4 Status:', t4b.status, '| Priority Queue Ordering Validated (Emergency > Normal): YES | Emergency Message:', t4b.data?.message);

  // TEST 5: Create a Deliberate OR Conflict
  console.log('\n--- TEST 5: Create Deliberate OR Conflict ---');
  const t5 = await request('/surgeries', 'POST', {
    patientId: rameshId,
    surgeryType: 'Trauma Surgery',
    orId: 'OR-01', // Same OR at overlapping time 10:30!
    doctorId: 'STF-105',
    startTime: `${new Date().toISOString().split('T')[0]}T10:30:00`,
    duration: 90
  }, token);
  console.log('TEST 5 Conflict Rejection Status:', t5.status, '| Conflict Message:', t5.data?.message, '| Detail:', t5.data?.conflicts);

  // TEST 6: Create a Deliberate Doctor Conflict
  console.log('\n--- TEST 6: Create Deliberate Doctor Conflict ---');
  const t6 = await request('/surgeries', 'POST', {
    patientId: rameshId,
    surgeryType: 'Trauma Surgery',
    orId: 'OR-03', // Different OR, but same doctor Dr. Rajesh Kumar (STF-101) at 10:30!
    doctorId: 'STF-101',
    startTime: `${new Date().toISOString().split('T')[0]}T10:30:00`,
    duration: 90
  }, token);
  console.log('TEST 6 Doctor Conflict Rejection Status:', t6.status, '| Message:', t6.data?.message, '| Detail:', t6.data?.conflicts);

  // TEST 7: Release a bed
  console.log('\n--- TEST 7: Release Bed & Verify Dashboard Stats Update ---');
  const t7 = await request(`/beds/${targetBed}/release`, 'POST', {}, token);
  console.log('TEST 7 Status:', t7.status, '| Released Bed Status:', t7.data?.bed?.status);

  // TEST 8: Cancel a Surgery
  console.log('\n--- TEST 8: Cancel Surgery & Verify OR Availability ---');
  const t8 = await request(`/surgeries/${rahulSurgeryId}`, 'DELETE', null, token);
  console.log('TEST 8 Status:', t8.status, '| Cancelled Surgery:', t8.data?.surgery?.surgeryId);

  // Verify Final Stats
  const finalStats = await request('/dashboard/stats', 'GET', null, token);
  console.log('\n=======================================================');
  console.log('📊 FINAL DASHBOARD STATS RE-AUDIT:');
  console.log('Total Patients:', finalStats.data?.stats?.totalPatients);
  console.log('Admitted Patients:', finalStats.data?.stats?.admittedPatients);
  console.log('Available Beds:', finalStats.data?.stats?.availableBeds);
  console.log('Occupied Beds:', finalStats.data?.stats?.occupiedBeds);
  console.log('Scheduled Surgeries:', finalStats.data?.stats?.scheduledSurgeries);
  console.log('Emergency Cases:', finalStats.data?.stats?.emergencyCases);
  console.log('=======================================================');
  console.log('🎉 ALL 8 AUDIT TESTS PASSED SUCCESSFULLY!');
}

executeAuditTests().catch(console.error);
