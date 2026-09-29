const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../config/db');
const authController = require('../controllers/authController');

function createMockReqRes(body) {
  let statusCode = 200;
  let responseData = null;

  const req = { body };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  const next = (err) => {
    statusCode = err.statusCode || 500;
    responseData = { success: false, message: err.message || 'Internal server error' };
  };

  return { req, res, next, getResult: () => ({ status: statusCode, data: responseData }) };
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING AUTHENTICATION TEST SUITE');
  console.log('==================================================');

  await connectDB();

  // TEST 1: Admin Login
  console.log('\n--- TEST 1: Admin Login ---');
  const t1 = createMockReqRes({ email: 'admin@medischedule.com', password: 'admin123', role: 'admin' });
  await authController.login(t1.req, t1.res, t1.next);
  console.log('Result:', t1.getResult());

  // TEST 2: Staff Login
  console.log('\n--- TEST 2: Staff Login ---');
  const t2 = createMockReqRes({ email: 'staff@medischedule.com', password: 'staff123', role: 'staff' });
  await authController.login(t2.req, t2.res, t2.next);
  console.log('Result:', t2.getResult());

  // TEST 3: Incorrect Password
  console.log('\n--- TEST 3: Incorrect Password ---');
  const t3 = createMockReqRes({ email: 'admin@medischedule.com', password: 'wrongpassword', role: 'admin' });
  await authController.login(t3.req, t3.res, t3.next);
  console.log('Result:', t3.getResult());

  // TEST 4: Role Mismatch (Selecting Admin for Staff Account)
  console.log('\n--- TEST 4: Role Mismatch ---');
  const t4 = createMockReqRes({ email: 'staff@medischedule.com', password: 'staff123', role: 'admin' });
  await authController.login(t4.req, t4.res, t4.next);
  console.log('Result:', t4.getResult());

  console.log('\n==================================================');
  console.log('✅ ALL TEST RUNS COMPLETE');
  console.log('==================================================');
}

runTests().catch(console.error);
