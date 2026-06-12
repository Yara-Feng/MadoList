const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 微信登录云函数
 * action: 'login' — 获取 openid，查询或自动注册用户
 */
exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'login':
      return await login(openid);
    default:
      return { success: false, errMsg: '未知操作' };
  }
};

/**
 * 登录：查询用户，不存在则自动注册
 */
async function login(openid) {
  try {
    const usersCol = db.collection('users');

    // 查询现有用户
    const { data: users } = await usersCol.where({ _openid: openid }).get();

    if (users.length > 0) {
      const user = users[0];
      // 更新登录时间
      await usersCol.doc(user._id).update({
        data: { updatedAt: new Date() }
      });

      // 如果用户有小组，获取小组信息
      let groupInfo = null;
      if (user.groupId) {
        const { data: groups } = await db.collection('groups')
          .where({ _id: user.groupId })
          .get();
        if (groups.length > 0) {
          groupInfo = groups[0];
        }
      }

      return {
        success: true,
        data: {
          ...user,
          groupInfo,
          isNewUser: false
        }
      };
    }

    // 自动注册新用户
    const newUser = {
      _openid: openid,
      nickname: '微信用户',
      avatarUrl: '',
      groupId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { _id } = await usersCol.add({ data: newUser });
    newUser._id = _id;

    return {
      success: true,
      data: {
        ...newUser,
        groupInfo: null,
        isNewUser: true
      }
    };
  } catch (err) {
    console.error('登录失败:', err);
    return { success: false, errMsg: '登录失败' };
  }
}
