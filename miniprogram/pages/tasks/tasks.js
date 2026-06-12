// pages/tasks/tasks.js
const { taskApi } = require('../../utils/api');
const { STATUS, PRIORITY, SORT_BY, PAGE_SIZE } = require('../../utils/constants');

Page({
  data: {
    tasks: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,

    // 筛选
    filterStatus: '',     // '' = 全部, 'TODO', 'DONE'
    filterPriority: '',   // '' = 全部, 'LOW', 'MEDIUM', 'HIGH'
    filterVisibility: 'ALL', // 'PERSONAL', 'GROUP', 'ALL'

    // 排序
    sortBy: 'createdAt',
    sortOrder: 'desc',

    // 筛选面板
    showFilterPanel: false,
    showSortPanel: false,

    statusOptions: [
      { value: '', label: '全部' },
      { value: 'TODO', label: '未完成' },
      { value: 'DONE', label: '已完成' },
    ],
    priorityOptions: [
      { value: '', label: '全部' },
      { value: 'HIGH', label: '高' },
      { value: 'MEDIUM', label: '中' },
      { value: 'LOW', label: '低' },
    ],
    sortOptions: [
      { value: 'createdAt', label: '创建时间' },
      { value: 'dueTime', label: '截止时间' },
      { value: 'priority', label: '优先级' },
    ],
    visibilityOptions: [
      { value: 'ALL', label: '全部' },
      { value: 'PERSONAL', label: '个人' },
      { value: 'GROUP', label: '小组' },
    ],
  },

  onShow() {
    this.loadTasks(true);
  },

  onPullDownRefresh() {
    this.loadTasks(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  async loadTasks(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, refreshing: reset });

    try {
      const app = getApp();
      await app.waitLogin();

      const page = reset ? 1 : this.data.page;
      const res = await taskApi.list({
        status: this.data.filterStatus || undefined,
        priority: this.data.filterPriority || undefined,
        visibility: this.data.filterVisibility,
        sortBy: this.data.sortBy,
        sortOrder: this.data.sortOrder,
        page,
        pageSize: PAGE_SIZE,
      });

      if (res.data) {
        this.setData({
          tasks: reset ? res.data.tasks : [...this.data.tasks, ...res.data.tasks],
          hasMore: res.data.hasMore,
          page: page,
        });
      }
    } catch (err) {
      console.error('加载待办列表失败:', err);
    } finally {
      this.setData({ loading: false, refreshing: false });
    }
  },

  async loadMore() {
    this.setData({ page: this.data.page + 1 });
    await this.loadTasks();
  },

  // 切换筛选面板
  toggleFilterPanel() {
    this.setData({
      showFilterPanel: !this.data.showFilterPanel,
      showSortPanel: false,
    });
  },

  // 切换排序面板
  toggleSortPanel() {
    this.setData({
      showSortPanel: !this.data.showSortPanel,
      showFilterPanel: false,
    });
  },

  // 选择状态筛选
  onSelectStatus(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ filterStatus: value, showFilterPanel: false });
    this.loadTasks(true);
  },

  // 选择优先级筛选
  onSelectPriority(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ filterPriority: value, showFilterPanel: false });
    this.loadTasks(true);
  },

  // 选择可见性筛选
  onSelectVisibility(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ filterVisibility: value, showFilterPanel: false });
    this.loadTasks(true);
  },

  // 选择排序方式
  onSelectSort(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ sortBy: value, showSortPanel: false });
    this.loadTasks(true);
  },

  // 切换排序方向
  toggleSortOrder() {
    const newOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    this.setData({ sortOrder: newOrder });
    this.loadTasks(true);
  },

  // 跳转详情
  goToDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/tasks/detail?id=${taskId}` });
  },

  // 新建待办
  goToCreate() {
    wx.navigateTo({ url: '/pages/tasks/detail?action=create' });
  },

  // 快速完成/取消完成
  async quickToggle(e) {
    const taskId = e.currentTarget.dataset.id;
    try {
      await taskApi.toggle(taskId);
      // 刷新列表
      const { tasks } = this.data;
      const idx = tasks.findIndex(t => t._id === taskId);
      if (idx >= 0) {
        const task = tasks[idx];
        task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
        this.setData({ tasks });
      }
    } catch (err) {
      console.error('操作失败:', err);
    }
  },

  // 获取优先级样式
  getPriorityClass(priority) {
    const map = { HIGH: 'tag-priority-high', MEDIUM: 'tag-priority-medium', LOW: 'tag-priority-low' };
    return map[priority] || '';
  },

  getPriorityLabel(priority) {
    const map = { HIGH: '高', MEDIUM: '中', LOW: '低' };
    return map[priority] || '';
  },

  getVisibilityLabel(visibility) {
    return visibility === 'GROUP' ? '共享' : '个人';
  },

  getVisibilityClass(visibility) {
    return visibility === 'GROUP' ? 'tag-visibility-group' : 'tag-visibility-personal';
  },

  formatDueTime(dueTime) {
    if (!dueTime) return '';
    const d = new Date(dueTime);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const str = `${month}-${day}`;
    return isToday ? `今天 ${str}` : str;
  },
});
