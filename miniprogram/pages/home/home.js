// pages/home/home.js
const { notificationApi } = require('../../utils/api');
const { STATUS, VISIBILITY, PRIORITY } = require('../../utils/constants');

Page({
  data: {
    userInfo: null,
    groupInfo: null,
    todayTasks: [],
    unreadCount: 0,
    loading: true,
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      const app = getApp();
      await app.waitLogin();

      // 刷新用户信息
      const userRes = await wx.cloud.callFunction({
        name: 'user',
        data: { action: 'getProfile' },
      });

      if (userRes.result && userRes.result.data) {
        const user = userRes.result.data;
        this.setData({
          userInfo: user,
          groupInfo: user.groupInfo || null,
        });
        app.globalData.userInfo = user;
        app.globalData.groupInfo = user.groupInfo || null;
      }

      // 获取今日待办
      await this.loadTodayTasks();

      // 获取未读通知数
      await app.refreshUnreadCount();
      this.setData({ unreadCount: app.globalData.unreadCount });
    } catch (err) {
      console.error('加载首页数据失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadTodayTasks() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'list',
          data: { pageSize: 5, sortBy: 'dueTime', sortOrder: 'asc' },
        },
      });

      if (res.result && res.result.data) {
        const tasks = res.result.data.tasks
          .filter(t => t.status === 'TODO')
          .slice(0, 5);
        this.setData({ todayTasks: tasks });
      }
    } catch (err) {
      console.error('加载今日待办失败:', err);
    }
  },

  // 跳转待办列表
  goToTasks() {
    wx.switchTab({ url: '/pages/tasks/tasks' });
  },

  // 跳转待办详情
  goToTaskDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/tasks/detail?id=${taskId}` });
  },

  // 跳转小组
  goToGroup() {
    wx.navigateTo({ url: '/pages/group/group' });
  },

  // 跳转通知中心
  goToNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' });
  },

  // 跳转日历
  goToCalendar() {
    wx.switchTab({ url: '/pages/calendar/calendar' });
  },

  // 新增待办
  goToCreateTask() {
    wx.navigateTo({ url: '/pages/tasks/detail?action=create' });
  },

  // 获取优先级标签样式
  getPriorityClass(priority) {
    const map = {
      HIGH: 'tag-priority-high',
      MEDIUM: 'tag-priority-medium',
      LOW: 'tag-priority-low',
    };
    return map[priority] || '';
  },

  // 获取优先级文字
  getPriorityLabel(priority) {
    const map = { HIGH: '高', MEDIUM: '中', LOW: '低' };
    return map[priority] || '';
  },
});
