const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIo } = require('./socket');

const emitNotification = (notification) => {
  try {
    const payload = notification.toObject ? notification.toObject() : notification;
    getIo().to(`user_${payload.recipientId}`).emit('notification:new', payload);
  } catch (error) {
    console.error('Notification socket error:', error.message);
  }
};

const createNotification = async ({
  recipientId,
  recipientRole,
  title,
  message,
  type = 'system',
  priority = 'normal',
  relatedEntity = {},
  metadata = {}
}) => {
  if (!recipientId || !recipientRole || !title || !message) {
    return null;
  }

  const notification = await Notification.create({
    recipientId,
    recipientRole,
    title,
    message,
    type,
    priority,
    relatedEntity,
    metadata
  });

  emitNotification(notification);
  return notification;
};

const createNotificationsForRole = async ({
  role,
  excludeUserId = null,
  title,
  message,
  type = 'system',
  priority = 'normal',
  relatedEntity = {},
  metadata = {}
}) => {
  const users = await User.find({ role }).select('_id role').lean();
  const filteredUsers = users.filter((user) => {
    return !excludeUserId || user._id.toString() !== excludeUserId.toString();
  });

  return Promise.all(filteredUsers.map((user) => createNotification({
    recipientId: user._id,
    recipientRole: user.role,
    title,
    message,
    type,
    priority,
    relatedEntity,
    metadata
  })));
};

module.exports = {
  createNotification,
  createNotificationsForRole
};
