const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const demoUsers = [
  {
    name: 'Hospital Administrator',
    email: 'admin@medischedule.com',
    password: 'admin123',
    role: 'admin',
    department: 'Hospital Administration',
    phone: '+1-555-0100'
  },
  {
    name: 'Nurse John Miller',
    email: 'staff@medischedule.com',
    password: 'staff123',
    role: 'staff',
    department: 'Surgical Nursing',
    phone: '+1-555-0101'
  }
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medischedule';
  console.log(`🌱 Running MediSchedule Seed Script...`);

  let connected = false;
  try {
    console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    connected = true;
    console.log('✅ Connected to MongoDB for seeding.');
  } catch (err) {
    console.warn(`⚠️ Could not connect to MongoDB (${err.message}). Seeding fallback store dataset...`);
  }

  if (connected) {
    for (const uData of demoUsers) {
      const existing = await User.findOne({ email: uData.email.toLowerCase() });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(uData.password, 10);
        await User.create({
          ...uData,
          email: uData.email.toLowerCase(),
          password: hashedPassword
        });
        console.log(`+ Created demo user: ${uData.email} (${uData.role})`);
      } else {
        // Ensure password and role are up to date
        const hashedPassword = await bcrypt.hash(uData.password, 10);
        existing.name = uData.name;
        existing.role = uData.role;
        existing.password = hashedPassword;
        await existing.save();
        console.log(`✓ Demo user already exists, updated: ${uData.email}`);
      }
    }
    await mongoose.disconnect();
    console.log('🔒 Database connection closed.');
  } else {
    // Populate seedData in memoryStore fallback
    const seedDatabase = require('./utils/seedData');
    await seedDatabase();
  }

  console.log('✅ Seeding complete.');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('❌ Seed script error:', err);
    process.exit(1);
  });
}

module.exports = seed;
