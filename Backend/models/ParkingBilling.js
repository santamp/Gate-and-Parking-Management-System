const mongoose = require('mongoose');

// Parking Setting Schema (Global Rates)
const parkingSettingSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    unique: true
  },
  baseFee: {
    type: Number,
    required: true,
    default: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    default: 0
  },
  dailyMax: {
    type: Number,
    required: true,
    default: 0
  },
  weeklyRate: {
    type: Number,
    required: true,
    default: 0
  },
  monthlyRate: {
    type: Number,
    required: true,
    default: 0
  },
  gracePeriod: {
    type: Number, // in minutes
    required: true,
    default: 15
  }
}, {
  timestamps: true
});

const ParkingSetting = mongoose.model('ParkingSetting', parkingSettingSchema);

// Helper schema for snapshot in billing
const billingRateSnapshotSchema = new mongoose.Schema({
  baseFee: Number,
  hourlyRate: Number,
  dailyMax: Number,
  weeklyRate: Number,
  monthlyRate: Number,
  gracePeriod: Number
}, { _id: false });

const parkingBillingSchema = new mongoose.Schema({
  vehicleLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleLog',
    required: true
  },
  totalHours: {
    type: Number,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  billAmount: {
    type: Number,
    required: true
  },
  appliedRates: {
    type: billingRateSnapshotSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PAID'],
    default: 'UNPAID'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'NONE'],
    default: 'NONE'
  },
  transactionId: {
    type: String,
    default: null
  },
  exitTime: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const ParkingGlobalConfig = mongoose.model('ParkingGlobalConfig', new mongoose.Schema({
  currency: {
    type: String,
    default: 'INR'
  },
  autoInvoicing: {
    type: Boolean,
    default: true
  },
  peakHourSurge: {
    type: Number,
    default: 1.0
  },
  isDynamicSurge: {
    type: Boolean,
    default: false
  }
}, { timestamps: true }));

const ParkingBilling = mongoose.model('ParkingBilling', parkingBillingSchema);

module.exports = {
  ParkingBilling,
  ParkingSetting,
  ParkingGlobalConfig
};
