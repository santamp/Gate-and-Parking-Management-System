const mongoose = require('mongoose');

const warehouseStructureSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PROJECT', 'BUILDING', 'FLOOR', 'UNIT'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarehouseStructure',
    default: null
  }
}, {
  timestamps: true
});

const WarehouseStructure = mongoose.model('WarehouseStructure', warehouseStructureSchema);
module.exports = WarehouseStructure;
