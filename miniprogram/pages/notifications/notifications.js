// pages/notifications/notifications.js
const { notificationApi } = require('../../utils/api');
const { NOTIFICATION_TYPE_LABEL, PAGE_SIZE } = require('../../utils/constants');
const { formatRelativeTime } = require('../../utils/date');

Page({
  data: {
    notifications: [],
    loading: false,
    hasMore: true,
    page: 1,
    refreshing: false,
  },

  onShow() {
    this.loadNotifications(true);
  },

  onPullDownRefresh() {
    this.loadNotifications(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  async loadNotifications(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, refreshing: reset });

    try {
      const app = getApp();
      await app.waitLogin();

      const page = reset ? 1 : this.data.page;
      const res = await notificationApi.list({ page, pageSize: PAGE_SIZE });

      if (res.data) {
        // 格式化时间
        const notifications = res.data.notifications.map(n => ({
          ...n,
          formattedTime: formatRelativeTime(n.createdAt),
          typeLabel: NOTIFICATION_TYPE_LABEL[n.type] || '通知',
        }));

        this.setData({
          notifications: reset ? notifications : [...this.data.notifications, ...notifications],
          hasMore: res.data.hasMore,
          page,
        });
      }

      // 刷新全局未读数
      await app.refreshUnreadCount();
    } catch (err) {
      console.error('加载通知失败:', err);
    } finally {
      this.setData({ loading: false, refreshing: false });
    }
  },

  async loadMore() {
    this.setData({ page: this.data.page + 1 });
    await this.loadNotifications();
  },

  // 标记单条已读并跳转
  async onTapNotification(e) {
    const { index } = e.currentTarget.dataset;
    const notification = this.data.notifications[index];

    try {
      // 标记已读
      if (!notification.isRead) {
        await notificationApi.markRead(notification._id);
        const notifications = this.data.notifications;
        notifications[index].isRead = true;
        this.setData({ notifications });
        getApp().refreshUnreadCount();
      }

      // 跳转关联任务
      if (notification.relatedTaskId) {
        wx.navigateTo({
          url: `/pages/tasks/detail?id=${notification.relatedTaskId}`,
        });
      }
    } catch (err) {
      console.error('操作失败:', err);
    }
  },

  // 全部已读
  async markAllRead() {
    try {
      await notificationApi.markAllRead();
      const notifications = this.data.notifications.map(n => ({
        ...n,
        isRead: true,
      }));
      this.setData({ notifications });
      getApp().globalData.unreadCount = 0;
      getApp().refreshUnreadCount();
      wx.showToast({ title: '已全部标为已读', icon: 'success' });
    } catch (err) {
      console.error('操作失败:', err);
    }
  },
});
