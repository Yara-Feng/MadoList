// pages/profile/profile.js
const { userApi } = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    groupInfo: null,
    isEditing: false,
    editNickname: '',
  },

  onShow() {
    this.loadProfile();
  },

  async loadProfile() {
    try {
      const app = getApp();
      await app.waitLogin();

      const res = await userApi.getProfile();
      if (res.data) {
        this.setData({
          userInfo: res.data,
          groupInfo: res.data.groupInfo || null,
        });
        app.globalData.userInfo = res.data;
        app.globalData.groupInfo = res.data.groupInfo || null;
      }
    } catch (err) {
      console.error('加载个人资料失败:', err);
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    // 上传到云存储
    wx.showLoading({ title: '上传中...' });
    const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.png`;
    wx.cloud.uploadFile({
      cloudPath,
      filePath: avatarUrl,
    }).then(res => {
      wx.hideLoading();
      return userApi.updateProfile({ avatarUrl: res.fileID });
    }).then(() => {
      return this.loadProfile();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    });
  },

  // 编辑昵称
  startEditNickname() {
    this.setData({
      isEditing: true,
      editNickname: this.data.userInfo.nickname || '',
    });
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ editNickname: e.detail.value });
  },

  // 保存昵称
  async saveNickname() {
    const nickname = this.data.editNickname.trim();
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    try {
      await userApi.updateProfile({ nickname });
      this.setData({ isEditing: false });
      await this.loadProfile();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      console.error('保存昵称失败:', err);
    }
  },

  // 取消编辑
  cancelEdit() {
    this.setData({ isEditing: false });
  },

  // 跳转小组
  goToGroup() {
    wx.navigateTo({ url: '/pages/group/group' });
  },

  // 退出小组
  leaveGroup() {
    wx.showModal({
      title: '确认退出',
      content: '退出小组后，共享待办将不可见。确定退出吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'group',
              data: { action: 'leave' },
            });
            wx.showToast({ title: '已退出小组', icon: 'success' });
            setTimeout(() => {
              this.loadProfile();
            }, 1000);
          } catch (err) {
            console.error('退出小组失败:', err);
          }
        }
      },
    });
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: '关于 MadoList',
      content: '帮助关系平等的用户群体共同维护生活计划。\n\n版本：1.0.0 MVP',
      showCancel: false,
      confirmText: '知道了',
    });
  },
});
