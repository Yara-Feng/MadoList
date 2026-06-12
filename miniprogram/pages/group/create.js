// pages/group/create.js
const { groupApi } = require('../../utils/api');

Page({
  data: {
    groupName: '',
    created: false,
    createdGroup: null,
    creating: false,
  },

  onNameInput(e) {
    this.setData({ groupName: e.detail.value });
  },

  async createGroup() {
    const name = this.data.groupName.trim();
    if (!name) {
      wx.showToast({ title: '请输入小组名称', icon: 'none' });
      return;
    }

    if (name.length > 20) {
      wx.showToast({ title: '名称不能超过20个字', icon: 'none' });
      return;
    }

    this.setData({ creating: true });

    try {
      const res = await groupApi.create({ name });
      if (res.data) {
        this.setData({
          created: true,
          createdGroup: res.data,
          creating: false,
        });
        // 更新全局数据
        getApp().globalData.groupInfo = res.data;
      }
    } catch (err) {
      this.setData({ creating: false });
      console.error('创建小组失败:', err);
    }
  },

  // 复制邀请码
  copyInviteCode() {
    const code = this.data.createdGroup.inviteCode;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      },
    });
  },

  // 返回小组页
  goToGroup() {
    wx.redirectTo({ url: '/pages/group/group' });
  },
});
