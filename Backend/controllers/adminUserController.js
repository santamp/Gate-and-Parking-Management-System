const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createAuditLogFromReq } = require('../utils/auditHelper');

// @desc    Get all users (with search and role filter)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-passwordHash')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Admin reset user password
// @route   PUT /api/v1/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'Please provide new password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Audit: password reset
    createAuditLogFromReq(req, {
      action: 'USER_PASSWORD_RESET',
      entity: 'User',
      entityId: user._id,
      details: `Admin reset password for user: ${user.email}`,
      metadata: { targetUserId: user._id, targetEmail: user.email }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userEmail = user.email;
    await user.deleteOne();

    // Audit: user deleted
    createAuditLogFromReq(req, {
      action: 'USER_DELETED',
      entity: 'User',
      entityId: user._id,
      details: `Admin deleted user: ${userEmail}`,
      metadata: { deletedEmail: userEmail }
    });

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
