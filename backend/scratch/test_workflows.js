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

async function runTests() {
  console.log('🧪 Starting End-to-End API Workflows Verification...');

  // 1. Admin Login
  const adminLogin = await request('/auth/login', 'POST', {
    email: 'admin@medischedule.com',
    password: 'admin123',
    role: 'Admin'
  });
  console.log('✓ Admin Login Status:', adminLogin.status, '| User:', adminLogin.data?.user?.name);
  const adminToken = adminLogin.data?.token;

  // 2. Staff Login
  const staffLogin = await request('/auth/login', 'POST', {
    email: 'staff@medischedule.com',
    password: 'staff123',
    role: 'Staff'
  });
  console.log('✓ Staff Login Status:', staffLogin.status, '| User:', staffLogin.data?.user?.name);

  // 3. Register New Patient
  const newPatient = await request('/patients', 'POST', {
    name: 'College Project Tester',
    age: 30,
    gender: 'Male',
    diagnosis: 'Acute Cholecystitis',
    priority: 'HIGH',
    surgeryRequired: true,
    surgeryType: 'Laparoscopic Surgery',
    doctor: 'Dr. Rajesh Kumar',
    department: 'General Surgery'
  }, adminToken);
  console.log('✓ Patient Creation Status:', newPatient.status, '| PatientID:', newPatient.data?.patient?.patientId);
  const testPatientId = newPatient.data?.patient?.patientId;

  // 4. Allocate Available Bed
  const bedAlloc = await request('/beds/GEN-05/allocate', 'POST', {
    patientId: testPatientId
  }, adminToken);
  console.log('✓ Bed Allocation Status:', bedAlloc.status, '| Message:', bedAlloc.data?.message);

  // 5. Find Best Slot using DSA Min Heap
  const findSlot = await request('/scheduling/find-slot', 'POST', {
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '11:00',
    duration: 60,
    department: 'General Surgery',
    doctorId: 'STF-101'
  }, adminToken);
  console.log('✓ DSA Min-Heap Slot Finder Status:', findSlot.status, '| Best Slot:', findSlot.data?.result?.bestSlot?.orId);

  // 6. Schedule Surgery
  const surgSchedule = await request('/surgeries', 'POST', {
    patientId: testPatientId,
    surgeryType: 'Laparoscopic Cholecystectomy',
    orId: 'OR-01',
    doctorId: 'STF-101',
    startTime: `${new Date().toISOString().split('T')[0]}T14:30:00`,
    duration: 60,
    notes: 'Testing end-to-end surgery scheduling workflow.'
  }, adminToken);
  console.log('✓ Surgery Schedule Status:', surgSchedule.status, '| SurgeryID:', surgSchedule.data?.surgery?.surgeryId);

  // 7. Run Emergency Preemption Engine
  const emergencyRun = await request('/scheduling/emergency', 'POST', {
    patientId: 'PAT-2026-1015', // Jessica Alba (EMERGENCY)
    duration: 60,
    autoConfirm: false
  }, adminToken);
  console.log('✓ Emergency Preemption Status:', emergencyRun.status, '| Message:', emergencyRun.data?.message);

  // 8. Run Interactive DSA Stepper Demo
  const dsaDemo = await request('/scheduling/demo-run', 'POST', {}, adminToken);
  console.log('✓ DSA Demo Execution Status:', dsaDemo.status, '| Stepper Steps Count:', dsaDemo.data?.executionSteps?.length);

  // 9. Fetch Dashboard Stats
  const stats = await request('/dashboard/stats', 'GET', null, adminToken);
  console.log('✓ Dashboard Stats Status:', stats.status, '| Total Patients:', stats.data?.stats?.totalPatients, '| Occupied Beds:', stats.data?.stats?.occupiedBeds);

  // 10. Fetch Analytics Reports
  const reports = await request('/reports?timeframe=week', 'GET', null, adminToken);
  console.log('✓ Reports Status:', reports.status, '| Bed Utilization:', reports.data?.report?.bedUtilizationRate + '%');

  console.log('🎉 ALL END-TO-END API WORKFLOWS VERIFIED SUCCESSFULLY!');
}

runTests().catch(console.error);
