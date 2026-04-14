const mongoose = require('mongoose');
const { ParkingBilling } = require('./models/ParkingBilling');
const VehicleLog = require('./models/VehicleLog');
require('dotenv').config();

const seedDummyBill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const latestLog = await VehicleLog.findOne().sort({ createdAt: -1 });
    if (!latestLog) {
      console.log('No vehicle log found to attach bill to.');
      process.exit();
    }

    const dummyBill = await ParkingBilling.create({
      vehicleLogId: latestLog._id,
      totalHours: 2,
      durationMinutes: 120,
      billAmount: 200,
      appliedRates: {
        baseFee: 50,
        hourlyRate: 50,
        dailyMax: 500,
        weeklyRate: 2000,
        monthlyRate: 7000,
        gracePeriod: 15
      },
      status: 'UNPAID',
      exitTime: new Date()
    });

    console.log('Dummy bill created:', dummyBill._id);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDummyBill();
