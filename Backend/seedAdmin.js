const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    const adminEmail = 'admin@gate.com';
    const adminPassword = 'adminpassword';

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Administrative node already provisioned in the registry.');
      process.exit();
    }

    // Secure hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create Admin
    const adminUser = await User.create({
      name: 'System Admin Node',
      email: adminEmail,
      phone: '9876543210',
      passwordHash: passwordHash,
      role: 'ADMIN'
    });

    console.log('--------------------------------------------------');
    console.log('ADMIN SEED COMPLETE');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('--------------------------------------------------');

    process.exit();
  } catch (error) {
    console.error('Seeding protocol failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
