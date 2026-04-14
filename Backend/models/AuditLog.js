const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  'ENTRY_REGISTERED',
  'ENTRY_APPROVED',
  'ENTRY_REJECTED',
  'ENTRY_OVERRIDE',
  'ENTRY_NOT_MY_VEHICLE',
  'PAYMENT_PROCESSED',
  'EXIT_RECORDED',
  'ADMIN_OVERRIDE',
  'ADMIN_CONFIG_CHANGE',
  'USER_CREATED',
  'USER_DELETED',
  'USER_PASSWORD_RESET',
  'LOGIN',
  'LOGOUT',
  'SYSTEM'
];

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorRole: {
    type: String,
    enum: ['ADMIN', 'GUARD', 'OCCUPIER', 'SYSTEM'],
    default: 'SYSTEM'
  },
  action: {
    type: String,
    enum: AUDIT_ACTIONS,
    required: true
  },
  entity: {
    type: String,
    default: null
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ entityId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
