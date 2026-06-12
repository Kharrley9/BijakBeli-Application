const Notification = require('../models/Notification');

class NotificationRepository {
  async create(data) {
    return await Notification.create(data);
  }

  async findByUser(userId, options = {}) {
    const { limit = 20 } = options;
    return await Notification.find({ userId })
      .sort('-createdDate')
      .limit(limit);
  }

  async markAsRead(id) {
    return await Notification.findByIdAndUpdate(id, { status: 'read' }, { new: true });
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany({ userId, status: 'unread' }, { status: 'read' });
  }

  async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, status: 'unread' });
  }

  async delete(id) {
    return await Notification.findByIdAndDelete(id);
  }
}

module.exports = new NotificationRepository();
