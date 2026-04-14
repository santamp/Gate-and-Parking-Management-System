const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createAuditLogFromReq } = require('../utils/auditHelper');

// @desc    Register a new user
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'OCCUPIER'
    });

    if (user) {
      // Audit user creation
      createAuditLogFromReq(req, {
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user._id,
        details: `New user created: ${user.email} (${user.role})`,
        metadata: { name: user.name, email: user.email, role: user.role }
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
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

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    // Audit user update
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'User',
      entityId: updatedUser._id,
      details: `Updated info for user: ${updatedUser.email}`,
      metadata: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userEmail = user.email;
    await user.deleteOne();

    // Audit user deletion
    createAuditLogFromReq(req, {
      action: 'USER_DELETED',
      entity: 'User',
      entityId: req.params.id,
      details: `Admin deleted user: ${userEmail}`,
      metadata: { deletedUserEmail: userEmail }
    });

    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Admin reset user password
// @route   PUT /api/v1/users/:id/reset-password
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

    // Audit password reset
    createAuditLogFromReq(req, {
      action: 'USER_PASSWORD_RESET',
      entity: 'User',
      entityId: user._id,
      details: `Admin reset password for user: ${user.email}`,
      metadata: { targetUserEmail: user.email }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
