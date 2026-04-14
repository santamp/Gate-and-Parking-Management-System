const VehicleLog = require('../models/VehicleLog');
const User = require('../models/User');
const { createAuditLogFromReq } = require('../utils/auditHelper');
const { getIo } = require('../utils/socket');

/**
 * @desc    Register vehicle entry
 * @route   POST /api/v1/gate/entry
 * @access  Guard, Admin
 */
exports.registerVehicleEntry = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, driverName, driverPhone, occupierMappedId, unitId } = req.body;

    // Check if vehicle is already inside
    const existingLog = await VehicleLog.findOne({
      vehicleNumber,
      status: { $in: ['pending', 'approved', 'inside'] }
    });

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: `Vehicle is already ${existingLog.status}. Please process the existing entry before creating another one.`,
        data: {
          existingLogId: existingLog._id,
          status: existingLog.status
        }
      });
    }

    const logData = {
      vehicleNumber,
      vehicleType,
      driverName,
      driverPhone,
      occupierMappedId,
      unitId: unitId || null,
      guardEntryId: req.user._id,
      status: 'pending'
    };

    if (req.file) {
      logData.photoUrl = `/uploads/vehicles/${req.file.filename}`;
    }

    const vehicleLog = await VehicleLog.create(logData);

    // Audit: entry registered
    createAuditLogFromReq(req, {
      action: 'ENTRY_REGISTERED',
      entity: 'VehicleLog',
      entityId: vehicleLog._id,
      details: `Vehicle ${vehicleNumber} (${vehicleType}) entry registered by guard`,
      metadata: { vehicleNumber, vehicleType, driverName, occupierMappedId }
    });

    // Emit socket event for new vehicle log
    try {
      getIo().emit('new_vehicle_log', vehicleLog);
      [occupierMappedId, unitId].filter(Boolean).forEach((targetId) => {
        getIo().emit(`unit_${targetId}`, { type: 'NEW_LOG', data: vehicleLog });
      });
    } catch(e) {
      console.error('Socket error on entry:', e.message);
    }

    res.status(201).json({
      success: true,
      data: vehicleLog,
      message: 'Vehicle entry request registered. Awaiting occupier approval.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering vehicle entry',
      error: error.message
    });
  }
};

/**
 * @desc    Update vehicle status (Approve/Reject)
 * @route   PATCH /api/v1/gate/approval/:logId
 * @access  Occupier, Admin
 */
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { status, overrideReason } = req.body;
    const { logId } = req.params;

    if (!['approved', 'rejected', 'inside', 'not_my_vehicle'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status update. Allowed: approved, rejected, inside, not_my_vehicle'
      });
    }

    const vehicleLog = await VehicleLog.findById(logId);

    if (!vehicleLog) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle log not found'
      });
    }

    // Role-based validation
    if (req.user.role === 'OCCUPIER') {
      if (vehicleLog.occupierMappedId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to approve/reject for this vehicle'
        });
      }
    } else if (req.user.role === 'GUARD') {
      // Guards can only update to 'inside' if already approved, OR they can override pending status
      if (status === 'inside' && vehicleLog.status !== 'approved') {
        if (!overrideReason) {
            return res.status(400).json({
                success: false,
                message: 'Override reason is required for guards to mark unapproved vehicles as inside'
            });
        }
      }
      
      // If guard is changing status from pending to approved/rejected, it's an override
      if (vehicleLog.status === 'pending' && ['approved', 'rejected', 'not_my_vehicle'].includes(status)) {
          if (!overrideReason) {
              return res.status(400).json({
                  success: false,
                  message: 'Override reason is required for guards to process pending requests'
              });
          }
      }
    }

    // Update entry time for accurate parking billing when vehicle is approved or overridden
    if ((status === 'approved' && vehicleLog.status !== 'approved') || 
        (status === 'inside' && vehicleLog.status === 'pending')) {
      vehicleLog.entryTime = Date.now();
    }

    vehicleLog.status = status;
    if (overrideReason) {
      vehicleLog.overrideReason = overrideReason;
    }

    await vehicleLog.save();

    // Audit: approval, rejection, or override
    const auditActionMap = {
      approved: 'ENTRY_APPROVED',
      rejected: 'ENTRY_REJECTED',
      inside: overrideReason ? 'ENTRY_OVERRIDE' : 'ENTRY_APPROVED',
      not_my_vehicle: 'ENTRY_NOT_MY_VEHICLE'
    };
    createAuditLogFromReq(req, {
      action: auditActionMap[status] || 'ENTRY_APPROVED',
      entity: 'VehicleLog',
      entityId: vehicleLog._id,
      details: overrideReason
        ? `Guard override: ${overrideReason}`
        : `Vehicle ${vehicleLog.vehicleNumber} status changed to ${status}`,
      metadata: { vehicleNumber: vehicleLog.vehicleNumber, status, overrideReason: overrideReason || null }
    });

    // Emit socket event for status update
    try {
      getIo().emit('log_updated', vehicleLog);
    } catch (e) {
      console.error('Socket error on status update:', e.message);
    }

    res.status(200).json({
      success: true,
      data: vehicleLog,
      message: `Vehicle status updated to ${status}${overrideReason ? ' (Overridden)' : ''}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle status',
      error: error.message
    });
  }
};

const { ParkingBilling } = require('../models/ParkingBilling');
const billingController = require('./billingController');

/**
 * @desc    Get exit calculation (before finalizing exit)
 * @route   GET /api/v1/gate/exit-calculation/:logId
 * @access  Guard, Admin
 */
exports.getExitCalculation = async (req, res) => {
  try {
    const { logId } = req.params;
    const vehicleLog = await VehicleLog.findById(logId);

    if (!vehicleLog) {
      return res.status(404).json({ success: false, message: 'Vehicle log not found' });
    }

    if (vehicleLog.status === 'exited') {
      return res.status(400).json({ success: false, message: 'Vehicle already exited' });
    }

    const exitTime = Date.now();
    const billData = await billingController.calculateParkingCharge(
      vehicleLog.entryTime,
      exitTime,
      vehicleLog.vehicleType
    );

    res.status(200).json({
      success: true,
      data: {
        ...billData,
        vehicleNumber: vehicleLog.vehicleNumber,
        entryTime: vehicleLog.entryTime,
        exitTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating charges', error: error.message });
  }
};

/**
 * @desc    Process payment for exit
 * @route   POST /api/v1/gate/payment
 * @access  Guard, Admin
 */
exports.processPayment = async (req, res) => {
  try {
    const { logId, paymentMethod, transactionId, amount, totalHours, durationMinutes, appliedRates, exitTime } = req.body;

    const vehicleLog = await VehicleLog.findById(logId);
    if (!vehicleLog) {
      return res.status(404).json({ success: false, message: 'Vehicle log not found' });
    }

    // Check if bill already exists and is paid
    let bill = await ParkingBilling.findOne({ vehicleLogId: logId });
    
    if (bill && bill.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Bill already paid' });
    }

    if (bill) {
      bill.status = 'PAID';
      bill.paymentMethod = paymentMethod;
      bill.transactionId = transactionId || null;
      bill.billAmount = amount;
      bill.exitTime = exitTime || Date.now();
      await bill.save();
    } else {
      bill = await ParkingBilling.create({
        vehicleLogId: logId,
        billAmount: amount,
        totalHours,
        durationMinutes,
        appliedRates,
        exitTime: exitTime || Date.now(),
        status: 'PAID',
        paymentMethod,
        transactionId: transactionId || null
      });
    }

    // Audit: payment processed
    createAuditLogFromReq(req, {
      action: 'PAYMENT_PROCESSED',
      entity: 'ParkingBilling',
      entityId: bill._id,
      details: `Payment of ₹${amount} via ${paymentMethod} for vehicle log ${logId}`,
      metadata: { logId, amount, paymentMethod, transactionId: transactionId || null }
    });

    res.status(200).json({ success: true, message: 'Payment processed successfully', data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
  }
};

/**
 * @desc    Register vehicle exit
 * @route   POST /api/v1/gate/exit/:logId
 * @access  Guard, Admin
 */
exports.registerVehicleExit = async (req, res) => {
  try {
    const { logId } = req.params;

    const vehicleLog = await VehicleLog.findById(logId);

    if (!vehicleLog) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle log not found'
      });
    }

    if (vehicleLog.status === 'exited') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle has already exited'
      });
    }

    // Check if payment is settled
    const bill = await ParkingBilling.findOne({ vehicleLogId: logId });
    
    // If bill exists, it must be PAID. If no bill exists, we should calculate one.
    if (bill) {
        if (bill.status !== 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Payment not found or unpaid. Please collect payment before exit.',
                billAmount: bill.billAmount
            });
        }
    } else {
        // Calculate on the fly for free exits (grace period)
        const exitTime = Date.now();
        const billData = await billingController.calculateParkingCharge(
            vehicleLog.entryTime,
            exitTime,
            vehicleLog.vehicleType
        );

        if (billData.billAmount > 0) {
            // Need payment if amount > 0
            return res.status(400).json({
                success: false,
                message: 'Payment required before exit.',
                billAmount: billData.billAmount
            });
        }

        // If amount is 0, auto-create a PAID bill for record
        await ParkingBilling.create({
            vehicleLogId: vehicleLog._id,
            exitTime: exitTime,
            ...billData,
            status: 'PAID',
            paymentMethod: 'NONE'
        });
    }

    const exitTime = Date.now();
    vehicleLog.status = 'exited';
    vehicleLog.exitTime = exitTime;
    vehicleLog.guardExitId = req.user._id;

    await vehicleLog.save();

    // Audit: exit recorded
    createAuditLogFromReq(req, {
      action: 'EXIT_RECORDED',
      entity: 'VehicleLog',
      entityId: vehicleLog._id,
      details: `Vehicle ${vehicleLog.vehicleNumber} exited premises`,
      metadata: { vehicleNumber: vehicleLog.vehicleNumber, exitTime }
    });

    // Emit socket event for log updated (exit)
    try {
      getIo().emit('log_updated', vehicleLog);
    } catch (e) {
      console.error('Socket error on exit:', e.message);
    }

    res.status(200).json({
      success: true,
      data: vehicleLog,
      message: 'Vehicle exit recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording vehicle exit',
      error: error.message
    });
  }
};

/**
 * @desc    Get all vehicle logs
 * @route   GET /api/v1/gate/logs
 * @access  Guard, Admin, Occupier
 */
exports.getVehicleLogs = async (req, res) => {
  try {
    let query = {};

    // Occupiers only see logs mapped to them
    if (req.user.role === 'OCCUPIER') {
      query.occupierMappedId = req.user._id;
    }

    // Filters from query params
    if (req.query.status) {
      if (req.query.status.includes(',')) {
        query.status = { $in: req.query.status.split(',') };
      } else {
        query.status = req.query.status;
      }
    }
    if (req.query.vehicleNumber) {
      query.vehicleNumber = new RegExp(req.query.vehicleNumber, 'i');
    }
    if (req.query.unitId) {
      query.unitId = req.query.unitId;
    }
    // Date-range filter on entryTime
    if (req.query.dateFrom || req.query.dateTo) {
      query.entryTime = {};
      if (req.query.dateFrom) {
        query.entryTime.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        // Include the full end day (set to 23:59:59.999)
        const endDate = new Date(req.query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.entryTime.$lte = endDate;
      }
    }

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;
    const total = await VehicleLog.countDocuments(query);

    const logs = await VehicleLog.find(query)
      .populate('occupierMappedId', 'name email phone')
      .populate('guardEntryId', 'name')
      .populate('guardExitId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get all mappings and structures for unit enrichment
    const mappings = await OccupierUnitMapping.find({ status: 'ACTIVE' }).populate('unitId').lean();
    const allStructures = await WarehouseStructure.find().lean();
    const structureMap = {};
    allStructures.forEach(s => structureMap[s._id] = s);

    // Get all billing records for these logs
    const logIds = logs.map(l => l._id);
    const bills = await ParkingBilling.find({ vehicleLogId: { $in: logIds } }).lean();
    const billMap = {};
    bills.forEach(b => billMap[b.vehicleLogId.toString()] = b.status);

    const enrichedLogs = logs.map(log => {
      const billingStatus = billMap[log._id.toString()] || (log.status === 'exited' ? 'UNPAID' : 'N/A');
      
      // If log has explicit unitId, use it for 100% accuracy
      if (log.unitId) {
        const unit = structureMap[log.unitId.toString()];
        if (unit) {
          let parent = structureMap[unit.parentId];
          return {
            ...log,
            unitName: unit.name,
            blockName: parent ? parent.name : 'N/A'
          };
        }
      }

      // Fallback to mapping search (for older logs)
      const mapping = mappings.find(m => m.occupierId.toString() === log.occupierMappedId?._id?.toString());
      if (mapping && mapping.unitId) {
        let parent = structureMap[mapping.unitId.parentId];
        return {
          ...log,
          unitName: mapping.unitId.name,
          blockName: parent ? parent.name : 'N/A'
        };
      }
      return { 
        ...log, 
        unitName: 'N/A', 
        blockName: 'N/A' 
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: enrichedLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle logs',
      error: error.message
    });
  }
};

/**
 * @desc    Get flat list of UNIT structures (for filter dropdown)
 * @route   GET /api/v1/gate/units
 * @access  Guard, Admin
 */
exports.getUnits = async (req, res) => {
  try {
    const allStructures = await WarehouseStructure.find().lean();
    const structureMap = {};
    allStructures.forEach(s => (structureMap[s._id] = s));

    const units = allStructures
      .filter(s => s.type === 'UNIT')
      .map(unit => {
        const parent = unit.parentId ? structureMap[unit.parentId] : null;
        const grandparent = parent?.parentId ? structureMap[parent.parentId] : null;
        return {
          _id: unit._id,
          name: unit.name,
          parentName: parent ? parent.name : 'N/A',
          projectName: grandparent ? grandparent.name : (parent ? parent.name : 'N/A'),
          label: [grandparent?.name, parent?.name, unit.name].filter(Boolean).join(' › ')
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    res.status(200).json({ success: true, data: units });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching units', error: error.message });
  }
};

const OccupierUnitMapping = require('../models/OccupierUnitMapping');
const WarehouseStructure = require('../models/WarehouseStructure');

/**
 * @desc    Get all occupiers for mapping
 * @route   GET /api/v1/gate/occupiers
 * @access  Guard, Admin
 */
exports.getOccupiers = async (req, res) => {
  try {
    const occupiers = await User.find({ role: 'OCCUPIER' }).select('name email phone').lean();
    
    // Get mappings
    const mappings = await OccupierUnitMapping.find({ status: 'ACTIVE' }).populate('unitId').lean();
    
    // Get all structures for parent lookup
    const allStructures = await WarehouseStructure.find().lean();
    const structureMap = {};
    allStructures.forEach(s => structureMap[s._id] = s);

    // Return one entry per valid mapping
    const enrichedOccupiers = [];

    mappings.forEach(mapping => {
      const occ = occupiers.find(o => o._id.toString() === mapping.occupierId.toString());
      if (occ && mapping.unitId) {
        let parent = structureMap[mapping.unitId.parentId];
        enrichedOccupiers.push({
          ...occ,
          // Use mapping ID as unique identifier for this assignment
          _id: mapping._id, 
          occupierUserId: occ._id,
          unit: mapping.unitId.name,
          block: parent ? parent.name : 'N/A',
          unitId: mapping.unitId._id
        });
      }
    });

    // Also include occupiers without ANY mapping (optional, but good for completeness)
    occupiers.forEach(occ => {
      const hasMapping = mappings.some(m => m.occupierId.toString() === occ._id.toString());
      if (!hasMapping) {
        enrichedOccupiers.push({
          ...occ,
          occupierUserId: occ._id,
          unit: 'Not Assigned',
          block: 'N/A'
        });
      }
    });

    res.status(200).json({
      success: true,
      count: enrichedOccupiers.length,
      data: enrichedOccupiers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching occupiers',
      error: error.message
    });
  }
};
