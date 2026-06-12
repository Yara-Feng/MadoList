// pages/group/group.js
const { groupApi } = require('../../utils/api');

Page({
  data: {
    loading: false,
    groupInfo: null,
    userInfo: null,
  },

  onShow() {
    this.loadGroupInfo();
  },

  async loadGroupInfo() {
    this.setData({ loading: true });
    try {
      const app = getApp();
      await app.waitLogin();

      const userRes = await wx.cloud.callFunction({
        name: 'user',
        data: { action: 'getProfile' },
      });

      if (userRes.result && userRes.result.data) {
        this.setData({
          userInfo: userRes.result.data,
          groupInfo: userRes.result.data.groupInfo || null,
          loading: false,
        });
        app.globalData.groupInfo = userRes.result.data.groupInfo || null;
      }
    } catch (err) {
      console.error('加载小组信息失败:', err);
      this.setData({ loading: false });
    }
  },

  // 创建小组
  goToCreate() {
    wx.navigateTo({ url: '/pages/group/create' });
  },

  // 加入小组
  goToJoin() {
    wx.navigateTo({ url: '/pages/group/join' });
  },

  // 查看成员
  goToMembers() {
    wx.navigateTo({ url: '/pages/group/members' });
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

  // 重置邀请码
  resetInviteCode() {
    wx.showModal({
      title: '重置邀请码',
      content: '重置后，旧的邀请码将立即失效。确定重置吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await groupApi.resetCode();
            if (result.data) {
              const groupInfo = { ...this.data.groupInfo, inviteCode: result.data.inviteCode };
              this.setData({ groupInfo });
              getApp().globalData.groupInfo = groupInfo;
              wx.showToast({ title: '邀请码已重置', icon: 'success' });
            }
          } catch (err) {
            console.error('重置失败:', err);
          }
        }
      },
    });
  },

  // 退出小组
  leaveGroup() {
    wx.showModal({
      title: '确认退出',
      content: '退出小组后，共享待办将不可见。确定退出吗？',
      confirmColor: '#D54941',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await groupApi.leave();
            if (result.data) {
              wx.showToast({
                title: result.data.groupDissolved ? '小组已解散' : '已退出小组',
                icon: 'success',
              });
              setTimeout(() => {
                this.loadGroupInfo();
              }, 1000);
            }
          } catch (err) {
            console.error('退出失败:', err);
          }
        }
      },
    });
  },
});
