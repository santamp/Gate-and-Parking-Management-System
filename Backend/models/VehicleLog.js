const mongoose = require('mongoose');

const vehicleLogSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  driverName: {
    type: String,
    default: null
  },
  driverPhone: {
    type: String,
    default: null
  },
  photoUrl: {
    type: String,
    default: null
  },
  occupierMappedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarehouseStructure',
    default: null
  },
  guardEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guardExitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inside', 'exited', 'not_my_vehicle'],
    default: 'pending'
  },
  overrideReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const VehicleLog = mongoose.model('VehicleLog', vehicleLogSchema);
module.exports = VehicleLog;
