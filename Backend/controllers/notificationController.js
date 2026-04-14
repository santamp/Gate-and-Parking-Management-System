const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');

exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { recipientId: req.user._id };

    if (req.query.unreadOnly === 'true') {
      query.isRead = false;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: req.user._id, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification count',
      error: error.message
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipientId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      updated: result.modifiedCount || 0,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
};

exports.createNotificationForUser = async (req, res) => {
  try {
    const { recipientId, recipientRole, title, message, type, priority, relatedEntity, metadata } = req.body;

    const notification = await createNotification({
      recipientId,
      recipientRole,
      title,
      message,
      type,
      priority,
      relatedEntity,
      metadata
    });

    if (!notification) {
      return res.status(400).json({
        success: false,
        message: 'recipientId, recipientRole, title and message are required'
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};
