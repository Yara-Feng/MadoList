// pages/tasks/detail.js
const { taskApi, reminderApi } = require('../../utils/api');
const { VISIBILITY, PRIORITY, STATUS } = require('../../utils/constants');

Page({
  data: {
    isCreate: true,
    taskId: null,
    task: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      visibility: 'PERSONAL',
      dueTime: '',
      remindAt: '',
    },
    loading: false,
    isOwner: true,

    // 成员列表（用于提醒）
    members: [],
    showMemberPicker: false,
    selectedMember: null,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isCreate: false, taskId: options.id });
      this.loadTask();
    } else if (options.action === 'create') {
      this.setData({ isCreate: true });
    }
  },

  async loadTask() {
    this.setData({ loading: true });
    try {
      const res = await taskApi.detail(this.data.taskId);
      if (res.data) {
        const task = res.data;
        this.setData({
          task: {
            ...task,
            dueTime: task.dueTime ? this.formatDateForPicker(task.dueTime) : '',
            remindAt: task.remindAt ? this.formatDateForPicker(task.remindAt) : '',
          },
          isOwner: true,
          loading: false,
        });

        // 加载成员列表（用于提醒功能）
        if (task.visibility === 'GROUP') {
          this.loadMembers();
        }
      }
    } catch (err) {
      console.error('加载任务失败:', err);
      this.setData({ loading: false });
    }
  },

  async loadMembers() {
    try {
      const app = getApp();
      if (app.globalData.groupInfo && app.globalData.groupInfo.members) {
        // 过滤掉自己
        const members = app.globalData.groupInfo.members.filter(
          m => m._openid !== app.globalData.userInfo._openid
        );
        this.setData({ members });
      }
    } catch (err) {
      console.error('加载成员失败:', err);
    }
  },

  // 输入处理
  onTitleInput(e) {
    this.setData({ 'task.title': e.detail.value });
  },
  onDescInput(e) {
    this.setData({ 'task.description': e.detail.value });
  },
  onDueTimeChange(e) {
    this.setData({ 'task.dueTime': e.detail.value });
  },
  onRemindAtChange(e) {
    this.setData({ 'task.remindAt': e.detail.value });
  },

  // 选择优先级
  onSelectPriority(e) {
    this.setData({ 'task.priority': e.currentTarget.dataset.value });
  },

  // 切换可见性
  async onSwitchVisibility() {
    if (this.data.isCreate) {
      const newVis = this.data.task.visibility === 'PERSONAL' ? 'GROUP' : 'PERSONAL';
      if (newVis === 'GROUP') {
        const app = getApp();
        if (!app.globalData.groupInfo) {
          wx.showToast({ title: '请先加入小组', icon: 'none' });
          return;
        }
      }
      this.setData({ 'task.visibility': newVis });
    } else {
      const newVis = this.data.task.visibility === 'PERSONAL' ? 'GROUP' : 'PERSONAL';
      wx.showModal({
        title: '切换可见性',
        content: newVis === 'GROUP' ? '切换为小组可见后，组员可以看到此任务。' : '切换为个人可见后，组员将不再能看到此任务。',
        success: async (res) => {
          if (res.confirm) {
            try {
              await taskApi.switchVisibility(this.data.taskId, newVis);
              wx.showToast({ title: '切换成功', icon: 'success' });
              this.setData({ 'task.visibility': newVis });
            } catch (err) {
              console.error('切换失败:', err);
            }
          }
        },
      });
    }
  },

  // 保存待办
  async saveTask() {
    const { task, isCreate, taskId } = this.data;

    if (!task.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }

    // 创建 GROUP 待办时检查
    if (task.visibility === 'GROUP') {
      const app = getApp();
      if (!app.globalData.groupInfo) {
        wx.showToast({ title: '请先加入小组', icon: 'none' });
        return;
      }
    }

    wx.showLoading({ title: isCreate ? '创建中...' : '保存中...' });

    try {
      const payload = {
        title: task.title.trim(),
        description: task.description,
        priority: task.priority,
        visibility: task.visibility,
        dueTime: task.dueTime || null,
        remindAt: task.remindAt || null,
      };

      if (isCreate) {
        await taskApi.create(payload);
        wx.hideLoading();
        wx.showToast({ title: '创建成功', icon: 'success' });
      } else {
        await taskApi.update({ taskId, ...payload });
        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('保存失败:', err);
    }
  },

  // 完成/取消完成
  async toggleStatus() {
    try {
      await taskApi.toggle(this.data.taskId);
      const newStatus = this.data.task.status === 'DONE' ? 'TODO' : 'DONE';
      this.setData({ 'task.status': newStatus });
      wx.showToast({
        title: newStatus === 'DONE' ? '已完成' : '已取消完成',
        icon: 'success',
      });
    } catch (err) {
      console.error('操作失败:', err);
    }
  },

  // 删除待办
  deleteTask() {
    wx.showModal({
      title: '删除待办',
      content: '确定删除这个待办吗？此操作为逻辑删除，数据可恢复。',
      confirmColor: '#D54941',
      success: async (res) => {
        if (res.confirm) {
          try {
            await taskApi.delete(this.data.taskId);
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1000);
          } catch (err) {
            console.error('删除失败:', err);
          }
        }
      },
    });
  },

  // 提醒成员
  showRemindPicker() {
    if (this.data.members.length === 0) {
      wx.showToast({ title: '小组暂无其他成员', icon: 'none' });
      return;
    }
    this.setData({ showMemberPicker: true });
  },

  onSelectMember(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedMember: this.data.members[index],
      showMemberPicker: false,
    });
    this.sendReminder();
  },

  async sendReminder() {
    const { selectedMember, taskId } = this.data;
    if (!selectedMember) return;

    try {
      await reminderApi.create({
        taskId,
        receiverOpenId: selectedMember._openid,
      });
      wx.showToast({ title: '提醒已发送', icon: 'success' });
      this.setData({ selectedMember: null });
    } catch (err) {
      console.error('发送提醒失败:', err);
    }
  },

  // 工具
  formatDateForPicker(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  getPriorityLabel(p) {
    return p === 'HIGH' ? '高' : p === 'MEDIUM' ? '中' : '低';
  },

  getStatusLabel(s) {
    return s === 'DONE' ? '已完成' : '未完成';
  },
});
