const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async create(userId, title, message) {
    return await notificationRepository.create({ userId, title, message });
  }

  async getUserNotifications(userId, options) {
    return await notificationRepository.findByUser(userId, options);
  }

  async markAsRead(id) {
    return await notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  }

  async delete(id) {
    return await notificationRepository.delete(id);
  }
}

module.exports = new NotificationService();
