const VehicleLog = require('../models/VehicleLog');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { createAuditLogFromReq } = require('../utils/auditHelper');

// @desc    Get all vehicle logs (with filters for Admin)
// @route   GET /api/v1/admin/logs/vehicles
// @access  Private/Admin
exports.getVehicleLogs = async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.entryTime = {};
      if (startDate) query.entryTime.$gte = new Date(startDate);
      if (endDate) query.entryTime.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const logs = await VehicleLog.find(query)
      .populate('occupierMappedId', 'name email')
      .populate('guardEntryId', 'name')
      .populate('guardExitId', 'name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ entryTime: -1 });

    const total = await VehicleLog.countDocuments(query);

    res.json({
      logs,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all audit logs (with filters)
// @route   GET /api/v1/admin/logs/audit
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      actorRole, 
      startDate, 
      endDate,
      search 
    } = req.query;

    const query = {};

    if (action) {
      // support comma-separated list: action=ENTRY_REGISTERED,ENTRY_APPROVED
      query.action = action.includes(',') ? { $in: action.split(',') } : action;
    }
    if (actorRole) query.actorRole = actorRole;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    let logsQuery = AuditLog.find(query)
      .populate('userId', 'name role email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // Search by actor name requires a population-aware approach — post-fetch filter
    let logs = await logsQuery;
    const total = await AuditLog.countDocuments(query);

    // If search is provided, filter by populated user name or details
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(l =>
        (l.userId?.name || '').toLowerCase().includes(searchLower) ||
        (l.details || '').toLowerCase().includes(searchLower) ||
        (l.entity || '').toLowerCase().includes(searchLower)
      );
    }

    res.json({
      logs,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get audit log summary stats (counts by action group)
// @route   GET /api/v1/admin/logs/audit/stats
// @access  Private/Admin
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const [
      totalEvents,
      entryEvents,
      exitEvents,
      approvalEvents,
      overrideEvents,
      paymentEvents,
      configEvents,
      byAction,
      byRole
    ] = await Promise.all([
      AuditLog.countDocuments(dateFilter),
      AuditLog.countDocuments({ ...dateFilter, action: 'ENTRY_REGISTERED' }),
      AuditLog.countDocuments({ ...dateFilter, action: 'EXIT_RECORDED' }),
      AuditLog.countDocuments({ ...dateFilter, action: { $in: ['ENTRY_APPROVED', 'ENTRY_REJECTED', 'ENTRY_NOT_MY_VEHICLE'] } }),
      AuditLog.countDocuments({ ...dateFilter, action: { $in: ['ENTRY_OVERRIDE', 'ADMIN_OVERRIDE'] } }),
      AuditLog.countDocuments({ ...dateFilter, action: 'PAYMENT_PROCESSED' }),
      AuditLog.countDocuments({ ...dateFilter, action: 'ADMIN_CONFIG_CHANGE' }),
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$actorRole', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        entryEvents,
        exitEvents,
        approvalEvents,
        overrideEvents,
        paymentEvents,
        configEvents,
        byAction,
        byRole
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Admin manual override/approval — also writes audit entry
// @route   PUT /api/v1/admin/logs/vehicles/:id/override
// @access  Private/Admin
exports.overrideApproval = async (req, res) => {
  try {
    const { status, overrideReason } = req.body;
    
    const allowedStatuses = ['approved', 'rejected', 'APPROVED', 'REJECTED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status for override. Use: approved or rejected' });
    }

    const log = await VehicleLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    const normalizedStatus = status.toLowerCase();
    log.status = normalizedStatus;
    log.overrideReason = overrideReason || 'Admin Manual Override';
    await log.save();

    // Audit the admin override
    createAuditLogFromReq(req, {
      action: 'ADMIN_OVERRIDE',
      entity: 'VehicleLog',
      entityId: log._id,
      details: `Admin overrode vehicle ${log.vehicleNumber} status to ${normalizedStatus}. Reason: ${overrideReason || 'None provided'}`,
      metadata: { vehicleNumber: log.vehicleNumber, newStatus: normalizedStatus, overrideReason }
    });

    res.json({ message: `Log status updated to ${normalizedStatus}`, log });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
