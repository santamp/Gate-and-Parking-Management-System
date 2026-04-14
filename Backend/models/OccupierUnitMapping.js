const mongoose = require('mongoose');

const occupierUnitMappingSchema = new mongoose.Schema({
  occupierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarehouseStructure',
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

const OccupierUnitMapping = mongoose.model('OccupierUnitMapping', occupierUnitMappingSchema);
module.exports = OccupierUnitMapping;
