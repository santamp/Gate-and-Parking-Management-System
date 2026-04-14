const { ParkingBilling, ParkingSetting, ParkingGlobalConfig } = require('../models/ParkingBilling');
const { createAuditLogFromReq } = require('../utils/auditHelper');

// @desc    Get all billing logs
// @route   GET /api/v1/admin/billing
// @access  Private/Admin
exports.getBilling = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const bills = await ParkingBilling.find(query)
      .populate({
        path: 'vehicleLogId',
        populate: { path: 'occupierMappedId', select: 'name' }
      })
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await ParkingBilling.countDocuments(query);

    res.json({
      bills,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update billing status (Admin Settlement)
// @route   PUT /api/v1/admin/billing/:id/status
// @access  Private/Admin
exports.updateBillingStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    if (!['PAID', 'UNPAID'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const bill = await ParkingBilling.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.status = paymentStatus;
    if (paymentStatus === 'PAID') {
      bill.paymentMethod = bill.paymentMethod === 'NONE' ? 'CASH' : bill.paymentMethod;
    }
    await bill.save();

    // Audit: billing settlement
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'ParkingBilling',
      entityId: bill._id,
      details: `Admin settled bill ${bill._id} as ${paymentStatus}`,
      metadata: { billId: bill._id, paymentStatus }
    });

    res.json({ message: `Bill status updated to ${paymentStatus}`, bill });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get parking settings (rates)
// @route   GET /api/v1/admin/billing/settings
// @access  Private/Admin
exports.getParkingSettings = async (req, res) => {
    try {
        const settings = await ParkingSetting.find();
        res.json({ success: true, count: settings.length, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update parking settings (rates)
// @route   PUT /api/v1/admin/billing/settings
// @access  Private/Admin
exports.updateParkingSettings = async (req, res) => {
    try {
        const { rates } = req.body; // Expecting array of { vehicleType, baseFee, hourlyRate, dailyMax, gracePeriod }

        if (!Array.isArray(rates)) {
            return res.status(400).json({ success: false, message: 'Rates must be an array' });
        }

        const currentSettings = await ParkingSetting.find();
        const updatedSettings = [];
        const incomingIds = [];
        
        const addedNames = [];
        const editedNames = [];

        for (const rate of rates) {
            let setting;
            
            if (rate._id) {
                const existing = currentSettings.find(s => s._id.toString() === rate._id.toString());
                
                // Only mark as edited if properties actually changed
                const hasChanged = existing && (
                    existing.vehicleType !== rate.vehicleType ||
                    existing.baseFee !== Number(rate.baseFee) ||
                    existing.hourlyRate !== Number(rate.hourlyRate) ||
                    existing.dailyMax !== Number(rate.dailyMax) ||
                    existing.weeklyRate !== (Number(rate.weeklyRate) || 0) ||
                    existing.monthlyRate !== (Number(rate.monthlyRate) || 0) ||
                    existing.gracePeriod !== (Number(rate.gracePeriod) || 15)
                );

                // Update existing record by ID
                setting = await ParkingSetting.findByIdAndUpdate(
                    rate._id,
                    { 
                        vehicleType: rate.vehicleType,
                        baseFee: rate.baseFee,
                        hourlyRate: rate.hourlyRate,
                        dailyMax: rate.dailyMax,
                        weeklyRate: rate.weeklyRate || 0,
                        monthlyRate: rate.monthlyRate || 0,
                        gracePeriod: rate.gracePeriod || 15
                    },
                    { new: true, runValidators: true }
                );
                
                if (setting && hasChanged) editedNames.push(setting.vehicleType);
            } else {
                // Check if vehicleType already exists but ID is missing (sanity check)
                setting = await ParkingSetting.findOne({ vehicleType: rate.vehicleType });
                
                if (setting) {
                    const hasChanged = (
                        setting.baseFee !== Number(rate.baseFee) ||
                        setting.hourlyRate !== Number(rate.hourlyRate) ||
                        setting.dailyMax !== Number(rate.dailyMax) ||
                        setting.weeklyRate !== (Number(rate.weeklyRate) || 0) ||
                        setting.monthlyRate !== (Number(rate.monthlyRate) || 0) ||
                        setting.gracePeriod !== (Number(rate.gracePeriod) || 15)
                    );

                    setting.baseFee = rate.baseFee;
                    setting.hourlyRate = rate.hourlyRate;
                    setting.dailyMax = rate.dailyMax;
                    setting.weeklyRate = rate.weeklyRate || 0;
                    setting.monthlyRate = rate.monthlyRate || 0;
                    setting.gracePeriod = rate.gracePeriod || 15;
                    await setting.save();
                    
                    if (hasChanged) editedNames.push(setting.vehicleType);
                } else {
                    // Create new record
                    setting = await ParkingSetting.create({
                        vehicleType: rate.vehicleType,
                        baseFee: rate.baseFee,
                        hourlyRate: rate.hourlyRate,
                        dailyMax: rate.dailyMax,
                        weeklyRate: rate.weeklyRate || 0,
                        monthlyRate: rate.monthlyRate || 0,
                        gracePeriod: rate.gracePeriod || 15
                    });
                    if (setting) addedNames.push(setting.vehicleType);
                }
            }
            
            if (setting) {
                updatedSettings.push(setting);
                incomingIds.push(setting._id.toString());
            }
        }

        // Identify removals for audit
        const removedNames = currentSettings
            .filter(s => !incomingIds.includes(s._id.toString()))
            .map(s => s.vehicleType);

        // Remove records that were not part of the update list
        await ParkingSetting.deleteMany({ _id: { $nin: incomingIds } });

        // Construct detailed audit message
        let detailParts = [];
        if (addedNames.length > 0) detailParts.push(`Added: ${addedNames.join(', ')}`);
        if (editedNames.length > 0) detailParts.push(`Updated: ${editedNames.join(', ')}`);
        if (removedNames.length > 0) detailParts.push(`Removed: ${removedNames.join(', ')}`);
        
        const auditDetails = detailParts.length > 0 
            ? `Admin updated parking rates. ${detailParts.join('; ')}.`
            : 'Admin updated parking rates configuration (no structural changes).';

        // Audit: parking rates updated with specific details
        createAuditLogFromReq(req, {
            action: 'ADMIN_CONFIG_CHANGE',
            entity: 'ParkingSetting',
            details: auditDetails,
            metadata: { 
                added: addedNames, 
                edited: editedNames, 
                removed: removedNames,
                allTypes: updatedSettings.map(s => s.vehicleType)
            }
        });

        res.json({ success: true, data: updatedSettings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get global parking policy configuration
// @route   GET /api/v1/admin/billing/global-config
// @access  Private/Admin
exports.getGlobalConfig = async (req, res) => {
    try {
        let config = await ParkingGlobalConfig.findOne();
        if (!config) {
            config = await ParkingGlobalConfig.create({ 
                currency: 'INR', 
                autoInvoicing: true, 
                peakHourSurge: 1.0, 
                isDynamicSurge: false 
            });
        }
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update global parking policy configuration
// @route   PUT /api/v1/admin/billing/global-config
// @access  Private/Admin
exports.updateGlobalConfig = async (req, res) => {
    try {
        const { currency, autoInvoicing, peakHourSurge, isDynamicSurge } = req.body;
        
        const config = await ParkingGlobalConfig.findOneAndUpdate(
            {},
            { 
                currency: currency || 'INR', 
                autoInvoicing: autoInvoicing !== undefined ? autoInvoicing : true, 
                peakHourSurge: peakHourSurge || 1.0, 
                isDynamicSurge: isDynamicSurge !== undefined ? isDynamicSurge : false 
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
