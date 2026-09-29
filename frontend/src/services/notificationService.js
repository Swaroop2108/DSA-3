import * as storage from './storage';

export const notificationService = {
  getAll: async () => ({ data: { success: true, count: storage.getNotifications().length, notifications: storage.getNotifications() } }),
  markAsRead: async (id) => ({ data: { success: true, notifications: storage.markNotificationRead(id) } }),
  add: async (data) => ({ data: { success: true, notification: storage.addNotification(data) } })
};

export default notificationService;
