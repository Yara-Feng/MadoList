/**
 * 云函数调用封装
 * 统一处理错误和加载状态
 */

/**
 * 调用云函数
 * @param {string} name - 云函数名称
 * @param {object} data - 传递给云函数的参数
 * @param {object} options - 额外选项
 * @returns {Promise<any>}
 */
function callCloudFunction(name, data = {}, options = {}) {
  const { showLoading = false, loadingText = '加载中...' } = options;

  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  return wx.cloud.callFunction({ name, data })
    .then(res => {
      if (showLoading) wx.hideLoading();
      if (res.result && res.result.success === false) {
        wx.showToast({ title: res.result.errMsg || '操作失败', icon: 'none' });
        return Promise.reject(res.result);
      }
      return res.result;
    })
    .catch(err => {
      if (showLoading) wx.hideLoading();
      console.error(`[API] ${name} error:`, err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      return Promise.reject(err);
    });
}

/**
 * 用户相关 API
 */
const userApi = {
  login: () => callCloudFunction('login', { action: 'login' }),
  getProfile: () => callCloudFunction('user', { action: 'getProfile' }),
  updateProfile: (data) => callCloudFunction('user', { action: 'updateProfile', data })
};

/**
 * 小组相关 API
 */
const groupApi = {
  create: (data) => callCloudFunction('group', { action: 'create', data }),
  join: (data) => callCloudFunction('group', { action: 'join', data }),
  leave: () => callCloudFunction('group', { action: 'leave' }),
  detail: () => callCloudFunction('group', { action: 'detail' }),
  resetCode: () => callCloudFunction('group', { action: 'resetCode' })
};

/**
 * 待办相关 API
 */
const taskApi = {
  create: (data) => callCloudFunction('task', { action: 'create', data }),
  update: (data) => callCloudFunction('task', { action: 'update', data }),
  delete: (taskId) => callCloudFunction('task', { action: 'delete', data: { taskId } }),
  toggle: (taskId) => callCloudFunction('task', { action: 'toggle', data: { taskId } }),
  switchVisibility: (taskId, visibility) => callCloudFunction('task', { action: 'switchVisibility', data: { taskId, visibility } }),
  list: (params) => callCloudFunction('task', { action: 'list', data: params }),
  detail: (taskId) => callCloudFunction('task', { action: 'detail', data: { taskId } }),
  getDates: (year, month) => callCloudFunction('task', { action: 'getDates', data: { year, month } }),
  getByDate: (date, mode) => callCloudFunction('task', { action: 'getByDate', data: { date, mode } })
};

/**
 * 提醒相关 API
 */
const reminderApi = {
  create: (data) => callCloudFunction('reminder', { action: 'create', data })
};

/**
 * 通知相关 API
 */
const notificationApi = {
  list: (params) => callCloudFunction('notification', { action: 'list', data: params }),
  markRead: (notificationId) => callCloudFunction('notification', { action: 'markRead', data: { notificationId } }),
  markAllRead: () => callCloudFunction('notification', { action: 'markAllRead' }),
  unreadCount: () => callCloudFunction('notification', { action: 'unreadCount' })
};

module.exports = {
  callCloudFunction,
  userApi,
  groupApi,
  taskApi,
  reminderApi,
  notificationApi
};
