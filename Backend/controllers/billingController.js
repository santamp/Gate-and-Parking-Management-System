const { ParkingBilling, ParkingSetting } = require('../models/ParkingBilling');
const VehicleLog = require('../models/VehicleLog');
const { getIo } = require('../utils/socket');

/**
 * @desc    Calculate parking charge based on duration and rates
 * @param   {Date} entryTime 
 * @param   {Date} exitTime 
 * @param   {String} vehicleType 
 * @returns {Object} Calculated bill details
 */
exports.calculateParkingCharge = async (entryTime, exitTime, vehicleType) => {
  // 1. Fetch settings for vehicle type
  let settings = await ParkingSetting.findOne({ vehicleType });
  
  // fallback if no specific settings found, try a default or use a generic one
  if (!settings) {
    settings = await ParkingSetting.findOne({ vehicleType: 'Private Car' }) || {
        baseFee: 0,
        hourlyRate: 10,
        dailyMax: 100,
        gracePeriod: 15
    };
  }

  const durationMs = new Date(exitTime) - new Date(entryTime);
  const durationMin = Math.max(0, Math.floor(durationMs / (1000 * 60)));
  
  // If stay is within grace period
  if (durationMin <= settings.gracePeriod) {
    return {
      billAmount: 0,
      totalHours: Math.ceil(durationMin / 60),
      durationMinutes: durationMin,
      appliedRates: settings
    };
  }

  const MINS_IN_HOUR = 60;
  const MINS_IN_DAY = 24 * 60;
  const MINS_IN_WEEK = 7 * MINS_IN_DAY;
  const MINS_IN_MONTH = 30 * MINS_IN_DAY;

  let billAmount = 0;
  let remainingMins = durationMin;

  // 1. Months calculation
  if (settings.monthlyRate > 0) {
    const months = Math.floor(remainingMins / MINS_IN_MONTH);
    billAmount += months * settings.monthlyRate;
    remainingMins %= MINS_IN_MONTH;
  }

  // 2. Weeks calculation (capped by Monthly Rate if defined)
  if (settings.weeklyRate > 0) {
    const weeks = Math.floor(remainingMins / MINS_IN_WEEK);
    let weekCharge = weeks * settings.weeklyRate;
    
    // Check if remaining after weeks + weekCharge > Monthly Rate
    if (settings.monthlyRate > 0) {
      // This is a simpler cap: the total of weekly/daily/hourly shouldn't exceed monthly
      // But for now, we'll cap the weekly block itself
    }
    billAmount += weekCharge;
    remainingMins %= MINS_IN_WEEK;
  }

  // 3. Days calculation (capped by Weekly Rate if defined)
  if (settings.dailyMax > 0) {
    const days = Math.floor(remainingMins / MINS_IN_DAY);
    let dayCharge = days * settings.dailyMax;
    
    if (settings.weeklyRate > 0) {
      dayCharge = Math.min(dayCharge, settings.weeklyRate);
    }
    billAmount += dayCharge;
    remainingMins %= MINS_IN_DAY;
  }

  // 4. Hours calculation (capped by Daily Max if defined)
  if (remainingMins > 0) {
    const hours = Math.ceil(remainingMins / MINS_IN_HOUR);
    let hourCharge = settings.baseFee + (hours * settings.hourlyRate);
    
    if (settings.dailyMax > 0) {
      hourCharge = Math.min(hourCharge, settings.dailyMax);
    }
    billAmount += hourCharge;
  }

  // Final check: Is total remaining amount (week+day+hour) > Monthly rate?
  // For simplicity and standard parking billing, we apply caps at each tier transition.

  return {
    billAmount,
    totalHours: Math.ceil(durationMin / 60),
    durationMinutes: durationMin,
    appliedRates: {
      baseFee: settings.baseFee,
      hourlyRate: settings.hourlyRate,
      dailyMax: settings.dailyMax,
      weeklyRate: settings.weeklyRate,
      monthlyRate: settings.monthlyRate,
      gracePeriod: settings.gracePeriod
    }
  };
};

// @desc    Get all billing records
// @route   GET /api/v1/billing
// @access  Private/Admin
exports.getBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const bills = await ParkingBilling.find(query)
      .populate({
        path: 'vehicleLogId',
        populate: { path: 'occupierMappedId', select: 'name email' }
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

// @desc    Create a bill (usually triggered on vehicle exit)
// @route   POST /api/v1/billing
// @access  Private/Guard or Admin
exports.createBill = async (req, res) => {
  try {
    const { vehicleLogId, totalHours, durationMinutes, billAmount, appliedRates, exitTime } = req.body;

    const existingBill = await ParkingBilling.findOne({ vehicleLogId });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill already exists for this log' });
    }

    const bill = await ParkingBilling.create({
      vehicleLogId,
      totalHours,
      durationMinutes,
      billAmount,
      appliedRates,
      exitTime: exitTime || Date.now(),
      status: 'UNPAID'
    });

    try {
      getIo().emit('new_bill_created', bill);
    } catch (e) {
      console.error('Socket error emitting bill:', e);
    }

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update payment status
// @route   PUT /api/v1/billing/:id/pay
// @access  Private/Guard or Admin
exports.markAsPaid = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    
    const bill = await ParkingBilling.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.status = 'PAID';
    bill.paymentMethod = paymentMethod || 'CASH';
    bill.transactionId = transactionId || null;
    
    await bill.save();

    try {
      getIo().emit('bill_paid', bill);
    } catch (e) {
      console.error('Socket error emitting bill pay:', e);
    }

    res.json({ message: 'Bill marked as paid', bill });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get parking settings (rates & vehicle types)
// @route   GET /api/v1/billing/settings
// @access  Private/Guard or Admin
exports.getParkingSettings = async (req, res) => {
  try {
    const settings = await ParkingSetting.find();
    res.json({ success: true, count: settings.length, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
