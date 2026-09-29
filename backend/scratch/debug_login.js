const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../config/db');
const dbHelper = require('../utils/dbHelper');
const authController = require('../controllers/authController');

async function test() {
  console.log('--- Starting DB Connect ---');
  await connectDB();
  console.log('--- DB Connect Done ---');
  
  const req = {
    body: {
      email: 'admin@medischedule.com',
      password: 'admin123',
      role: 'admin'
    }
  };
  
  const res = {
    status(code) {
      console.log('RES STATUS:', code);
      return this;
    },
    json(data) {
      console.log('RES JSON:', data);
      return this;
    }
  };
  
  const next = (err) => {
    console.error('NEXT ERROR:', err);
  };
  
  console.log('--- Executing login ---');
  await authController.login(req, res, next);
}

test().catch(console.error);
