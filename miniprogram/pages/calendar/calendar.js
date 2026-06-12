// pages/calendar/calendar.js
const { taskApi } = require('../../utils/api');
const { CALENDAR_VIEW, CALENDAR_MODE } = require('../../utils/constants');
const { formatDate, getMonthStart, getMonthEnd } = require('../../utils/date');

Page({
  data: {
    currentView: 'month',     // 'month', 'week', 'day'
    currentMode: 'all',       // 'personal', 'group', 'all'
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentDate: formatDate(new Date()),

    // 有待办的日期
    markedDates: [],
    // 当前选中日期的待办
    dayTasks: [],
    showDayTasks: false,
    selectedDate: '',

    viewOptions: [
      { value: 'month', label: '月' },
      { value: 'week', label: '周' },
      { value: 'day', label: '日' },
    ],
    modeOptions: [
      { value: 'personal', label: '个人' },
      { value: 'group', label: '小组' },
      { value: 'all', label: '全部' },
    ],
  },

  onShow() {
    this.loadMarkedDates();
  },

  // 加载有任务标记的日期
  async loadMarkedDates() {
    try {
      const app = getApp();
      await app.waitLogin();

      const { currentYear, currentMonth, currentMode } = this.data;
      const res = await taskApi.getDates(currentYear, currentMonth);
      if (res.data) {
        this.setData({ markedDates: res.data });
      }
    } catch (err) {
      console.error('加载日历标记失败:', err);
    }
  },

  // 切换视图
  onSwitchView(e) {
    this.setData({ currentView: e.currentTarget.dataset.value });
    if (e.currentTarget.dataset.value === 'day') {
      this.setData({ selectedDate: this.data.currentDate });
      this.loadDayTasks();
    }
  },

  // 切换模式
  onSwitchMode(e) {
    this.setData({ currentMode: e.currentTarget.dataset.value });
    this.loadMarkedDates();
    if (this.data.showDayTasks) {
      this.loadDayTasks();
    }
  },

  // 月份切换
  onPrevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      this.setData({ currentYear: currentYear - 1, currentMonth: 12 });
    } else {
      this.setData({ currentMonth: currentMonth - 1 });
    }
    this.loadMarkedDates();
  },

  onNextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      this.setData({ currentYear: currentYear + 1, currentMonth: 1 });
    } else {
      this.setData({ currentMonth: currentMonth + 1 });
    }
    this.loadMarkedDates();
  },

  // 点击日期
  onSelectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date, showDayTasks: true });
    this.loadDayTasks();
  },

  async loadDayTasks() {
    try {
      const res = await taskApi.getByDate(this.data.selectedDate, this.data.currentMode);
      if (res.data) {
        this.setData({ dayTasks: res.data });
      }
    } catch (err) {
      console.error('加载日期任务失败:', err);
    }
  },

  // 关闭日期详情
  closeDayTasks() {
    this.setData({ showDayTasks: false });
  },

  // 跳转任务详情
  goToDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/tasks/detail?id=${taskId}` });
  },

  // 生成月历网格
  getCalendarGrid() {
    const { currentYear, currentMonth, markedDates, currentDate } = this.data;
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const grid = [];

    // 填充月初空白
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: '', empty: true });
    }

    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({
        day: d,
        date: dateStr,
        isToday: dateStr === currentDate,
        hasTask: markedDates.includes(dateStr),
        empty: false,
      });
    }

    return grid;
  },

  getPriorityClass(p) {
    return p === 'HIGH' ? 'tag-priority-high' : p === 'MEDIUM' ? 'tag-priority-medium' : 'tag-priority-low';
  },

  getPriorityLabel(p) {
    return p === 'HIGH' ? '高' : p === 'MEDIUM' ? '中' : '低';
  },
});
