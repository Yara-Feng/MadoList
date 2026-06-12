// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloudbase-d3gszl77m939b5506',
        traceUser: true,
      });
    }

    // 全局数据
    this.globalData = {
      // 当前用户信息
      userInfo: null,
      // 当前小组信息 (null = 未加入)
      groupInfo: null,
      // 未读通知数
      unreadCount: 0,
      // 是否已登录
      isLoggedIn: false,
      // 登录 Promise（用于等待登录完成）
      loginPromise: null,
    };

    // 自动登录
    this.login();
  },

  /**
   * 微信登录 + 自动注册
   */
  login: function () {
    const that = this;
    this.globalData.loginPromise = new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        data: { action: 'login' },
      }).then(res => {
        if (res.result && res.result.data) {
          const user = res.result.data;
          that.globalData.userInfo = user;
          that.globalData.isLoggedIn = true;
          that.globalData.groupInfo = user.groupInfo || null;
          resolve(user);
        } else {
          reject(new Error('登录失败'));
        }
      }).catch(err => {
        console.error('登录失败:', err);
        reject(err);
      });
    });
    return this.globalData.loginPromise;
  },

  /**
   * 等待登录完成
   */
  waitLogin: function () {
    if (this.globalData.isLoggedIn) {
      return Promise.resolve(this.globalData.userInfo);
    }
    return this.globalData.loginPromise || this.login();
  },

  /**
   * 刷新用户信息
   */
  refreshUserInfo: function () {
    const that = this;
    return wx.cloud.callFunction({
      name: 'user',
      data: { action: 'getProfile' },
    }).then(res => {
      if (res.result && res.result.data) {
        that.globalData.userInfo = res.result.data;
        that.globalData.groupInfo = res.result.data.groupInfo || null;
      }
      return res.result;
    });
  },

  /**
   * 刷新未读通知数
   */
  refreshUnreadCount: function () {
    const that = this;
    return wx.cloud.callFunction({
      name: 'notification',
      data: { action: 'unreadCount' },
    }).then(res => {
      if (res.result && res.result.data !== undefined) {
        that.globalData.unreadCount = res.result.data;
      }
      return res.result;
    }).catch(() => {
      // 静默处理
    });
  },

  /**
   * 设置小组信息
   */
  setGroupInfo: function (groupInfo) {
    this.globalData.groupInfo = groupInfo;
  },
});
