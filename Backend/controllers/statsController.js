const User = require('../models/User');
const VehicleLog = require('../models/VehicleLog');
const WarehouseStructure = require('../models/WarehouseStructure');
const { ParkingBilling } = require('../models/ParkingBilling');

// @desc    Get aggregated stats for Admin Dashboard
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. User Counts
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // 2. Vehicle Counts (Inside vs Total today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vehiclesInside = await VehicleLog.countDocuments({ status: { $in: ['inside', 'approved'] } });
    const entriesToday = await VehicleLog.countDocuments({ 
      entryTime: { $gte: today } 
    });

    // 3. Infrastructure stats
    const totalUnits = await WarehouseStructure.countDocuments({ type: 'UNIT' });
    const totalProjects = await WarehouseStructure.countDocuments({ type: 'PROJECT' });

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 4. Revenue Today, Month & Unpaid Stats
    const [revenueStats, monthlyStats, unpaidStats] = await Promise.all([
      ParkingBilling.aggregate([
        { 
          $match: { 
            status: 'PAID', 
            updatedAt: { $gte: today } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$billAmount' } } }
      ]),
      ParkingBilling.aggregate([
        { 
          $match: { 
            status: 'PAID', 
            updatedAt: { $gte: firstDayOfMonth } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$billAmount' } } }
      ]),
      ParkingBilling.aggregate([
        { $match: { status: 'UNPAID' } },
        { 
          $group: { 
            _id: null, 
            totalAmount: { $sum: '$billAmount' }, 
            count: { $sum: 1 } 
          } 
        }
      ])
    ]);

    // 5. Recent Activity (Latest 5 logs)
    const recentActivity = await VehicleLog.find()
      .populate('occupierMappedId', 'name')
      .sort({ entryTime: -1 })
      .limit(5);

    res.json({
      users: userStats,
      vehicles: {
        inside: vehiclesInside,
        entriesToday: entriesToday
      },
      infrastructure: {
        units: totalUnits,
        projects: totalProjects
      },
      finance: {
        revenueToday: revenueStats[0]?.total || 0,
        revenueMonth: monthlyStats[0]?.total || 0,
        unpaidAmount: unpaidStats[0]?.totalAmount || 0,
        unpaidCount: unpaidStats[0]?.count || 0
      },
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
