// pages/group/join.js
const { groupApi } = require('../../utils/api');

Page({
  data: {
    inviteCode: '',
    joining: false,
  },

  onCodeInput(e) {
    // 自动转大写
    this.setData({ inviteCode: e.detail.value.toUpperCase() });
  },

  async joinGroup() {
    const code = this.data.inviteCode.trim().toUpperCase();
    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }

    if (code.length !== 6) {
      wx.showToast({ title: '邀请码应为6位', icon: 'none' });
      return;
    }

    this.setData({ joining: true });

    try {
      const res = await groupApi.join({ inviteCode: code });
      if (res.data) {
        getApp().globalData.groupInfo = res.data;
        wx.showToast({ title: '加入成功！', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/group/group' });
        }, 1000);
      }
    } catch (err) {
      this.setData({ joining: false });
      console.error('加入失败:', err);
    }
  },
});
