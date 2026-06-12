// pages/group/members.js
const { groupApi } = require('../../utils/api');

Page({
  data: {
    loading: false,
    groupInfo: null,
    members: [],
  },

  onShow() {
    this.loadMembers();
  },

  async loadMembers() {
    this.setData({ loading: true });
    try {
      const res = await groupApi.detail();
      if (res.data) {
        this.setData({
          groupInfo: res.data,
          members: res.data.members || [],
          loading: false,
        });
      }
    } catch (err) {
      console.error('加载成员列表失败:', err);
      this.setData({ loading: false });
    }
  },

  // 复制邀请码
  copyInviteCode() {
    const code = this.data.groupInfo.inviteCode;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      },
    });
  },
});
