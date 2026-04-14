const AuditLog = require('../models/AuditLog');

/**
 * Fire-and-forget audit log creator.
 * Failures are logged to console but NEVER throw — they must not block main operations.
 *
 * @param {Object} params
 * @param {ObjectId|string} [params.userId]       - The acting user's ID
 * @param {string}          [params.actorRole]    - ADMIN | GUARD | OCCUPIER | SYSTEM
 * @param {string}           params.action        - One of AUDIT_ACTIONS enum values
 * @param {string}          [params.entity]       - Collection name or domain label (e.g. 'VehicleLog')
 * @param {ObjectId|string} [params.entityId]     - The related document's ID
 * @param {string}          [params.details]      - Human-readable description
 * @param {Object}          [params.metadata]     - Arbitrary extra key-value data
 * @param {string}          [params.ipAddress]    - Request IP
 */
const createAuditLog = async (params) => {
  try {
    await AuditLog.create({
      userId: params.userId || null,
      actorRole: params.actorRole || 'SYSTEM',
      action: params.action,
      entity: params.entity || null,
      entityId: params.entityId || null,
      details: params.details || null,
      metadata: params.metadata || null,
      ipAddress: params.ipAddress || null
    });
  } catch (err) {
    // Non-blocking: log to console only
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
};

/**
 * Convenience wrapper that extracts user info from an Express req object.
 * Usage: createAuditLogFromReq(req, { action, entity, entityId, details, metadata })
 */
const createAuditLogFromReq = (req, params) => {
  return createAuditLog({
    userId: req.user?._id || null,
    actorRole: req.user?.role || 'SYSTEM',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
    ...params
  });
};

module.exports = { createAuditLog, createAuditLogFromReq };
